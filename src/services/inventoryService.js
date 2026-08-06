import { supabase } from '../supabaseClient';

export async function getAllInventory() {
  const { data, error } = await supabase
    .from('tbl_inventory')
    .select('*')
    .order('item_id', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createInventoryItem(itemData) {
  const { data, error } = await supabase
    .from('tbl_inventory')
    .insert({
      item_name: itemData.item_name,
      quantity: itemData.quantity,
      low_stock_threshold: itemData.low_stock_threshold,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateInventoryItem(id, itemData) {
  const { data, error } = await supabase
    .from('tbl_inventory')
    .update({
      item_name: itemData.item_name,
      quantity: itemData.quantity,
      low_stock_threshold: itemData.low_stock_threshold,
    })
    .eq('item_id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function adjustInventoryStock(id, adjustment) {
  const { data: current, error: fetchError } = await supabase
    .from('tbl_inventory')
    .select('quantity')
    .eq('item_id', id)
    .single();

  if (fetchError) throw fetchError;

  const newQuantity = current.quantity + adjustment;

  const { data, error } = await supabase
    .from('tbl_inventory')
    .update({ quantity: newQuantity })
    .eq('item_id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteInventoryItem(id) {
  const { error } = await supabase
    .from('tbl_inventory')
    .delete()
    .eq('item_id', id);

  if (error) throw error;
  return { message: 'Item deleted successfully' };
}