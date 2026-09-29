import { reactive } from 'vue';
import { supabase } from '../supabaseClient';
import { cleanItemForm, isLowStock, roundQty } from '../utils/inventory';

// Turns a Supabase/Postgres error into an Error whose .message is safe to show.
// (The old code threw raw errors, and the view read `error.response.data.error`
// -- an axios shape that Supabase never produces -- so users always saw the
// generic "Something went wrong".)
// Flags the UI can show so a missing database migration is never silent.
//   historyMissing : inventory_fixes.sql not run -> adjustments still work but
//                    the reason / note are NOT saved.
//   setCountLegacy : inventory_set_stock.sql not run -> "Set Count" falls back
//                    to read-then-adjust, which is NOT atomic.
export const inventoryStatus = reactive({ historyMissing: false, setCountLegacy: false });

const warned = new Set();
function warnOnce(key, message) {
  if (warned.has(key)) return;
  warned.add(key);
  console.warn(message);
}

function friendly(error, fallback) {
  let message = error?.message || fallback;
  switch (error?.code) {
    case '23505':
      message = 'An item with that name already exists.';
      break;
    case '23503':
      message = 'This item is still used by a package or dish. Remove it from their ingredients first.';
      break;
    case '23514':
      message = 'Invalid value: quantity, threshold and cost cannot be negative.';
      break;
    default:
      break;
  }
  const err = new Error(message);
  err.code = error?.code;
  return err;
}

export async function getAllInventory() {
  const { data, error } = await supabase
    .from('tbl_inventory')
    .select('*')
    .order('item_name', { ascending: true });

  if (error) throw friendly(error, 'Failed to load inventory.');
  return data || [];
}

export async function getInventoryItem(id) {
  const { data, error } = await supabase
    .from('tbl_inventory')
    .select('*')
    .eq('item_id', id)
    .single();

  if (error) throw friendly(error, 'Item not found.');
  return data;
}

export async function createInventoryItem(itemData) {
  const payload = cleanItemForm(itemData); // validates + trims

  const { data, error } = await supabase
    .from('tbl_inventory')
    .insert(payload)
    .select()
    .single();

  if (error) throw friendly(error, 'Failed to create item.');
  return data;
}

// NOTE: quantity is intentionally NOT sent here. Stock changes go through
// adjustInventoryStock / setInventoryStock so a stale edit form can never
// overwrite a deduction that happened while the modal was open (e.g. a
// booking got confirmed and auto-deducted stock).
export async function updateInventoryItem(id, itemData) {
  const payload = cleanItemForm(itemData, { includeQuantity: false });

  const { data, error } = await supabase
    .from('tbl_inventory')
    .update(payload)
    .eq('item_id', id)
    .select()
    .single();

  if (error) throw friendly(error, 'Failed to update item.');
  return data;
}

function isMissingFunction(error) {
  return (
    error?.code === '42883' ||
    error?.code === 'PGRST202' ||
    /could not find the function|does not exist/i.test(error?.message || '')
  );
}

// Shared by adjustInventoryStock (whole numbers only, validated there) and the
// legacy Set Count fallback (which may need a fractional delta when the current
// stock is fractional, e.g. after a booking deducted 0.15 kg x guests).
async function applyDelta(id, delta, reason, note) {
  const logged = await supabase.rpc('adjust_inventory_stock_logged', {
    p_item_id: id,
    p_adjustment: delta,
    p_reason: reason,
    p_note: note,
  });

  if (!logged.error) return logged.data;
  if (!isMissingFunction(logged.error)) {
    throw friendly(logged.error, 'Failed to update stock. Item may not exist or stock is insufficient.');
  }

  // Fallback: original RPC (no history, no reason). Surface this to the UI
  // instead of silently dropping the reason/note the user typed.
  inventoryStatus.historyMissing = true;
  warnOnce(
    'history',
    '[inventory] adjust_inventory_stock_logged is missing -- run inventory_fixes.sql. Reasons/notes are not being saved.'
  );

  const { data, error } = await supabase.rpc('adjust_inventory_stock', {
    p_item_id: id,
    p_adjustment: delta,
  });
  if (error) throw friendly(error, 'Failed to update stock. Item may not exist or stock is insufficient.');
  return data;
}

