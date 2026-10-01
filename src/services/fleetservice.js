import { supabase } from '../supabaseClient';
import { cleanVehicleForm } from '../utils/fleet';

// Same idea as wasteservice: turn "table doesn't exist yet" into one clear error
// the page can react to (it shows a setup banner instead of a broken screen).
function isMissingTable(error) {
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    /could not find the table|does not exist/i.test(error?.message || '')
  );
}

function setupError() {
  const err = new Error('Delivery & Fleet is not set up in the database yet. Run fleet_management.sql in the Supabase SQL Editor.');
  err.code = 'FLEET_NOT_SET_UP';
  return err;
}

function fail(error, fallback) {
  if (isMissingTable(error)) throw setupError();
  if (error?.code === '42501') throw new Error('You do not have permission to do that.');
  if (error?.code === '23505') throw new Error('That already exists (duplicate plate number or booking).');
  throw new Error(error?.message || fallback);
}

// ---------- Settings (base / commissary location) ----------
export async function getFleetSettings() {
  const { data, error } = await supabase
    .from('tbl_fleet_settings')
    .select('business_id, base_name, base_address, base_lat, base_lng, avg_speed_kph')
    .maybeSingle();
  if (error) fail(error, 'Failed to load fleet settings.');
  return data || null;
}

export async function saveFleetSettings(businessId, s) {
  const speed = Number(s.avg_speed_kph);
  if (!Number.isFinite(speed) || speed <= 0 || speed > 120) throw new Error('Average speed must be between 1 and 120 km/h.');
  const lat = s.base_lat === '' || s.base_lat === null ? null : Number(s.base_lat);
  const lng = s.base_lng === '' || s.base_lng === null ? null : Number(s.base_lng);
  if ((lat === null) !== (lng === null)) throw new Error('Set both latitude and longitude for the base, or leave both empty.');
  if (lat !== null && (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180)) {
    throw new Error('Base coordinates are not valid.');
  }
  const row = {
    business_id: businessId,
    base_name: String(s.base_name || '').trim() || 'Main Kitchen',
    base_address: String(s.base_address || '').trim() || null,
    base_lat: lat,
    base_lng: lng,
    avg_speed_kph: speed,
    updated_at: new Date().toISOString(),
  };
  const { data, error } = await supabase
    .from('tbl_fleet_settings')
    .upsert(row, { onConflict: 'business_id' })
    .select()
    .single();
  if (error) fail(error, 'Failed to save settings.');
  return data;
}

// ---------- Vehicles ----------
export async function getVehicles() {
  const { data, error } = await supabase
    .from('tbl_vehicles')
    .select('vehicle_id, name, plate_number, vehicle_type, capacity_kg, status, last_lat, last_lng, last_location_at, notes')
    .order('name', { ascending: true });
  if (error) fail(error, 'Failed to load vehicles.');
  return data || [];
}

export async function createVehicle(form) {
  const clean = cleanVehicleForm(form);
  const { data, error } = await supabase.from('tbl_vehicles').insert(clean).select().single();
  if (error) fail(error, 'Failed to add vehicle.');
  return data;
}

export async function updateVehicle(vehicleId, form) {
  const clean = cleanVehicleForm(form);
  const { data, error } = await supabase
    .from('tbl_vehicles')
    .update(clean)
    .eq('vehicle_id', vehicleId)
    .select()
    .single();
  if (error) fail(error, 'Failed to update vehicle.');
  return data;
}

export async function setVehicleStatus(vehicleId, status) {
  const { error } = await supabase.from('tbl_vehicles').update({ status }).eq('vehicle_id', vehicleId);
  if (error) fail(error, 'Failed to update vehicle status.');
}

export async function updateVehicleLocation(vehicleId, lat, lng) {
  const { error } = await supabase
    .from('tbl_vehicles')
    .update({ last_lat: lat, last_lng: lng, last_location_at: new Date().toISOString() })
    .eq('vehicle_id', vehicleId);
  if (error) fail(error, 'Failed to save location.');
}

// Deliveries keep their history only while the vehicle exists; the FK sets
// vehicle_id to null on delete, so those stops simply become "unassigned".
export async function deleteVehicle(vehicleId) {
  const { error } = await supabase.from('tbl_vehicles').delete().eq('vehicle_id', vehicleId);
  if (error) fail(error, 'Failed to delete vehicle.');
}

