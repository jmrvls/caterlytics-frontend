import { supabase } from '../supabaseClient';

// ---------- Add-Ons Catalog (Admin/Owner side) ----------
// A business's list of extra items/services sold on top of a package
// (e.g. "Extra Lechon", "Extra Waiter", "Photobooth"). Scoped to the
// caller's own business by RLS — no business_id filter needed here, same
// convention as getAllMenuItems() in packageService.js.

export async function getMyAddons() {
  const { data, error } = await supabase
    .from('tbl_addons')
    .select('*')
    .order('addon_name', { ascending: true });

  if (error) throw new Error('Failed to load add-ons.');
  return data || [];
}

export async function createAddon(addon) {
  const { data, error } = await supabase
    .from('tbl_addons')
    .insert({
      addon_name: addon.addon_name,
      description: addon.description || null,
      price: addon.price,
      unit_label: addon.unit_label || 'per booking',
      is_active: addon.is_active ?? true,
    })
    .select()
    .single();

  if (error) throw new Error('Failed to create add-on.');
  return data;
}

export async function updateAddon(addonId, addon) {
  const { data, error } = await supabase
    .from('tbl_addons')
    .update({
      addon_name: addon.addon_name,
      description: addon.description || null,
      price: addon.price,
      unit_label: addon.unit_label || 'per booking',
      is_active: addon.is_active ?? true,
    })
    .eq('addon_id', addonId)
    .select()
    .single();

  if (error) throw new Error('Failed to update add-on.');
  return data;
}

export async function deleteAddon(addonId) {
  const { error } = await supabase.from('tbl_addons').delete().eq('addon_id', addonId);
  if (error) throw new Error('Failed to delete add-on.');
  return { message: 'Add-on deleted successfully' };
}

// ---------- Browsing (Client side) ----------
// Active add-ons offered by one specific business, shown while the client
// is filling out a booking for that business.

export async function getBusinessAddons(businessId) {
  const { data, error } = await supabase
    .from('tbl_addons')
    .select('addon_id, addon_name, description, price, unit_label')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('addon_name', { ascending: true });

  if (error) throw new Error('Failed to load add-ons.');
  return data || [];
}

// ---------- Per-Booking Selections ----------

// The add-ons currently attached to one booking, with quantity + snapshot price.
export async function getBookingAddons(bookingId) {
  const { data, error } = await supabase
    .from('tbl_booking_addons')
    .select('booking_addon_id, addon_id, addon_name, unit_price, quantity, subtotal')
    .eq('booking_id', bookingId)
    .order('booking_addon_id', { ascending: true });

  if (error) throw new Error('Failed to load booking add-ons.');
  return data || [];
}

// Replace a booking's whole add-on list atomically. Price is snapshotted
// server-side from tbl_addons (never trusts a client-supplied price), and
// the RPC itself enforces that only the booking's own client, while it's
// still Pending, may call this.
// addons = [{ addon_id, quantity }, ...]
export async function setBookingAddons(bookingId, addons) {
  const { data, error } = await supabase.rpc('set_booking_addons', {
    p_booking_id: bookingId,
    p_addons: addons,
  });

  if (error) throw new Error(error.message || 'Failed to save add-ons.');
  return data || [];
}

// Convenience: total ₱ across a list of booking add-ons (as returned by
// getBookingAddons), used wherever an Est. Total needs to include them.
export function sumAddons(addons) {
  return (addons || []).reduce((sum, a) => sum + Number(a.subtotal ?? a.unit_price * a.quantity), 0);
}