// Adds (positive) or removes (negative) stock atomically in the database.
// Uses adjust_inventory_stock_logged (also writes a movement-history row) when
// inventory_fixes.sql has been run; falls back to the original RPC otherwise
// (and sets inventoryStatus.historyMissing so the UI can say so).
export async function adjustInventoryStock(id, adjustment, reason = null, note = null) {
  const delta = roundQty(adjustment);
  if (!Number.isInteger(delta) || delta === 0) throw new Error('Enter a whole number greater than 0.');
  return applyDelta(id, delta, reason, note);
}

// "Set exact count" (physical count / correction).
//
// FIXED (race): this used to read the current quantity, compute a delta in JS,
// then apply it -- so a booking confirmed between those two steps left the
// stock wrong. It now calls set_inventory_stock, which locks the row and sets
// the value inside ONE database transaction (see inventory_set_stock.sql).
//
// FIXED (decimals): the old delta went through adjustInventoryStock's
// whole-number check, so a fractional current stock made a perfectly valid
// whole-number count fail with "Enter a whole number greater than 0.".
// The new RPC receives the target itself, so no delta is involved.
export async function setInventoryStock(id, targetQty, note = null) {
  const target = roundQty(targetQty);
  if (!Number.isInteger(target) || target < 0) throw new Error('Count must be a whole number, 0 or more.');

  const { data, error } = await supabase.rpc('set_inventory_stock', {
    p_item_id: id,
    p_target: target,
    p_note: note,
  });

  if (!error) return data;
  if (!isMissingFunction(error)) throw friendly(error, 'Failed to set the count.');

  // inventory_set_stock.sql hasn't been run yet -> old behaviour, but with the
  // fractional-delta problem fixed. Still racy, so flag it.
  inventoryStatus.setCountLegacy = true;
  warnOnce(
    'setcount',
    '[inventory] set_inventory_stock is missing -- run inventory_set_stock.sql. Set Count is using a non-atomic fallback.'
  );

  const current = await getInventoryItem(id);
  const delta = roundQty(target - Number(current.quantity));
  if (delta === 0) return current;
  return applyDelta(id, delta, 'Physical count', note);
}

// How many package / dish ingredient rows use this item. Needed because
// deleting an item that recipes depend on would silently shrink (or break)
// the stock deduction of future bookings, and changing its unit would make
// every "quantity per guest" wrong by 1000x.
export async function getItemUsage(id) {
  const [pk, dish] = await Promise.all([
    supabase.from('tbl_package_ingredients').select('id', { count: 'exact', head: true }).eq('item_id', id),
    supabase.from('tbl_menu_item_ingredients').select('inventory_item_id', { count: 'exact', head: true }).eq('inventory_item_id', id),
  ]);
  if (pk.error) throw friendly(pk.error, 'Failed to check item usage.');
  if (dish.error) throw friendly(dish.error, 'Failed to check item usage.');
  const packages = pk.count || 0;
  const dishes = dish.count || 0;
  return { packages, dishes, total: packages + dishes };
}

export async function deleteInventoryItem(id) {
  const usage = await getItemUsage(id);
  if (usage.total > 0) {
    throw new Error(
      `Can't delete: used in ${usage.packages} package ingredient(s) and ${usage.dishes} dish ingredient(s). Remove it from those first.`
    );
  }

  const { error } = await supabase
    .from('tbl_inventory')
    .delete()
    .eq('item_id', id);

  if (error) throw friendly(error, 'Failed to delete item.');
  return { message: 'Item deleted successfully' };
}

// Latest stock movements for one item. Returns null if the history table
// hasn't been created yet (inventory_fixes.sql not run) so the UI can just
// hide the history section instead of erroring.
export async function getInventoryMovements(id, limit = 10) {
  const { data, error } = await supabase
    .from('tbl_inventory_movements')
    .select('movement_id, delta, reason, note, created_at')
    .eq('item_id', id)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) return null;
  return data || [];
}

// Items at or below their low_stock_threshold. Used by the notification
// bell (see useNotifications.js) to alert Admin/Owner in real time, per the
// study's objective of generating low-stock notifications (1.2.2).
// Only fetches the columns the bell needs.
export async function getLowStockItems() {
  const { data, error } = await supabase
    .from('tbl_inventory')
    .select('item_id, item_name, quantity, low_stock_threshold, unit');

  if (error) throw friendly(error, 'Failed to load low-stock items.');
  return (data || []).filter(isLowStock);
}