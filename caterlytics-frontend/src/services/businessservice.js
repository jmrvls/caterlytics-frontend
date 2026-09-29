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
    .select('business_id, business_name, owner_id, contact_email, contact_number, address, logo_url, created_at')
    .maybeSingle();

  if (error) throw new Error('Failed to load business info.');
  return data;
}

// Uploads a new business logo and updates tbl_business.logo_url. Reuses the
// same "avatars" storage bucket/RLS as user profile pictures — the folder
// segment just needs to match auth.uid(), which is true here since only the
// business owner (tbl_business.owner_id === auth.uid()) can call this.
export async function uploadBusinessLogo(ownerId, businessId, file) {
  const ext = file.name.split('.').pop();
  const filePath = `${ownerId}/business-logo-${businessId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, cacheControl: '3600' });

  if (uploadError) throw new Error('Failed to upload logo.');

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  // Cache-bust so the new logo shows immediately instead of the browser
  // reusing a stale cached image at the same URL.
  const logo_url = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { data, error } = await supabase
    .from('tbl_business')
    .update({ logo_url })
    .eq('business_id', businessId)
    .select()
    .maybeSingle();

  if (error) throw new Error('Failed to save logo.');
  if (!data) throw new Error('Only the business owner can edit these details.');
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

// Notifications for the caller's own business (e.g. "Your business was
// approved") -- dropped by the Super Admin approving/suspending/rejecting a
// business. Requires get_my_business_notifications() -- see
// supabase_migration_audit_notifications.sql. Returns [] (instead of
// throwing) if that migration hasn't been run yet, so the dashboard doesn't
// break for accounts that don't have it.
export async function getMyBusinessNotifications() {
  const { data, error } = await supabase.rpc('get_my_business_notifications');
  if (error) {
    console.error('Failed to load business notifications:', error.message);
    return [];
  }
  return data || [];
}

export async function markBusinessNotificationRead(notificationId) {
  const { error } = await supabase.rpc('mark_business_notification_read', {
    p_notification_id: notificationId,
  });
  if (error) throw new Error(error.message || 'Failed to mark notification as read.');
}