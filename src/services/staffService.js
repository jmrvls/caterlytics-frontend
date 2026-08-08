import { supabase } from '../supabaseClient';

export async function getUsers() {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .select('id, username, full_name, role, contact_number, availability')
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

  if (error) throw new Error('Failed to update staff member.');
  return data;
}