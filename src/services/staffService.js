import { supabase } from '../supabaseClient';

// supabase.functions.invoke() puts the function's JSON reply on
// `error.context` (a fetch Response) -- NOT on `data`, and `error.context.error`
// is always undefined. The old code therefore always showed the useless
// "Edge Function returned a non-2xx status code" instead of the real reason
// (e.g. "Username already taken").
async function functionErrorMessage(error, fallback) {
  try {
    const payload = await error.context.json();
    if (payload?.error) return payload.error;
  } catch {
    // No readable body (network down, etc.)
  }
  return fallback;
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .select('id, username, full_name, role, contact_number, availability, position, avatar_url')
    .neq('role', 'Client')
    .order('username', { ascending: true });

  if (error) throw new Error('Failed to fetch users.');
  return { users: data || [] };
}

export async function createStaffUser(username, email, full_name, role, contact_number, availability, position) {
  const { data, error } = await supabase.functions.invoke('create-staff-user', {
    body: {
      username,
      email,
      full_name,
      role,
      contact_number,
      availability,
      position,
      // Where the invite email's link should send them so they can set
      // their own password (see Resetpasswordview.vue).
      redirectTo: `${window.location.origin}/reset-password`,
    },
  });

  if (error) {
    throw new Error(await functionErrorMessage(error, 'Failed to create account.'));
  }
  return data;
}

// Update an existing staff/admin/owner profile's role, contact details, and
// availability. (Username/password are managed via Supabase Auth, not here.)
export async function updateStaffUser(id, { full_name, role, contact_number, availability, position }) {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .update({ full_name, role, contact_number, availability, position })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    // Database rules (owner profile, role changes) raise readable messages -- show them.
    if (error.code === 'P0001' && error.message) throw new Error(error.message);
    if (error.code === '23505') throw new Error('That contact number is already used by another account.');
    if (error.code === 'PGRST116') {
      throw new Error("You don't have permission to edit staff profiles. Only Admin accounts can do this.");
    }
    throw new Error('Failed to update staff member.');
  }
  return data;
}

// Permanently delete a staff/admin/owner account (Admin only; enforced
// again server-side by the edge function). Deleting the auth user cascades
// to tbl_profiles via ON DELETE CASCADE.
export async function deleteStaffUser(userId) {
  const { data, error } = await supabase.functions.invoke('delete-staff-user', {
    body: { user_id: userId },
  });

  if (error) {
    throw new Error(await functionErrorMessage(error, 'Failed to delete account.'));
  }
  return data;
}