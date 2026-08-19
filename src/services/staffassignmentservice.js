import { supabase } from '../supabaseClient';

// Staff members selectable for event assignment (role = 'Staff' only --
// Admin/Owner-Manager are managers, not field staff to schedule on events).
export async function getAssignableStaff() {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .select('id, full_name, contact_number, availability, position')
    .eq('role', 'Staff')
    .order('full_name', { ascending: true });

  if (error) throw new Error('Failed to load staff list.');
  return data || [];
}

// Assigned staff for a single booking (used when opening the Assign Staff modal).
export async function getAssignedStaff(bookingId) {
  const { data, error } = await supabase
    .from('tbl_booking_staff')
    .select('staff_id, tbl_profiles(id, full_name, contact_number, availability)')
    .eq('booking_id', bookingId);

  if (error) throw new Error('Failed to load assigned staff.');
  return (data || []).map((row) => row.tbl_profiles).filter(Boolean);
}

// Assigned staff for many bookings at once (used to show staff chips in the
// bookings table without firing one query per row).
export async function getAssignedStaffForBookings(bookingIds) {
  if (!bookingIds || bookingIds.length === 0) return {};

  const { data, error } = await supabase
    .from('tbl_booking_staff')
    .select('booking_id, staff_id, tbl_profiles(id, full_name)')
    .in('booking_id', bookingIds);

  if (error) throw new Error('Failed to load staff assignments.');

  const map = {};
  for (const row of data || []) {
    if (!map[row.booking_id]) map[row.booking_id] = [];
    if (row.tbl_profiles) map[row.booking_id].push(row.tbl_profiles);
  }
  return map;
}

// Checks whether any of the given staff members are already assigned to a
// *different* Pending/Confirmed booking on the same event date -- the staff
// equivalent of the client-facing double-booking check.
export async function getStaffScheduleConflicts(eventDate, staffIds, excludeBookingId = null) {
  if (!eventDate || !staffIds || staffIds.length === 0) return [];

  let query = supabase
    .from('tbl_booking_staff')
    .select('staff_id, tbl_profiles(full_name), tbl_bookings!inner(booking_id, client_name, event_date, booking_status)')
    .in('staff_id', staffIds)
    .eq('tbl_bookings.event_date', eventDate)
    .in('tbl_bookings.booking_status', ['Pending', 'Confirmed']);

  if (excludeBookingId) {
    query = query.neq('tbl_bookings.booking_id', excludeBookingId);
  }

  const { data, error } = await query;
  if (error) throw new Error('Failed to check staff availability.');

  return (data || []).map((row) => ({
    staff_id: row.staff_id,
    staff_name: row.tbl_profiles?.full_name || 'Unknown',
    conflicting_client: row.tbl_bookings?.client_name,
  }));
}

// Replaces the full staff assignment set for a booking with the given list
// of staff IDs (diffs against what's already there so we don't churn rows
// unnecessarily).
export async function setBookingStaff(bookingId, staffIds) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in.');

  const { data: existingRows, error: fetchError } = await supabase
    .from('tbl_booking_staff')
    .select('staff_id')
    .eq('booking_id', bookingId);

  if (fetchError) throw new Error('Failed to load current staff assignments.');

  const existingIds = new Set((existingRows || []).map((r) => r.staff_id));
  const nextIds = new Set(staffIds || []);

  const toAdd = [...nextIds].filter((id) => !existingIds.has(id));
  const toRemove = [...existingIds].filter((id) => !nextIds.has(id));

  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('tbl_booking_staff')
      .delete()
      .eq('booking_id', bookingId)
      .in('staff_id', toRemove);
    if (deleteError) throw new Error('Failed to remove staff assignment(s).');
  }

  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from('tbl_booking_staff')
      .insert(toAdd.map((staff_id) => ({ booking_id: bookingId, staff_id, assigned_by: user.id })));
    if (insertError) {
      if (insertError.code === '23505') {
        throw new Error('One or more staff members are already assigned to this event.');
      }
      throw new Error('Failed to assign staff.');
    }
  }

  return { added: toAdd.length, removed: toRemove.length };
}

// Staff role: their own upcoming assigned events, for the "My Events" card
// on the Staff dashboard.
export async function getMyAssignedBookings() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in.');

  const todayStr = new Date().toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('tbl_booking_staff')
    .select('tbl_bookings!inner(booking_id, client_name, event_date, event_time, event_location, booking_status)')
    .eq('staff_id', user.id)
    .gte('tbl_bookings.event_date', todayStr)
    .in('tbl_bookings.booking_status', ['Pending', 'Confirmed'])
    .order('event_date', { referencedTable: 'tbl_bookings', ascending: true });

  if (error) throw new Error('Failed to load your assigned events.');
  return (data || []).map((row) => row.tbl_bookings).filter(Boolean);
}

// --- Per-date availability (leave/time-off schedule) ---
// Separate from tbl_profiles.availability (a general status flag). This
// table answers "is this staff member free on this specific date", which
// is what booking-time conflict checks actually need.

export async function getUnavailableDates(staffId) {
  const { data, error } = await supabase
    .from('tbl_staff_unavailability')
    .select('id, unavailable_date, reason')
    .eq('staff_id', staffId)
    .order('unavailable_date', { ascending: true });

  if (error) throw new Error('Failed to load unavailable dates.');
  return data || [];
}

export async function addUnavailableDate(staffId, date, reason = null) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('You must be logged in.');

  const { data, error } = await supabase
    .from('tbl_staff_unavailability')
    .insert({ staff_id: staffId, unavailable_date: date, reason, created_by: user.id })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      throw new Error('That date is already marked unavailable.');
    }
    throw new Error('Failed to add unavailable date.');
  }
  return data;
}

export async function removeUnavailableDate(id) {
  const { error } = await supabase
    .from('tbl_staff_unavailability')
    .delete()
    .eq('id', id);

  if (error) throw new Error('Failed to remove unavailable date.');
  return { success: true };
}

// Bulk lookup: which of the given staff IDs are marked unavailable on the
// given date. Used at booking-time so the picker/conflict-check can flag
// leave days, not just other event assignments.
export async function getUnavailableStaffOnDate(eventDate, staffIds) {
  if (!eventDate || !staffIds || staffIds.length === 0) return [];

  const { data, error } = await supabase
    .from('tbl_staff_unavailability')
    .select('staff_id, reason, tbl_profiles(full_name)')
    .eq('unavailable_date', eventDate)
    .in('staff_id', staffIds);

  if (error) throw new Error('Failed to check staff schedules.');

  return (data || []).map((row) => ({
    staff_id: row.staff_id,
    staff_name: row.tbl_profiles?.full_name || 'Unknown',
    reason: row.reason,
  }));
}