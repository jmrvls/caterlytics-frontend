import { supabase } from '../supabaseClient';

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

  const { data, error } = await supabase
    .from('tbl_bookings')
    .insert({
      client_name: bookingData.client_name,
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

  if (error) throw error;
  return data;
}

export async function updateBookingStatus(id, status) {
  const { data, error } = await supabase
    .from('tbl_bookings')
    .update({ booking_status: status })
    .eq('booking_id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBooking(id) {
  const { error } = await supabase
    .from('tbl_bookings')
    .delete()
    .eq('booking_id', id);

  if (error) throw error;
  return { message: 'Booking deleted successfully' };
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