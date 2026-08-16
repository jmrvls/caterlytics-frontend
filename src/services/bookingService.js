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

// Paginated fetch for the Booking Management table (Load More pattern).
// Keeps getAllBookings() untouched for Reports/Dashboard/conflict-check,
// which need the complete dataset to compute correct totals.
export async function getBookingsPage({ offset = 0, limit = 50 } = {}) {
  const { data, error, count } = await supabase
    .from('tbl_bookings')
    .select('*', { count: 'exact' })
    .order('event_date', { ascending: true })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { rows: data || [], total: count ?? 0 };
}

// Lightweight query (single narrow column, not full rows) so the status
// tabs/counters stay accurate even when the table itself hasn't fully
// loaded yet.
export async function getBookingStatusCounts() {
  const { data, error } = await supabase
    .from('tbl_bookings')
    .select('booking_status');

  if (error) throw error;
  const counts = {};
  for (const row of data || []) {
    counts[row.booking_status] = (counts[row.booking_status] || 0) + 1;
  }
  return counts;
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
      `There's already a booking on ${bookingData.event_date} (${existing.client_name}). Please choose another date.`
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
      package_name: bookingData.package_name || null,
      package_id: bookingData.package_id || null,
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
        `Someone else just booked ${bookingData.event_date} while you were submitting. Please choose another date.`
      );
    }
    throw error;
  }
  return data;
}

export async function updateBookingStatus(id, status) {
  // Look at the booking's current status first, so we only deduct stock
  // the *first* time it becomes Confirmed (not on every subsequent edit),
  // and so we know whether stock needs to be restored on cancellation.
  const { data: currentBooking, error: fetchError } = await supabase
    .from('tbl_bookings')
    .select('booking_status, package_name, package_id, guest_count')
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
        'Another booking already exists on the same date. This one can\'t be set to Pending/Confirmed.'
      );
    }
    throw error;
  }

  let stockWarning = null;
  if (status === 'Confirmed' && currentBooking.booking_status !== 'Confirmed') {
    // Booking is being confirmed: deduct ingredients from inventory.
    const failedItems = await adjustStockForBooking(currentBooking.package_name, currentBooking.guest_count, currentBooking.package_id, -1);
    if (failedItems.length > 0) {
      stockWarning = `Stock deduction failed for: ${failedItems.join(', ')}. Please adjust inventory manually.`;
    }
  } else if (status === 'Cancelled' && currentBooking.booking_status === 'Confirmed') {
    // A previously-Confirmed booking is being cancelled: give the
    // deducted ingredients back to inventory.
    const failedItems = await adjustStockForBooking(currentBooking.package_name, currentBooking.guest_count, currentBooking.package_id, 1);
    if (failedItems.length > 0) {
      stockWarning = `Stock restoration failed for: ${failedItems.join(', ')}. Please adjust inventory manually.`;
    }
  }

  return { ...data, stockWarning };
}

// Auto Deduct/Restore Stock: matches the booking's package to its ingredient
// list (tbl_package_ingredients) and adds/subtracts quantity_per_guest x
// guest_count to/from tbl_inventory for each ingredient.
// direction: -1 to deduct (booking confirmed), +1 to restore (booking cancelled).
async function adjustStockForBooking(packageName, guestCount, packageId, direction) {
  const failedItems = [];

  let pkg = null;
  if (packageId) {
    const { data } = await supabase
      .from('tbl_menu_packages')
      .select('package_id')
      .eq('package_id', packageId)
      .maybeSingle();
    pkg = data;
  } else {
    const { data } = await supabase
      .from('tbl_menu_packages')
      .select('package_id')
      .eq('package_name', packageName)
      .maybeSingle();
    pkg = data;
  }

  if (!pkg) return failedItems;

  const { data: ingredients } = await supabase
    .from('tbl_package_ingredients')
    .select('item_id, quantity_per_guest, tbl_inventory(item_name)')
    .eq('package_id', pkg.package_id);

  if (!ingredients || ingredients.length === 0) return failedItems;

  for (const ing of ingredients) {
    const totalNeeded = Number(ing.quantity_per_guest) * Number(guestCount || 1);
    if (totalNeeded > 0) {
      try {
        await adjustInventoryStock(ing.item_id, direction * totalNeeded);
      } catch (err) {
        failedItems.push(ing.tbl_inventory?.item_name || `item_id ${ing.item_id}`);
      }
    }
  }

  return failedItems;
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
  const { data: currentBooking, error: fetchError } = await supabase
    .from('tbl_bookings')
    .select('booking_status, package_name, package_id, guest_count')
    .eq('booking_id', id)
    .single();

  if (fetchError) throw new Error('Failed to cancel booking. Please try again.');

  const { data, error } = await supabase
    .from('tbl_bookings')
    .update({ booking_status: 'Cancelled' })
    .eq('booking_id', id)
    .select()
    .single();

  if (error) throw new Error('Failed to cancel booking. Please try again.');

  // If it was already Confirmed (stock was deducted), give it back.
  if (currentBooking.booking_status === 'Confirmed') {
    await adjustStockForBooking(currentBooking.package_name, currentBooking.guest_count, currentBooking.package_id, 1);
  }

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