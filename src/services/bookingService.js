import { supabase } from '../supabaseClient';
import { adjustInventoryStock } from './inventoryService';

export async function getAllBookings() {
  const { data, error } = await supabase
    .from('tbl_bookings')
    .select('*')
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createBooking(bookingData) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in.');

  // Prevent double bookings: block if a Pending or Confirmed reservation
  // already exists on this event date (per the study's own definition of
  // a double booking). This is the actual enforcement, not just a warning.
  const conflict = await checkDateConflict(bookingData.event_date);
  if (conflict.conflict) {
    const existing = conflict.existingBookings[0];
    throw new Error(
      `May existing booking na sa ${bookingData.event_date} (${existing.client_name}). Pumili ng ibang petsa.`
    );
  }

  const { data, error } = await supabase
    .from('tbl_bookings')
    .insert({
      client_name: bookingData.client_name,
      client_email: bookingData.client_email || null,
      event_date: bookingData.event_date,
      event_time: bookingData.event_time,
      event_location: bookingData.event_location,
      guest_count: bookingData.guest_count,
      package_name: bookingData.package_name,
      booking_status: bookingData.booking_status || 'Pending',
      created_by: user.id,
    })
    .select()
    .single();

  if (error) {
    // Race condition: two people submitted for the same date at nearly
    // the same time and both passed the pre-check above. The database's
    // unique index (tbl_bookings_no_double_booking) is the final backstop.
    if (error.code === '23505') {
      throw new Error(
        `Na-book na pala ng iba yung ${bookingData.event_date} habang nagsu-submit ka. Pumili ng ibang petsa.`
      );
    }
    throw error;
  }
  return data;
}

export async function updateBookingStatus(id, status) {
  // Look at the booking's current status first, so we only deduct stock
  // the *first* time it becomes Confirmed (not on every subsequent edit).
  const { data: currentBooking, error: fetchError } = await supabase
    .from('tbl_bookings')
    .select('booking_status, package_name, guest_count')
    .eq('booking_id', id)
    .single();

  if (fetchError) throw fetchError;

  const { data, error } = await supabase
    .from('tbl_bookings')
    .update({ booking_status: status })
    .eq('booking_id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error(
        'May ibang booking na sa parehong petsa. Hindi mo pwedeng gawing Pending/Confirmed ito.'
      );
    }
    throw error;
  }

  if (status === 'Confirmed' && currentBooking.booking_status !== 'Confirmed') {
    await deductStockForBooking(currentBooking.package_name, currentBooking.guest_count);
  }

  return data;
}

// Auto Deduct Stock: matches the booking's package to its ingredient list
// (tbl_package_ingredients) and subtracts quantity_per_guest x guest_count
// from tbl_inventory for each ingredient.
async function deductStockForBooking(packageName, guestCount) {
  try {
    const { data: pkg } = await supabase
      .from('tbl_menu_packages')
      .select('package_id')
      .eq('package_name', packageName)
      .maybeSingle();

    // Custom/unrecognized package name -> nothing to deduct against, skip.
    if (!pkg) return;

    const { data: ingredients } = await supabase
      .from('tbl_package_ingredients')
      .select('item_id, quantity_per_guest')
      .eq('package_id', pkg.package_id);

    if (!ingredients || ingredients.length === 0) return;

    for (const ing of ingredients) {
      const totalNeeded = Number(ing.quantity_per_guest) * Number(guestCount || 1);
      if (totalNeeded > 0) {
        await adjustInventoryStock(ing.item_id, -totalNeeded);
      }
    }
  } catch (err) {
    // Don't block booking confirmation if stock deduction fails for some reason.
    console.error('Auto Deduct Stock failed:', err);
  }
}

export async function deleteBooking(id) {
  const { error } = await supabase
    .from('tbl_bookings')
    .delete()
    .eq('booking_id', id);

  if (error) throw error;
  return { message: 'Booking deleted successfully' };
}

// Client role only - cancel one's own booking. RLS (client cancel own
// booking policy) enforces that a Client can only touch their own
// bookings, only while Pending/Confirmed, and can only move to Cancelled.
export async function cancelMyBooking(id) {
  const { data, error } = await supabase
    .from('tbl_bookings')
    .update({ booking_status: 'Cancelled' })
    .eq('booking_id', id)
    .select()
    .single();

  if (error) throw new Error('Failed to cancel booking. Please try again.');
  return data;
}

// Client role only - own bookings
export async function getMyBookings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in.');

  const { data, error } = await supabase
    .from('tbl_bookings')
    .select('*')
    .eq('created_by', user.id)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// Client-side conflict check before submit
export async function checkDateConflict(eventDate) {
  const allBookings = await getAllBookings();
  const existing = allBookings.filter(
    (b) =>
      b.event_date === eventDate &&
      ['Pending', 'Confirmed'].includes(b.booking_status)
  );
  return {
    conflict: existing.length > 0,
    existingBookings: existing,
  };
}