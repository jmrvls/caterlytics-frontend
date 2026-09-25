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