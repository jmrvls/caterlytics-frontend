import { supabase } from '../supabaseClient';
import { toTitleCase } from '../utils/textFormat';
import { localToday } from '../utils/date';
import { getPlatformSettings, checkBookingRules, checkCancellation } from './platformSettingsService';

// Mirrors the database CHECK (guest_count_positive) so users get a clear message.
export const MAX_GUESTS = 5000;

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
//
// Status + search are applied IN THE QUERY (not on the loaded rows), so a
// filter or a search finds matches anywhere in the table, not just in the
// pages that happen to be loaded already.
//
// Order: newest event date first, so upcoming events are on page 1 instead of
// years of past Completed/Cancelled bookings. `booking_id` is a tiebreaker:
// without it, rows sharing a date can repeat or vanish between pages.
export async function getBookingsPage({ offset = 0, limit = 50, status = '', search = '' } = {}) {
  let query = supabase
    .from('tbl_bookings')
    .select('*', { count: 'exact' });

  if (status) query = query.eq('booking_status', status);

  // Strip characters that have meaning inside a PostgREST .or() filter.
  const term = String(search || '').replace(/[%,()*\\]/g, ' ').trim();
  if (term) {
    query = query.or(`client_name.ilike.%${term}%,client_contact_number.ilike.%${term}%`);
  }

  const { data, error, count } = await query
    .order('event_date', { ascending: false })
    .order('booking_id', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return { rows: data || [], total: count ?? 0 };
}

// One head-only COUNT per status (no rows downloaded), so the numbers stay
// exact even past Supabase's 1000-row default limit, and the status tabs stay
// accurate even when the table itself hasn't fully loaded.
const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];

