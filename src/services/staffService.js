import { supabase } from '../supabaseClient';

export async function getUsers() {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .select('id, username, full_name, role, contact_number, availability, avatar_url')
    .neq('role', 'Client')
    .order('username', { ascending: true });

  if (error) throw new Error('Failed to fetch users.');
  return { users: data || [] };
}

export async function createStaffUser(username, password, full_name, role, contact_number, availability) {
  const { data, error } = await supabase.functions.invoke('create-staff-user', {
    body: { username, password, full_name, role, contact_number, availability },
  });

  if (error) {
    const detail = data?.error || error.context?.error || error.message;
    throw new Error(detail || 'Failed to create account.');
  }
  return data;
}

// Update an existing staff/admin/owner profile's role, contact details, and
// availability. (Username/password are managed via Supabase Auth, not here.)
export async function updateStaffUser(id, { full_name, role, contact_number, availability }) {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .update({ full_name, role, contact_number, availability })
    .eq('id', id)
    .select()
    .single();

  if (error) {
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
    const detail = data?.error || error.context?.error || error.message;
    throw new Error(detail || 'Failed to delete account.');
  }
  return data;
}