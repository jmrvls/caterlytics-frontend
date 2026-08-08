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

// ---------- Package Ingredients (for Auto Deduct Stock) ----------

// Get the ingredient list (with item names) for one package.
export async function getPackageIngredients(packageId) {
  const { data, error } = await supabase
    .from('tbl_package_ingredients')
    .select('id, item_id, quantity_per_guest, tbl_inventory(item_name, quantity)')
    .eq('package_id', packageId);

  if (error) throw error;
  return data || [];
}

// Replace the full ingredient list for a package with a new one.
// ingredients = [{ item_id, quantity_per_guest }, ...]
export async function setPackageIngredients(packageId, ingredients) {
  const { error: deleteError } = await supabase
    .from('tbl_package_ingredients')
    .delete()
    .eq('package_id', packageId);

  if (deleteError) throw deleteError;

  const rows = ingredients
    .filter((i) => i.item_id && Number(i.quantity_per_guest) > 0)
    .map((i) => ({
      package_id: packageId,
      item_id: i.item_id,
      quantity_per_guest: i.quantity_per_guest,
    }));

  if (rows.length === 0) return [];

  const { data, error } = await supabase
    .from('tbl_package_ingredients')
    .insert(rows)
    .select();

  if (error) throw error;
  return data;
}