// ---------- Drivers ----------
// Drivers are Staff accounts whose position is "Driver" (set in Staff Management).
export async function getDrivers() {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .select('id, full_name, contact_number, availability, position')
    .eq('role', 'Staff')
    .eq('position', 'Driver')
    .order('full_name', { ascending: true });
  if (error) throw new Error('Failed to load drivers.');
  return data || [];
}

// Ids of staff marked unavailable on a given date (Staff Management > schedule).
export async function getUnavailableStaffIds(dateStr) {
  const { data, error } = await supabase
    .from('tbl_staff_unavailability')
    .select('staff_id')
    .eq('unavailable_date', dateStr);
  if (error) return []; // optional info: never block the page on it
  return (data || []).map((r) => r.staff_id);
}

// ---------- Deliveries ----------
const DELIVERY_COLUMNS =
  'delivery_id, booking_id, run_date, vehicle_id, driver_id, stop_order, dest_address, dest_lat, dest_lng, status, leg_km, leg_minutes, delivered_at, notes, ' +
  'tbl_bookings(client_name, event_date, event_time, event_location, guest_count, booking_status)';

export async function getDeliveries(runDate) {
  const { data, error } = await supabase
    .from('tbl_deliveries')
    .select(DELIVERY_COLUMNS)
    .eq('run_date', runDate)
    .order('stop_order', { ascending: true, nullsFirst: false })
    .order('delivery_id', { ascending: true });
  if (error) fail(error, 'Failed to load deliveries.');
  return data || [];
}

// Confirmed bookings from `fromDate` on that are not on the delivery list yet.
export async function getBookingsToSchedule(fromDate) {
  const [bookingsRes, scheduledRes] = await Promise.all([
    supabase
      .from('tbl_bookings')
      .select('booking_id, client_name, event_date, event_time, event_location, guest_count, booking_status')
      .eq('booking_status', 'Confirmed')
      .gte('event_date', fromDate)
      .order('event_date', { ascending: true })
      .order('event_time', { ascending: true }),
    supabase.from('tbl_deliveries').select('booking_id'),
  ]);
  if (bookingsRes.error) throw new Error('Failed to load bookings.');
  if (scheduledRes.error) fail(scheduledRes.error, 'Failed to load deliveries.');
  const taken = new Set((scheduledRes.data || []).map((d) => String(d.booking_id)));
  return (bookingsRes.data || []).filter((b) => !taken.has(String(b.booking_id)));
}

export async function addDelivery(booking, runDate) {
  const { data, error } = await supabase
    .from('tbl_deliveries')
    .insert({
      booking_id: booking.booking_id,
      run_date: runDate || booking.event_date,
      dest_address: booking.event_location || null,
    })
    .select()
    .single();
  if (error) fail(error, 'Failed to add delivery.');
  return data;
}

// patch may contain: vehicle_id, driver_id, status, run_date, notes,
// dest_address, dest_lat, dest_lng.
export async function updateDelivery(deliveryId, patch) {
  const { error } = await supabase.from('tbl_deliveries').update(patch).eq('delivery_id', deliveryId);
  if (error) fail(error, 'Failed to update delivery.');
}

export async function removeDelivery(deliveryId) {
  const { error } = await supabase.from('tbl_deliveries').delete().eq('delivery_id', deliveryId);
  if (error) fail(error, 'Failed to remove delivery.');
}

// updates: [{ delivery_id, stop_order, leg_km, leg_minutes }]
export async function saveRouteOrder(updates) {
  const results = await Promise.all(
    updates.map((u) =>
      supabase
        .from('tbl_deliveries')
        .update({ stop_order: u.stop_order, leg_km: u.leg_km, leg_minutes: u.leg_minutes })
        .eq('delivery_id', u.delivery_id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed) fail(failed.error, 'Failed to save the route.');
}

// ---------- Geocoding ----------
// Free OpenStreetMap Nominatim lookup (no API key). Fine for occasional use from
// a button click; its usage policy asks for at most ~1 request per second.
// Returns { lat, lng } or null when nothing is found.
export async function geocodeAddress(address) {
  const q = String(address || '').trim();
  if (!q) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=ph&q=${encodeURIComponent(q)}`;
    const res = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || !rows.length) return null;
    const lat = Number(rows[0].lat);
    const lng = Number(rows[0].lon);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch {
    return null;
  }
}

// Current position from the device's GPS (used for "Update location").
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('This device does not support location.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(new Error(err.code === 1 ? 'Location permission was denied.' : 'Could not get the current location.')),
      { enableHighAccuracy: true, timeout: 15000 }
    );
  });
}