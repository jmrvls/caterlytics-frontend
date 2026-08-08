import { supabase } from '../supabaseClient';

export async function getUsers() {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .select('id, username, full_name, role')
    .neq('role', 'Client')
    .order('username', { ascending: true });

  if (error) throw new Error('Failed to fetch users.');
  return { users: data || [] };
}

export async function createStaffUser(username, password, full_name, role) {
  const { data, error } = await supabase.functions.invoke('create-staff-user', {
    body: { username, password, full_name, role },
  });

  if (error) {
    const detail = data?.error || error.context?.error || error.message;
    throw new Error(detail || 'Failed to create account.');
  }
  return data;
}