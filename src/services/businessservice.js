import { supabase } from '../supabaseClient';

// Self-service: a logged-in Client account registers a brand-new catering
// business and is promoted to Owner/Manager of it. All of the actual work
// (creating the tbl_business row, checking the account doesn't already
// belong to a business, promoting the role, and attaching business_id) is
// done atomically inside the public.register_business() Postgres function —
// this just calls it. Returns the new business_id (uuid) on success.
export async function registerBusiness({ business_name, contact_email, contact_number, address }) {
  const { data, error } = await supabase.rpc('register_business', {
    p_business_name: business_name,
    p_contact_email: contact_email || null,
    p_contact_number: contact_number || null,
    p_address: address || null,
  });

  if (error) throw new Error(error.message || 'Failed to register business.');
  return data;
}

// Fetch the business the current user belongs to. RLS ("members view own
// business") scopes this to exactly the caller's own business_id, so no
// filter is needed here — any signed-in member of a business can call this.
// Returns null if the account isn't attached to any business yet (e.g. a
// Client who hasn't registered one).
export async function getMyBusiness() {
  const { data, error } = await supabase
    .from('tbl_business')
    .select('business_id, business_name, owner_id, contact_email, contact_number, address, created_at')
    .maybeSingle();

  if (error) throw new Error('Failed to load business info.');
  return data;
}

// Update business info. RLS ("owner update own business") only allows the
// original registrant (tbl_business.owner_id) to do this — everyone else's
// update is silently rejected by the database (0 rows affected), which we
// surface here as a clear error instead of a confusing "success".
export async function updateMyBusiness(businessId, { business_name, contact_email, contact_number, address }) {
  const { data, error } = await supabase
    .from('tbl_business')
    .update({ business_name, contact_email, contact_number, address })
    .eq('business_id', businessId)
    .select()
    .maybeSingle();

  if (error) throw new Error('Failed to update business info.');
  if (!data) throw new Error('Only the business owner can edit these details.');
  return data;
}