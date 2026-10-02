import { supabase } from '../supabaseClient';
import { cleanWasteForm } from '../utils/waste';

// Same idea as inventoryService: turn Supabase errors into readable messages.
function isMissingTable(error) {
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    /could not find the table|does not exist/i.test(error?.message || '')
  );
}

function isMissingFunction(error) {
  return (
    error?.code === '42883' ||
    error?.code === 'PGRST202' ||
    /could not find the function/i.test(error?.message || '')
  );
}

function setupError() {
  const err = new Error('Waste tracking is not set up in the database yet. Run waste_tracking.sql in the Supabase SQL Editor.');
  err.code = 'WASTE_NOT_SET_UP';
  return err;
}

// Logs on/after `fromDate` (YYYY-MM-DD). RLS limits this to the caller's business.
export async function getWasteLogs(fromDate) {
  const { data, error } = await supabase
    .from('tbl_waste_logs')
    .select('waste_id, item_id, item_name, unit, quantity, unit_cost, cost_lost, reason, note, waste_date, created_at')
    .gte('waste_date', fromDate)
    .order('waste_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) {
    if (isMissingTable(error)) throw setupError();
    throw new Error(error.message || 'Failed to load waste logs.');
  }
  return data || [];
}

// Records the waste and (optionally) deducts the stock in one DB transaction.
export async function logWaste(form, item) {
  const clean = cleanWasteForm(form, item); // validates + normalizes

  const { data, error } = await supabase.rpc('log_food_waste', {
    p_item_id: Number(clean.item_id),
    p_quantity: clean.quantity,
    p_reason: clean.reason,
    p_note: clean.note,
    p_waste_date: clean.waste_date,
    p_deduct: clean.deduct,
  });

  if (error) {
    if (isMissingFunction(error) || isMissingTable(error)) throw setupError();
    if (error.code === '42501') throw new Error('You do not have permission to log waste.');
    throw new Error(error.message || 'Failed to log waste.');
  }
  return data;
}

// Stock deducted by bookings since `fromDate` (YYYY-MM-DD). Used to work out how
// fast each item is really used, so reorder suggestions aren't based on waste alone.
// Admin / Owner-Manager only (RLS). Waste deductions are skipped here on purpose:
// they already come from the waste logs.
export async function getUsageMovements(fromDate) {
  const fromIso = new Date(`${fromDate}T00:00:00`).toISOString();
  const { data, error } = await supabase
    .from('tbl_inventory_movements')
    .select('item_id, delta, reason, created_at')
    .gte('created_at', fromIso)
    .like('reason', 'Booking%')
    .limit(10000);

  if (error) throw new Error(error.message || 'Failed to load stock usage.');
  return data || [];
}