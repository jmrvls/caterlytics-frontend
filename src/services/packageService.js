import { supabase } from '../supabaseClient';

export async function getAllPackages() {
  const { data, error } = await supabase
    .from('tbl_menu_packages')
    .select('*, tbl_business(business_id, business_name, address, contact_number)')
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

// ---------- Food Costing / Margin ----------

// Cost-per-head, margin-per-head, and margin % for every package, computed
// server-side from tbl_package_ingredients x tbl_inventory.unit_cost
// (see vw_package_costing view). Addresses the study's own interview
// finding that food costing was the most desired/most time-consuming
// feature for the catering owner.
export async function getAllPackageCosting() {
  const { data, error } = await supabase
    .from('vw_package_costing')
    .select('*')
    .order('package_id', { ascending: true });

  if (error) throw new Error('Failed to load package costing.');
  return data || [];
}

// Costing for a single package (used on the package detail/edit view).
export async function getPackageCosting(packageId) {
  const { data, error } = await supabase
    .from('vw_package_costing')
    .select('*')
    .eq('package_id', packageId)
    .single();

  if (error) throw new Error('Failed to load package costing.');
  return data;
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
  const { data, error } = await supabase.rpc('set_package_ingredients', {
    p_package_id: packageId,
    p_ingredients: ingredients,
  });

  if (error) throw new Error('Failed to update package ingredients.');
  return data || [];
}

// ---------- Menu Categories (Main Course / Side Dish / Dessert / Drinks) ----------
// This is the "main module": each package is composed of menu items grouped
// by category, and the client can only pick up to N items per category
// (e.g. Package 1 = choose 2 Main Course, Package 2 = choose 3).

export const MENU_CATEGORIES = ['Main Course', 'Side Dish', 'Dessert', 'Drinks'];

// Full catalog of menu items this business offers, across all packages.
export async function getAllMenuItems() {
  const { data, error } = await supabase
    .from('tbl_menu_items')
    .select('*')
    .order('category', { ascending: true })
    .order('item_name', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createMenuItem(item) {
  const { data, error } = await supabase
    .from('tbl_menu_items')
    .insert({
      item_name: item.item_name,
      category: item.category,
      is_active: item.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateMenuItem(itemId, item) {
  const { data, error } = await supabase
    .from('tbl_menu_items')
    .update({
      item_name: item.item_name,
      category: item.category,
      is_active: item.is_active ?? true,
    })
    .eq('item_id', itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteMenuItem(itemId) {
  const { error } = await supabase.from('tbl_menu_items').delete().eq('item_id', itemId);
  if (error) throw error;
  return { message: 'Menu item deleted successfully' };
}

// The menu setup for one package: which items are offered per category,
// and how many the client may pick per category.
// Returns { limits: [{ category, max_selections }], itemsByCategory: { category: [item_id,...] } }
export async function getPackageMenu(packageId) {
  const [{ data: limits, error: limitsErr }, { data: items, error: itemsErr }] = await Promise.all([
    supabase.from('tbl_package_category_limits').select('category, max_selections').eq('package_id', packageId),
    supabase.from('tbl_package_menu_items').select('category, item_id').eq('package_id', packageId),
  ]);

  if (limitsErr) throw limitsErr;
  if (itemsErr) throw itemsErr;

  const itemsByCategory = {};
  for (const row of items || []) {
    if (!itemsByCategory[row.category]) itemsByCategory[row.category] = [];
    itemsByCategory[row.category].push(row.item_id);
  }

  return { limits: limits || [], itemsByCategory };
}

// Replace a package's whole menu setup atomically.
// categories = [{ category, max_selections, item_ids: [1,2,3] }, ...]
export async function setPackageMenu(packageId, categories) {
  const { data, error } = await supabase.rpc('set_package_menu', {
    p_package_id: packageId,
    p_categories: categories,
  });

  if (error) throw new Error('Failed to update package menu.');
  return data;
}