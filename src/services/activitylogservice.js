import { supabase } from '../supabaseClient';

// ---------------------------------------------------------------------------
// Audit Logs & Activity Tracking
//
// Two things feed this page, both already live in the database:
//   1) Data changes (who created / edited / deleted bookings, packages,
//      inventory, payments, staff, ...) -> tbl_audit_log, read through the
//      get_owner_audit_log() / get_owner_audit_actors() RPCs. The RPCs
//      themselves check that the caller is an Admin / Owner-Manager and
//      scope every row to their own business, so no client-side role check
//      is the real boundary -- the database is.
//   2) Sign-ins, sign-outs and exports -> tbl_audit_logs, written by
//      log_activity() and read with a normal RLS-protected select.
// ---------------------------------------------------------------------------

// Friendly names for the raw table names stored in the log.
export const TABLE_LABELS = {
  tbl_bookings: 'Booking',
  tbl_payments: 'Payment',
  tbl_menu_packages: 'Package',
  tbl_menu_items: 'Menu item',
  tbl_inventory: 'Inventory',
  tbl_addons: 'Add-on',
  tbl_expenses: 'Expense',
  tbl_suppliers: 'Supplier',
  tbl_purchase_orders: 'Purchase order',
  tbl_pricing_rules: 'Pricing rule',
  tbl_promo_codes: 'Promo code',
  tbl_loyalty_settings: 'Loyalty settings',
  tbl_legal_documents: 'Legal document',
  tbl_waste_logs: 'Waste log',
  tbl_profiles: 'Staff / user',
  tbl_booking_staff: 'Staff assignment',
  tbl_branch: 'Branch',
  tbl_business: 'Business profile',
  tbl_reviews: 'Review reply',
};

export const ACTION_LABELS = { INSERT: 'Created', UPDATE: 'Updated', DELETE: 'Deleted' };

export async function getAuditLog({ limit = 25, offset = 0, table = null, action = null, actor = null, from = null, to = null } = {}) {
  const { data, error } = await supabase.rpc('get_owner_audit_log', {
    p_limit: limit,
    p_offset: offset,
    p_table: table || null,
    p_action: action || null,
    p_actor: actor || null,
    p_from: from || null,
    p_to: to || null,
  });
  if (error) throw new Error(error.message || 'Failed to load the audit log.');
  const rows = data || [];
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

export async function getAuditActors() {
  const { data, error } = await supabase.rpc('get_owner_audit_actors');
  if (error) throw new Error(error.message || 'Failed to load staff list.');
  return data || [];
}

// Sign-in / sign-out / export events for the caller's business.
export async function getActivityLog({ limit = 25, offset = 0, action = null, actor = null, from = null, to = null } = {}) {
  let q = supabase
    .from('tbl_audit_logs')
    .select('log_id, actor_id, actor_name, actor_role, action, entity, summary, created_at', { count: 'exact' })
    .in('action', ['LOGIN', 'LOGOUT', 'EXPORT'])
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);
  if (action) q = q.eq('action', action);
  if (actor) q = q.eq('actor_id', actor);
  if (from) q = q.gte('created_at', from);
  if (to) q = q.lte('created_at', to);
  const { data, error, count } = await q;
  if (error) throw new Error(error.message || 'Failed to load activity.');
  return { rows: data || [], total: count || 0 };
}

// Best-effort: never let a logging failure break login/logout/export.
export async function logActivity(action, entity = 'Auth', summary = null) {
  try {
    await supabase.rpc('log_activity', { p_action: action, p_entity: entity, p_summary: summary });
  } catch (e) {
    console.warn('Activity log failed:', e?.message || e);
  }
}

// Turns one change row into a short human-readable list of what changed.
const SKIP_KEYS = new Set(['created_at', 'updated_at']);
export function describeChange(row) {
  const o = row.old_data || {};
  const n = row.new_data || {};
  if (row.action === 'INSERT') return summarize(n);
  if (row.action === 'DELETE') return summarize(o);
  const keys = [...new Set([...Object.keys(o), ...Object.keys(n)])].filter(k => !SKIP_KEYS.has(k));
  return keys
    .filter(k => JSON.stringify(o[k]) !== JSON.stringify(n[k]))
    .map(k => ({ key: k, from: o[k], to: n[k] }));
}

function summarize(obj) {
  const pick = ['booking_status', 'package_name', 'item_name', 'full_name', 'role', 'branch_name',
    'description', 'category', 'amount', 'amount_paid', 'payment_status', 'event_date', 'guest_count', 'quantity']
    .filter(k => obj[k] !== undefined && obj[k] !== null);
  return pick.map(k => ({ key: k, from: undefined, to: obj[k] }));
}