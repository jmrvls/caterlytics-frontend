import { supabase } from '../supabaseClient';
import { toTitleCase } from '../utils/textFormat';

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
  // business_id is only passed by clients (who can't see other clients'
  // bookings); staff/admin/owner rely on the business-scoped read below.
  const conflict = await checkDateConflict(bookingData.event_date, bookingData.business_id || null);
  if (conflict.conflict) {
    const existing = conflict.existingBookings[0];
    throw new Error(
      existing
        ? `There's already a booking on ${bookingData.event_date} (${existing.client_name}). Please choose another date.`
        : `${bookingData.event_date} is already booked with this caterer. Please choose another date.`
    );
  }

  const { data, error } = await supabase
    .from('tbl_bookings')
    .insert({
      client_name: toTitleCase(bookingData.client_name),
      client_email: bookingData.client_email || null,
      event_date: bookingData.event_date,
      event_time: bookingData.event_time,
      event_location: toTitleCase(bookingData.event_location),
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

  // Confirming: stock availability must be checked and deducted atomically
  // with the status change, in a single DB transaction, so a booking can
  // never end up "Confirmed" while ingredients are actually short. If
  // stock is insufficient, the RPC raises and NOTHING is changed.
  if (status === 'Confirmed' && currentBooking.booking_status !== 'Confirmed') {
    const { data, error } = await supabase.rpc('confirm_booking_with_stock_check', {
      p_booking_id: id,
    });

    if (error) {
      if (error.message?.includes('insufficient stock')) {
        throw new Error(error.message.replace(/^.*insufficient stock for /, 'Not enough stock for: '));
      }
      throw error;
    }
    return { ...data, stockWarning: null };
  }

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

  // Stock restore (Cancelled / back to Pending / deleted / guest change) is
  // handled by the database trigger on tbl_bookings, so nothing to do here.
  return { ...data, stockWarning: null };
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
  // If the booking was Confirmed, the database trigger gives the deducted
  // ingredients back to inventory automatically.
  const { data, error } = await supabase
    .from('tbl_bookings')
    .update({ booking_status: 'Cancelled' })
    .eq('booking_id', id)
    .select()
    .single();

  if (error) throw new Error('Failed to cancel booking. Please try again.');
  return data;
}

// Client role only - edit one's own booking, only while still Pending.
// Once Confirmed, inventory has already been deducted against the
// original guest_count/package, so editing is blocked past that point
// (client must Cancel + rebook, which correctly restores stock).
export async function updateMyBooking(id, updates) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in.');

  const { data: currentBooking, error: fetchError } = await supabase
    .from('tbl_bookings')
    .select('booking_status, created_by, event_date')
    .eq('booking_id', id)
    .single();

  if (fetchError) throw new Error('Failed to load booking.');
  if (currentBooking.created_by !== user.id) {
    throw new Error('You can only edit your own bookings.');
  }
  if (currentBooking.booking_status !== 'Pending') {
    throw new Error('Only Pending bookings can be edited. Please cancel and rebook instead.');
  }

  // If the date is changing, re-check for conflicts (excluding this booking).
  if (updates.event_date && updates.event_date !== currentBooking.event_date) {
    const allBookings = await getAllBookings();
    const conflict = allBookings.find(
      (b) =>
        b.booking_id !== id &&
        b.event_date === updates.event_date &&
        ['Pending', 'Confirmed'].includes(b.booking_status)
    );
    if (conflict) {
      throw new Error(
        `There's already a booking on ${updates.event_date} (${conflict.client_name}). Please choose another date.`
      );
    }
  }

  const { data, error } = await supabase
    .from('tbl_bookings')
    .update({
      event_date: updates.event_date,
      event_time: updates.event_time,
      event_location: toTitleCase(updates.event_location),
      guest_count: updates.guest_count,
      package_name: updates.package_name || null,
      package_id: updates.package_id || null,
    })
    .eq('booking_id', id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('Someone else just booked that date. Please choose another date.');
    }
    throw error;
  }
  return data;
}

// Client role only - own bookings
export async function getMyBookings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in.');

  const { data, error } = await supabase
    .from('tbl_bookings')
    .select('*, tbl_payments(payment_id, total_amount, amount_paid, balance, payment_status, payment_date)')
    .eq('created_by', user.id)
    .order('event_date', { ascending: true });

  if (error) throw error;
  return data || [];
}

// ---------- Menu Selections (client's picks within a package) ----------

// The client's currently-saved menu picks for one booking, grouped by category.
export async function getBookingSelections(bookingId) {
  const { data, error } = await supabase
    .from('tbl_booking_selected_items')
    .select('item_id, category, tbl_menu_items(item_name)')
    .eq('booking_id', bookingId);

  if (error) throw error;
  return data || [];
}

// Replace the client's menu picks for a booking, atomically, with the
// per-category limits enforced server-side (set_booking_selected_items).
// selections = [{ item_id }, ...]
export async function setBookingSelections(bookingId, selections) {
  const { data, error } = await supabase.rpc('set_booking_selected_items', {
    p_booking_id: bookingId,
    p_selections: selections,
  });

  if (error) throw new Error(error.message || 'Failed to save menu selections.');
  return data || [];
}

// Dates (no client details) already booked (Pending/Confirmed) for one
// business within a range — powers the calendar view so a client can see
// what's already taken before picking a date, instead of only finding out
// after via checkDateConflict().
export async function getTakenDates(businessId, startDate, endDate) {
  const { data, error } = await supabase.rpc('get_taken_dates', {
    p_business_id: businessId,
    p_start_date: startDate,
    p_end_date: endDate,
  });

  if (error) throw error;
  return (data || []).map((row) => (typeof row === 'string' ? row : row.get_taken_dates));
}

// Client-side conflict check before submit
export async function checkDateConflict(eventDate, businessId = null, excludeBookingId = null) {
  // Clients can only read their OWN bookings (RLS), so they ask the database
  // a yes/no question for a specific business instead. It never returns
  // anyone else's booking details.
  if (businessId) {
    const { data, error } = await supabase.rpc('is_date_taken', {
      p_business_id: businessId,
      p_event_date: eventDate,
      p_exclude_booking_id: excludeBookingId,
    });
    if (error) throw error;
    return { conflict: Boolean(data), existingBookings: [] };
  }

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