export async function getBookingStatusCounts() {
  const results = await Promise.all(
    BOOKING_STATUSES.map((status) =>
      supabase
        .from('tbl_bookings')
        .select('booking_id', { count: 'exact', head: true })
        .eq('booking_status', status)
    )
  );

  const counts = {};
  results.forEach((res, i) => {
    if (res.error) throw res.error;
    counts[BOOKING_STATUSES[i]] = res.count ?? 0;
  });
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
  // The client's own mobile number. Staff/admin-created bookings must pass it,
  // otherwise the database falls back to the *creator's* number (the admin's).
  // Clients booking for themselves leave it empty and the database fills it
  // from their profile.
  const guestCount = Number(bookingData.guest_count);
  if (!String(bookingData.client_name || '').trim()) {
    throw new Error('Client name is required.');
  }
  if (!Number.isInteger(guestCount) || guestCount < 1) {
    throw new Error('Guest count must be a whole number of at least 1.');
  }
  if (guestCount > MAX_GUESTS) {
    throw new Error(`Guest count cannot be more than ${MAX_GUESTS.toLocaleString()}.`);
  }
  if (!bookingData.event_date) {
    throw new Error('Event date is required.');
  }
  // Same rule as the database trigger (trg_booking_date_guard); the date
  // input's min= can be bypassed, this and the trigger cannot.
  if (bookingData.event_date < localToday()) {
    throw new Error('Event date cannot be in the past.');
  }
  // Super Admin's platform-wide booking rules (global_config.sql). Lead time /
  // advance limits are for clients (the only callers that pass business_id);
  // the guest cap applies to everyone. The database trigger is the real
  // enforcement -- this just gives a clear message first.
  {
    const { settings } = await getPlatformSettings();
    const ruleError = checkBookingRules(settings, {
      event_date: bookingData.business_id ? bookingData.event_date : undefined,
      guest_count: guestCount,
    });
    if (ruleError) throw new Error(ruleError);
  }

  const contactNumber = String(bookingData.client_contact_number || '').replace(/[\s-]/g, '');
  if (contactNumber && !/^(09\d{9}|\+639\d{9})$/.test(contactNumber)) {
    throw new Error('Enter a valid mobile number, e.g. 09171234567.');
  }

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
      client_contact_number: contactNumber || null,
      event_date: bookingData.event_date,
      event_time: bookingData.event_time,
      event_location: toTitleCase(bookingData.event_location),
      guest_count: guestCount,
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

  // A booking can only be marked Completed once it has been Confirmed.
  // Confirming is what enforces a complete menu and the stock check, so
  // this stops a booking from skipping straight to Completed without them.
  if (status === 'Completed' && currentBooking.booking_status !== 'Confirmed' && currentBooking.booking_status !== 'Completed') {
    throw new Error('Only a Confirmed booking can be marked Completed. Confirm it first (the menu must be complete).');
  }

  // Confirming: stock availability must be checked and deducted atomically
  // with the status change, in a single DB transaction, so a booking can
  // never end up "Confirmed" while ingredients are actually short. If
  // stock is insufficient, the RPC raises and NOTHING is changed.
  // A Completed booking already has its stock deducted (it was Confirmed
  // first), so moving Completed -> Confirmed is a plain status change. Running
  // the RPC again would deduct the same ingredients a second time.
  if (status === 'Confirmed' && currentBooking.booking_status !== 'Confirmed' && currentBooking.booking_status !== 'Completed') {
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

// How many inventory items are currently deducted for a booking (rows in
// tbl_booking_stock). Used only for the "N items deducted / returned" messages.
// Returns null when it can't be determined (e.g. no read access), so the UI
// falls back to a generic message instead of showing a wrong number.
export async function getBookingStockCount(bookingId) {
  const { count, error } = await supabase
    .from('tbl_booking_stock')
    .select('item_id', { count: 'exact', head: true })
    .eq('booking_id', bookingId);

  if (error || !count) return null;
  return count;
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
  // Platform cancellation policy: online cancellation closes N days before the
  // event (set by the Super Admin). The database trigger enforces the same rule.
  const { data: existing } = await supabase
    .from('tbl_bookings')
    .select('event_date')
    .eq('booking_id', id)
    .maybeSingle();
  if (existing?.event_date) {
    const { settings } = await getPlatformSettings();
    const rule = checkCancellation(settings, existing.event_date);
    if (!rule.allowed) throw new Error(rule.message);
  }

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
    .select('booking_status, created_by, event_date, quoted_total, promo_code, loyalty_points_used')
    .eq('booking_id', id)
    .single();

  if (fetchError) throw new Error('Failed to load booking.');
  if (currentBooking.created_by !== user.id) {
    throw new Error('You can only edit your own bookings.');
  }
  if (currentBooking.booking_status !== 'Pending') {
    throw new Error('Only Pending bookings can be edited. Please cancel and rebook instead.');
  }

  const newGuests = Number(updates.guest_count);
  if (!Number.isInteger(newGuests) || newGuests < 1) {
    throw new Error('Guest count must be a whole number of at least 1.');
  }
  if (newGuests > MAX_GUESTS) {
    throw new Error(`Guest count cannot be more than ${MAX_GUESTS.toLocaleString()}.`);
  }
  if (updates.event_date && updates.event_date !== currentBooking.event_date && updates.event_date < localToday()) {
    throw new Error('Event date cannot be in the past.');
  }
  {
    const { settings } = await getPlatformSettings();
    const ruleError = checkBookingRules(settings, {
      event_date: updates.event_date && updates.event_date !== currentBooking.event_date ? updates.event_date : undefined,
      guest_count: newGuests,
    });
    if (ruleError) throw new Error(ruleError);
  }

  // If the date is changing, re-check for conflicts (excluding this booking).
  // Must be scoped to the booking's business: a client can only read their own
  // bookings (RLS), so scanning getAllBookings() both missed other clients'
  // bookings and falsely blocked dates used by their own bookings elsewhere.
  // Without a business_id we skip the pre-check; the database unique index
  // (23505, handled below) remains the final backstop.
  if (updates.event_date && updates.event_date !== currentBooking.event_date && updates.business_id) {
    const conflict = await checkDateConflict(updates.event_date, updates.business_id, id);
    if (conflict.conflict) {
      throw new Error(
        `${updates.event_date} is already booked with this caterer. Please choose another date.`
      );
    }
  }

  const { data, error } = await supabase
    .from('tbl_bookings')
    .update({
      event_date: updates.event_date,
      event_time: updates.event_time,
      event_location: toTitleCase(updates.event_location),
      guest_count: newGuests,
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

  // The guest count, date or package just changed, so the price the client was
  // quoted earlier is out of date. Clients can't write price columns directly
  // (a database trigger resets them), so ask the server to re-price the booking
  // with the same promo code / loyalty points it already had. p_strict=false
  // means a promo that no longer applies (e.g. different caterer) is dropped
  // instead of blocking the edit.
  if (currentBooking.quoted_total !== null && currentBooking.quoted_total !== undefined) {
    const { error: repriceError } = await supabase.rpc('apply_booking_pricing', {
      p_booking_id: id,
      p_promo_code: currentBooking.promo_code || null,
      p_points: currentBooking.loyalty_points_used || 0,
      p_strict: false,
    });
    if (repriceError) {
      throw new Error('Your booking was saved, but the price could not be updated. Please contact the caterer.');
    }
    const { data: repriced } = await supabase
      .from('tbl_bookings')
      .select('*')
      .eq('booking_id', id)
      .single();
    if (repriced) return repriced;
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

// For the admin Booking Management page: which Pending bookings still have an
// incomplete menu (so the "Confirmed" option can be disabled up front instead
// of failing after the click). Uses the same rule the client form and the
// confirm_booking_with_stock_check RPC use: per category, the client must pick
// min(package limit, dishes offered) items.
// Returns { [booking_id]: [{ category, need }, ...] } -- only bookings with gaps.
// The database stays the source of truth; this is just for the UI.
export async function getMenuGapsForBookings(bookings) {
  const pending = (bookings || []).filter((b) => b.booking_status === 'Pending' && b.package_id);
  if (pending.length === 0) return {};

  const bookingIds = pending.map((b) => b.booking_id);
  const packageIds = [...new Set(pending.map((b) => b.package_id))];

  const [picksRes, limitsRes, offeredRes] = await Promise.all([
    supabase.from('tbl_booking_selected_items').select('booking_id, category').in('booking_id', bookingIds),
    supabase.from('tbl_package_category_limits').select('package_id, category, max_selections').in('package_id', packageIds),
    supabase.from('tbl_package_menu_items').select('package_id, category').in('package_id', packageIds),
  ]);
  if (picksRes.error) throw picksRes.error;
  if (limitsRes.error) throw limitsRes.error;
  if (offeredRes.error) throw offeredRes.error;

  const count = (rows, keyFn) => {
    const m = {};
    for (const r of rows || []) m[keyFn(r)] = (m[keyFn(r)] || 0) + 1;
    return m;
  };
  const picked = count(picksRes.data, (r) => `${r.booking_id}|${r.category}`);
  const offered = count(offeredRes.data, (r) => `${r.package_id}|${r.category}`);

  const gaps = {};
  for (const b of pending) {
    const missing = [];
    for (const l of limitsRes.data || []) {
      if (l.package_id !== b.package_id) continue;
      const available = offered[`${l.package_id}|${l.category}`] || 0;
      if (l.max_selections <= 0 || available === 0) continue;
      const need = Math.min(l.max_selections, available) - (picked[`${b.booking_id}|${l.category}`] || 0);
      if (need > 0) missing.push({ category: l.category, need });
    }
    if (missing.length) gaps[b.booking_id] = missing;
  }
  return gaps;
}

// ---------- Menu Selections (client's picks within a package) ----------

// Serving size per picked dish. The database derives the multiplier from the
// label (Small 0.75, Regular 1, Large 1.25) and uses it for stock deduction and
// the kitchen prep list. The package price stays per head.
export const PORTIONS = [
  { value: 'Small', label: 'Small' },
  { value: 'Regular', label: 'Regular' },
  { value: 'Large', label: 'Large' },
];

// The client's currently-saved menu picks for one booking, grouped by category.
export async function getBookingSelections(bookingId) {
  const { data, error } = await supabase
    .from('tbl_booking_selected_items')
    .select('item_id, category, portion, tbl_menu_items(item_name)')
    .eq('booking_id', bookingId);

  if (error) throw error;
  return data || [];
}

// Saved menu picks for many bookings at once (one query), for display on the
// My Bookings cards and the admin Booking Management list.
// Returns { [booking_id]: [{ item_id, item_name, category, portion }, ...] }
export async function getSelectionsForBookings(bookingIds) {
  const ids = [...new Set((bookingIds || []).filter(Boolean))];
  if (ids.length === 0) return {};

  const { data, error } = await supabase
    .from('tbl_booking_selected_items')
    .select('booking_id, item_id, category, portion, tbl_menu_items(item_name)')
    .in('booking_id', ids);

  if (error) throw error;

  const map = {};
  for (const r of data || []) {
    (map[r.booking_id] ||= []).push({
      item_id: r.item_id,
      item_name: r.tbl_menu_items?.item_name || 'Unnamed dish',
      category: r.category,
      portion: r.portion || 'Regular',
    });
  }
  return map;
}

// Replace the client's menu picks for a booking, atomically, with the
// per-category limits enforced server-side (set_booking_selected_items).
// selections = [{ item_id, portion? }, ...]  (portion: 'Small' | 'Regular' | 'Large', default 'Regular')
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
      b.booking_id !== excludeBookingId &&
      ['Pending', 'Confirmed'].includes(b.booking_status)
  );
  return {
    conflict: existing.length > 0,
    existingBookings: existing,
  };
}