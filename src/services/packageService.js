import { supabase } from '../supabaseClient';

export async function getAllPackages() {
  const { data, error } = await supabase
    .from('tbl_menu_packages')
    .select('*')
    .order('package_id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createPackage(packageData) {
  const { data, error } = await supabase
    .from('tbl_menu_packages')
    .insert({
      package_name: packageData.package_name,
      description: packageData.description,
      price_per_head: packageData.price_per_head,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePackage(id, packageData) {
  const { data, error } = await supabase
    .from('tbl_menu_packages')
    .update({
      package_name: packageData.package_name,
      description: packageData.description,
      price_per_head: packageData.price_per_head,
    })
    .eq('package_id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePackage(id) {
  const { error } = await supabase
    .from('tbl_menu_packages')
    .delete()
    .eq('package_id', id);

  if (error) throw error;
  return { message: 'Package deleted successfully' };
}