import { supabase } from '../supabaseClient';

// All three of these are gated server-side by private.get_my_role() = 'Super Admin'
// inside the RPCs themselves (see migration), so there is no client-side role
// check standing between a compromised session and these calls -- the database
// is the actual boundary. A non-Super-Admin caller just gets empty rows / a
// raised exception, never another tenant's data.

export async function getPlatformStats() {
  const { data, error } = await supabase.rpc('get_platform_stats');
  if (error) throw new Error(error.message || 'Failed to load platform stats.');
  // security-definer table function returns 0 rows if the caller isn't
  // Super Admin (the WHERE clause filters it out) -- treat that the same
  // as "nothing to show" rather than throwing.
  return data?.[0] || {
    total_businesses: 0, pending_businesses: 0, active_businesses: 0,
    suspended_businesses: 0, total_owners: 0, total_staff: 0, total_clients: 0,
  };
}

export async function getPlatformBusinesses() {
  const { data, error } = await supabase.rpc('get_platform_businesses');
  if (error) throw new Error(error.message || 'Failed to load businesses.');
  return data || [];
}

export async function setBusinessStatus(businessId, status) {
  const { error } = await supabase.rpc('set_business_status', {
    p_business_id: businessId,
    p_status: status,
  });
  if (error) throw new Error(error.message || 'Failed to update business status.');
}

// Audit trail for one business's status changes (who approved/rejected/
// suspended it, and when). Requires the get_business_status_audit() RPC —
// see supabase_migration_audit_notifications.sql.
export async function getBusinessStatusAudit(businessId) {
  const { data, error } = await supabase.rpc('get_business_status_audit', {
    p_business_id: businessId,
  });
  if (error) throw new Error(error.message || 'Failed to load audit trail.');
  return data || [];
}

// ---------- Business drill-down (Details modal) ----------
// Lets Super Admin see the actual staff/packages/bookings rows behind a
// business's counts, not just the numbers. Requires the
// get_business_*_list() RPCs -- see supabase_migration_business_drilldown.sql.
export async function getBusinessStaffList(businessId) {
  const { data, error } = await supabase.rpc('get_business_staff_list', {
    p_business_id: businessId,
  });
  if (error) throw new Error(error.message || 'Failed to load staff list.');
  return data || [];
}

export async function getBusinessPackagesList(businessId) {
  const { data, error } = await supabase.rpc('get_business_packages_list', {
    p_business_id: businessId,
  });
  if (error) throw new Error(error.message || 'Failed to load packages list.');
  return data || [];
}

export async function getBusinessBookingsList(businessId) {
  const { data, error } = await supabase.rpc('get_business_bookings_list', {
    p_business_id: businessId,
  });
  if (error) throw new Error(error.message || 'Failed to load bookings list.');
  return data || [];
}

// ---------- Tenant lifecycle (subscription expiry, renewal, inactivity) ----------
// Requires tenant_lifecycle.sql. Returns null (instead of throwing) when that
// script has not been run yet, so the rest of the dashboard keeps working.
export async function getTenantLifecycle() {
  const { data, error } = await supabase.rpc('get_tenant_lifecycle');
  if (error) {
    console.error('Tenant lifecycle not available:', error.message);
    return null;
  }
  return data || [];
}

// Adds N months to the subscription (counted from today or the current
// expiry, whichever is later). Returns the new expiry date (YYYY-MM-DD).
export async function renewBusinessSubscription(businessId, months = 1) {
  const { data, error } = await supabase.rpc('renew_business_subscription', {
    p_business_id: businessId,
    p_months: months,
  });
  if (error) throw new Error(error.message || 'Failed to renew the subscription.');
  return data;
}

// Sets an exact expiry date (or clears it with null).
export async function setBusinessExpiry(businessId, date) {
  const { error } = await supabase.rpc('set_business_expiry', {
    p_business_id: businessId,
    p_date: date || null,
  });
  if (error) throw new Error(error.message || 'Failed to set the expiry date.');
}

// ---------- Multi-tenant analytics ----------
// One row per (month, business): { month, business_id, bookings, completed,
// cancelled, guests, revenue }. Requires tenant_analytics.sql. Returns null
// (instead of throwing) when that script has not been run yet.
export async function getTenantAnalytics(fromDate, toDate) {
  const { data, error } = await supabase.rpc('get_tenant_analytics_monthly', {
    p_from: fromDate,
    p_to: toDate,
  });
  if (error) {
    console.error('Tenant analytics not available:', error.message);
    return null;
  }
  return (data || []).map((r) => ({
    ...r,
    bookings: Number(r.bookings) || 0,
    completed: Number(r.completed) || 0,
    cancelled: Number(r.cancelled) || 0,
    guests: Number(r.guests) || 0,
    revenue: Number(r.revenue) || 0,
  }));
}

// ---------- Platform-wide audit log ----------
// Every tenant's data changes + sign-ins/exports in one feed. Requires
// platform_audit_log.sql. Gated server-side to Super Admin (the RPC raises
// for anyone else), same as the rest of this file.
export async function getPlatformAuditLog({
  limit = 25, offset = 0, source = null, business = null, action = null,
  table = null, search = null, from = null, to = null,
} = {}) {
  const { data, error } = await supabase.rpc('get_platform_audit_log', {
    p_limit: limit,
    p_offset: offset,
    p_source: source || null,
    p_business: business || null,
    p_action: action || null,
    p_table: table || null,
    p_search: search?.trim() || null,
    p_from: from || null,
    p_to: to || null,
  });
  if (error) throw new Error(error.message || 'Failed to load the platform audit log.');
  const rows = data || [];
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}