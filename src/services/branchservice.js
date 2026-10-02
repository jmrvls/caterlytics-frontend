import { supabase } from '../supabaseClient';

// Branch data is scoped by RLS to the caller's business; only Admin and
// Owner/Manager can see the overview or change anything.

export async function getBranchOverview() {
  const { data, error } = await supabase.rpc('get_branch_overview');
  if (error) throw new Error('Failed to load branches.');
  return data || [];
}

// Lightweight list for dropdowns (any member of the business can read it).
export async function getActiveBranches() {
  const { data, error } = await supabase
    .from('tbl_branch')
    .select('branch_id, branch_name, is_main')
    .eq('is_active', true)
    .order('is_main', { ascending: false })
    .order('branch_name');
  if (error) throw new Error('Failed to load branches.');
  return data || [];
}

function cleanText(v) {
  const t = (v ?? '').toString().trim();
  return t === '' ? null : t;
}

export async function createBranch(businessId, form) {
  if (!businessId) throw new Error('Your account is not linked to a business.');
  const { data, error } = await supabase
    .from('tbl_branch')
    .insert({
      business_id: businessId,
      branch_name: form.branch_name.trim(),
      address: cleanText(form.address),
      contact_number: cleanText(form.contact_number),
      contact_email: cleanText(form.contact_email),
      is_main: false,
      is_active: true,
    })
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to create branch.');
  return data;
}

export async function updateBranch(branchId, form) {
  const { data, error } = await supabase
    .from('tbl_branch')
    .update({
      branch_name: form.branch_name.trim(),
      address: cleanText(form.address),
      contact_number: cleanText(form.contact_number),
      contact_email: cleanText(form.contact_email),
    })
    .eq('branch_id', branchId)
    .select()
    .single();
  if (error) throw new Error(error.message || 'Failed to update branch.');
  return data;
}

export async function setBranchActive(branchId, isActive) {
  const { error } = await supabase
    .from('tbl_branch')
    .update({ is_active: isActive })
    .eq('branch_id', branchId);
  if (error) throw new Error(error.message || 'Failed to update branch status.');
}

export async function setMainBranch(branchId) {
  const { error } = await supabase.rpc('set_main_branch', { p_branch_id: branchId });
  if (error) throw new Error(error.message || 'Failed to change the main branch.');
}

export async function deleteBranch(branchId) {
  const { error } = await supabase.from('tbl_branch').delete().eq('branch_id', branchId);
  if (error) {
    // Foreign keys stop deletion once bookings, staff, stock or expenses point here.
    if (error.code === '23503') {
      throw new Error('This branch still has bookings, staff, inventory or expense records. Deactivate it instead.');
    }
    throw new Error(error.message || 'Failed to delete branch.');
  }
}