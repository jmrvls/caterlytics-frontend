import { supabase } from '../supabaseClient';
import { toTitleCase } from '../utils/textFormat';

// Fixed tag list so the dietary summary counts are consistent. Anything else
// goes in the free-text "allergies" / "notes" fields.
export const DIETARY_OPTIONS = [
  'Vegetarian',
  'Vegan',
  'Halal',
  'No Pork',
  'No Beef',
  'No Seafood',
  'Gluten-Free',
  'Lactose-Free',
  'Diabetic-Friendly',
  'Kid Meal',
];

export const RSVP_OPTIONS = ['Pending', 'Attending', 'Declined'];

// Row-level security hides rows from a user who may not edit this plan (e.g.
// Staff, who can view but not change it). Supabase then reports success with
// 0 rows changed, so every write below checks that a row was really affected.
const NO_ACCESS_MSG = "You don't have permission to change this event's plan.";
function writeError(error, fallback) {
  if (error?.code === '42501' || error?.code === 'PGRST116') return new Error(NO_ACCESS_MSG);
  return new Error(error?.message || fallback);
}

function cleanPhone(value) {
  return String(value || '').replace(/[\s-]/g, '');
}

function validateGuest(guest) {
  if (!String(guest.full_name || '').trim()) {
    throw new Error('Guest name is required.');
  }
  const phone = cleanPhone(guest.contact_number);
  if (phone && !/^(09\d{9}|\+639\d{9})$/.test(phone)) {
    throw new Error('Enter a valid mobile number, e.g. 09171234567.');
  }
  if (guest.email && !/^\S+@\S+\.\S+$/.test(String(guest.email).trim())) {
    throw new Error('Enter a valid email address.');
  }
  if (guest.rsvp_status && !RSVP_OPTIONS.includes(guest.rsvp_status)) {
    throw new Error('Invalid RSVP status.');
  }
}

function toGuestRow(guest) {
  return {
    full_name: toTitleCase(String(guest.full_name).trim()),
    contact_number: cleanPhone(guest.contact_number) || null,
    email: String(guest.email || '').trim() || null,
    rsvp_status: guest.rsvp_status || 'Pending',
    // A declined guest must not keep a seat.
    table_id: guest.rsvp_status === 'Declined' ? null : guest.table_id || null,
    dietary_preferences: (guest.dietary_preferences || []).filter((d) => DIETARY_OPTIONS.includes(d)),
    allergies: String(guest.allergies || '').trim() || null,
    notes: String(guest.notes || '').trim() || null,
  };
}

// ---------- Bookings eligible for planning ----------
// Pending + Confirmed events from today onward (RLS already scopes to the
// caller's business / own bookings).
export async function getPlannableBookings(fromDate) {
  const { data, error } = await supabase
    .from('tbl_bookings')
    .select('booking_id, client_name, event_date, event_location, guest_count, booking_status')
    .in('booking_status', ['Pending', 'Confirmed'])
    .gte('event_date', fromDate)
    .order('event_date', { ascending: true });

  if (error) throw new Error('Failed to load bookings.');
  return data || [];
}

// ---------- Guests ----------
export async function getGuests(bookingId) {
  const { data, error } = await supabase
    .from('tbl_event_guests')
    .select('*')
    .eq('booking_id', bookingId)
    .order('full_name', { ascending: true });

  if (error) throw new Error('Failed to load guest list.');
  return data || [];
}

export async function addGuest(bookingId, guest) {
  validateGuest(guest);
  const { data, error } = await supabase
    .from('tbl_event_guests')
    .insert({ booking_id: bookingId, ...toGuestRow(guest) })
    .select()
    .single();

  if (error) throw writeError(error, 'Failed to add guest.');
  return data;
}

export async function updateGuest(guestId, guest) {
  validateGuest(guest);
  const { data, error } = await supabase
    .from('tbl_event_guests')
    .update(toGuestRow(guest))
    .eq('guest_id', guestId)
    .select()
    .single();

  if (error) throw writeError(error, 'Failed to update guest.');
  return data;
}

export async function deleteGuest(guestId) {
  const { data, error } = await supabase
    .from('tbl_event_guests')
    .delete()
    .eq('guest_id', guestId)
    .select('guest_id');
  if (error) throw new Error('Failed to remove guest.');
  if (!data || data.length === 0) throw new Error(NO_ACCESS_MSG);
}

