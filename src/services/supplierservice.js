import { supabase } from '../supabaseClient';
import { cleanSupplierForm, cleanPoForm } from '../utils/suppliers';

// Supplier data is scoped by RLS to the caller's business; only Admin and
// Owner/Manager can read or change anything. Stock is added to Inventory by the
// receive_purchase_order() database function, in the same transaction.

function isMissingSetup(error) {
  return (
    ['42P01', 'PGRST205', '42883', 'PGRST202'].includes(error?.code) ||
    /could not find the (table|function)|does not exist/i.test(error?.message || '')
  );
}

function fail(error, fallback) {
  if (isMissingSetup(error)) {
    const err = new Error('Supplier Management is not set up in the database yet. Run supplier_management.sql in the Supabase SQL Editor.');
    err.code = 'SUPPLIERS_NOT_SET_UP';
    return err;
  }
  let message = error?.message || fallback;
  if (error?.code === '23505') message = 'A supplier with that name already exists.';
  if (error?.code === '23503') message = 'This supplier still has purchase orders. Mark it inactive instead of deleting it.';
  if (error?.code === '42501') message = 'You do not have permission to do that.';
  const err = new Error(message);
  err.code = error?.code;
  return err;
}

export async function getSuppliers() {
  const { data, error } = await supabase.from('tbl_suppliers').select('*').order('supplier_name', { ascending: true });
  if (error) throw fail(error, 'Failed to load suppliers.');
  return data || [];
}

export async function createSupplier(form) {
  const { data, error } = await supabase.from('tbl_suppliers').insert(cleanSupplierForm(form)).select().single();
  if (error) throw fail(error, 'Failed to create supplier.');
  return data;
}

export async function updateSupplier(id, form) {
  const { data, error } = await supabase.from('tbl_suppliers').update(cleanSupplierForm(form)).eq('supplier_id', id).select().single();
  if (error) throw fail(error, 'Failed to update supplier.');
  return data;
}

export async function setSupplierActive(id, isActive) {
  const { error } = await supabase.from('tbl_suppliers').update({ is_active: isActive }).eq('supplier_id', id);
  if (error) throw fail(error, 'Failed to update supplier.');
}

export async function deleteSupplier(id) {
  const { error } = await supabase.from('tbl_suppliers').delete().eq('supplier_id', id);
  if (error) throw fail(error, 'Failed to delete supplier.');
}

// Orders come with their supplier and lines in one request.
export async function getPurchaseOrders() {
  const { data, error } = await supabase
    .from('tbl_purchase_orders')
    .select('*, supplier:tbl_suppliers(supplier_name, contact_person, contact_number), items:tbl_purchase_order_items(*)')
    .order('created_at', { ascending: false })
    .limit(500);
  if (error) throw fail(error, 'Failed to load purchase orders.');
  return (data || []).map((po) => ({ ...po, items: (po.items || []).sort((a, b) => a.po_item_id - b.po_item_id) }));
}

// Creates (no po_id) or edits a draft. markOrdered places the order straight away.
export async function savePurchaseOrder(form, { markOrdered = false } = {}) {
  const { data, error } = await supabase.rpc('save_purchase_order', { ...cleanPoForm(form), p_mark_ordered: markOrdered });
  if (error) throw fail(error, 'Failed to save purchase order.');
  return data;
}

// Draft -> Ordered, or Draft/Ordered -> Cancelled. (Received goes through receivePurchaseOrder.)
export async function setPurchaseOrderStatus(id, status) {
  const { error } = await supabase.from('tbl_purchase_orders').update({ status }).eq('po_id', id);
  if (error) throw fail(error, 'Failed to update the order.');
}

export async function deletePurchaseOrder(id) {
  const { error } = await supabase.from('tbl_purchase_orders').delete().eq('po_id', id);
  if (error) throw fail(error, 'Failed to delete the order.');
}

// lines: [{ po_item_id, qty }] = how many of each item arrived now.
export async function receivePurchaseOrder(id, lines, { close = false, note = null, receivedDate = null } = {}) {
  const arrived = lines.map((l) => ({ po_item_id: l.po_item_id, qty: Number(l.qty) || 0 })).filter((l) => l.qty > 0);
  if (!arrived.length && !close) throw new Error('Enter how many items arrived.');
  const { data, error } = await supabase.rpc('receive_purchase_order', {
    p_po_id: id,
    p_lines: arrived,
    p_close: close,
    p_note: note || null,
    p_received_date: receivedDate || null,
  });
  if (error) throw fail(error, 'Failed to receive the delivery.');
  return data;
}