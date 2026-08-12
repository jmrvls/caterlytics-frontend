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
  const { data, error } = await supabase.rpc('adjust_inventory_stock', {
    p_item_id: id,
    p_adjustment: adjustment,
  });

  if (error) throw new Error('Failed to update stock. Item may not exist or stock is insufficient.');
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