// Bulk add from pasted text: one guest per line. Format: "Name" or
// "Name, 09171234567". Returns the inserted rows.
export async function importGuests(bookingId, rawText) {
  const rows = String(rawText || '')
    .split(/\r?\n/)
    .map((line, i) => ({ line: line.trim(), n: i + 1 }))
    .filter((x) => x.line)
    .map(({ line, n }) => {
      // Only the LAST comma part counts as a mobile number, and only if it
      // looks like one. So "Dela Cruz, Juan" stays one name instead of
      // treating "Juan" as a phone number.
      const parts = line.split(',').map((x) => x.trim());
      const last = parts[parts.length - 1];
      const hasPhone = parts.length > 1 && /^\+?[\d\s-]+$/.test(last);
      return {
        full_name: (hasPhone ? parts.slice(0, -1) : parts).join(', '),
        contact_number: hasPhone ? last : '',
        _line: n
      };
    });

  if (rows.length === 0) throw new Error('Nothing to import.');
  rows.forEach((r) => {
    try {
      validateGuest(r);
    } catch (e) {
      throw new Error(`Line ${r._line}: ${e.message}`);
    }
  });

  const { data, error } = await supabase
    .from('tbl_event_guests')
    .insert(rows.map((r) => ({ booking_id: bookingId, ...toGuestRow(r) })))
    .select();

  if (error) throw writeError(error, 'Failed to import guests.');
  return data || [];
}

// ---------- Tables / seating ----------
export async function getTables(bookingId) {
  const { data, error } = await supabase
    .from('tbl_event_tables')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true });

  if (error) throw new Error('Failed to load tables.');
  return data || [];
}

export async function addTable(bookingId, label, capacity) {
  const cap = Number(capacity);
  if (!String(label || '').trim()) throw new Error('Table name is required.');
  if (!Number.isInteger(cap) || cap < 1 || cap > 50) {
    throw new Error('Capacity must be a whole number from 1 to 50.');
  }
  const { data, error } = await supabase
    .from('tbl_event_tables')
    .insert({ booking_id: bookingId, label: String(label).trim(), capacity: cap })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') throw new Error('A table with that name already exists.');
    throw writeError(error, 'Failed to add table.');
  }
  return data;
}

export async function updateTable(tableId, label, capacity) {
  const cap = Number(capacity);
  if (!String(label || '').trim()) throw new Error('Table name is required.');
  if (!Number.isInteger(cap) || cap < 1 || cap > 50) {
    throw new Error('Capacity must be a whole number from 1 to 50.');
  }
  const { data, error } = await supabase
    .from('tbl_event_tables')
    .update({ label: String(label).trim(), capacity: cap })
    .eq('table_id', tableId)
    .select('table_id');

  if (error) {
    if (error.code === '23505') throw new Error('A table with that name already exists.');
    throw new Error('Failed to update table.');
  }
  if (!data || data.length === 0) throw new Error(NO_ACCESS_MSG);
}

// Guests seated here become unassigned (FK is ON DELETE SET NULL).
export async function deleteTable(tableId) {
  const { data, error } = await supabase
    .from('tbl_event_tables')
    .delete()
    .eq('table_id', tableId)
    .select('table_id');
  if (error) throw new Error('Failed to delete table.');
  if (!data || data.length === 0) throw new Error(NO_ACCESS_MSG);
}

// tableId = null unseats the guest. Capacity is enforced here (counts only
// guests who haven't declined) so a table can't be overfilled.
export async function seatGuest(guestId, tableId) {
  if (tableId) {
    const [{ data: table, error: tErr }, { data: seated, error: sErr }] = await Promise.all([
      supabase.from('tbl_event_tables').select('capacity, label').eq('table_id', tableId).single(),
      supabase
        .from('tbl_event_guests')
        .select('guest_id')
        .eq('table_id', tableId)
        .neq('rsvp_status', 'Declined')
        .neq('guest_id', guestId),
    ]);
    if (tErr || sErr) throw new Error('Failed to check table capacity.');
    if ((seated || []).length >= table.capacity) {
      throw new Error(`${table.label} is full (${table.capacity} seats).`);
    }
  }

  const { data, error } = await supabase
    .from('tbl_event_guests')
    .update({ table_id: tableId || null })
    .eq('guest_id', guestId)
    .select('guest_id');

  if (error) throw writeError(error, 'Failed to seat guest.');
  if (!data || data.length === 0) throw new Error(NO_ACCESS_MSG);
}

// ---------- Pure helpers (no DB) ----------
// Counts per dietary tag, plus guests with allergies, among guests who
// haven't declined — this is the headcount the kitchen actually prepares for.
export function summarizeDietary(guests) {
  const active = guests.filter((g) => g.rsvp_status !== 'Declined');
  const counts = {};
  for (const tag of DIETARY_OPTIONS) counts[tag] = 0;
  for (const g of active) {
    for (const tag of g.dietary_preferences || []) {
      if (tag in counts) counts[tag] += 1;
    }
  }
  return {
    total: active.length,
    counts,
    withAllergies: active.filter((g) => g.allergies),
    withRestrictions: active.filter(
      (g) => (g.dietary_preferences || []).length > 0 || g.allergies
    ).length,
  };
}

export function rsvpSummary(guests) {
  const out = { Pending: 0, Attending: 0, Declined: 0 };
  for (const g of guests) out[g.rsvp_status] = (out[g.rsvp_status] || 0) + 1;
  return out;
}