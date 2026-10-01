// Delivery & Fleet helpers. Everything here is pure (no Supabase, no Vue) so it
// can be unit-tested on its own.

export const VEHICLE_TYPES = ['Van', 'Truck', 'Motorcycle', 'Car'];
export const VEHICLE_STATUSES = ['Available', 'On Delivery', 'Maintenance', 'Inactive'];
export const DELIVERY_STATUSES = ['Scheduled', 'Loading', 'En Route', 'Delivered', 'Failed'];

// Straight-line distance x ROAD_FACTOR approximates real road distance.
// These are ESTIMATES (no live traffic). The "Open in Google Maps" button gives
// the driver real turn-by-turn navigation.
export const ROAD_FACTOR = 1.35;
export const DEFAULT_SPEED_KPH = 30; // Metro Manila-ish average with traffic
export const SERVICE_MIN = 15; // unloading time per stop
export const SETUP_BUFFER_MIN = 30; // food should arrive this long before the event

export function hasCoords(p) {
  return (
    p != null &&
    p.lat !== null && p.lat !== undefined && p.lat !== '' &&
    p.lng !== null && p.lng !== undefined && p.lng !== '' &&
    Number.isFinite(Number(p.lat)) && Number.isFinite(Number(p.lng))
  );
}

export function haversineKm(a, b) {
  const R = 6371;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(Number(b.lat) - Number(a.lat));
  const dLng = toRad(Number(b.lng) - Number(a.lng));
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(Number(a.lat))) * Math.cos(toRad(Number(b.lat))) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(s)));
}

export const roadKm = (a, b) => haversineKm(a, b) * ROAD_FACTOR;

// Accepts "14.6760, 121.0437", "14.676 121.0437", or a Google Maps URL that
// contains "@14.676,121.0437" or "?q=14.676,121.0437".
export function parseLatLng(text) {
  const s = String(text || '').trim();
  if (!s) return null;
  const m =
    s.match(/@(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
    s.match(/(?:q|ll|query)=(-?\d+(?:\.\d+)?),\s*(-?\d+(?:\.\d+)?)/) ||
    s.match(/^(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)$/);
  if (!m) return null;
  const lat = Number(m[1]);
  const lng = Number(m[2]);
  if (!Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  return { lat, lng };
}

// Total estimated road km for: start -> stops (in the given order) [-> start].
export function routeDistanceKm(start, stops, returnToBase = false) {
  if (!stops.length) return 0;
  let km = 0;
  let prev = start;
  for (const s of stops) {
    km += roadKm(prev, s);
    prev = s;
  }
  if (returnToBase) km += roadKm(prev, start);
  return km;
}

function nearestNeighbor(start, stops) {
  const left = stops.slice();
  const out = [];
  let cur = start;
  while (left.length) {
    let bi = 0;
    let bd = Infinity;
    left.forEach((s, i) => {
      const d = haversineKm(cur, s);
      if (d < bd) { bd = d; bi = i; }
    });
    const [next] = left.splice(bi, 1);
    out.push(next);
    cur = next;
  }
  return out;
}

// 2-opt: keep reversing a segment while it shortens the route.
function twoOpt(start, order, returnToBase) {
  let best = order.slice();
  let bestKm = routeDistanceKm(start, best, returnToBase);
  let improved = true;
  let guard = 0;
  while (improved && guard++ < 200) {
    improved = false;
    for (let i = 0; i < best.length - 1; i++) {
      for (let j = i + 1; j < best.length; j++) {
        const cand = best.slice(0, i).concat(best.slice(i, j + 1).reverse(), best.slice(j + 1));
        const km = routeDistanceKm(start, cand, returnToBase);
        if (km + 1e-9 < bestKm) {
          best = cand;
          bestKm = km;
          improved = true;
        }
      }
    }
  }
  return best;
}

export function timeToMinutes(t) {
  if (!t) return null;
  const m = String(t).match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

export function minutesToClock(min) {
  if (min === null || min === undefined || !Number.isFinite(min)) return '—';
  const total = Math.round(min);
  const day = Math.floor(total / 1440);
  const m = ((total % 1440) + 1440) % 1440;
  let h = Math.floor(m / 60);
  const mm = String(m % 60).padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${h}:${mm} ${ap}${day > 0 ? ' (+1d)' : ''}`;
}

// stops: [{ id, lat, lng, event_time? }]. Returns the stops in best order.
//   mode 'shortest'   -> nearest-neighbour + 2-opt (least distance)
//   mode 'event_time' -> earliest event first (distance is a tie-breaker only)
export function optimizeRoute(start, stops, { returnToBase = false, mode = 'shortest' } = {}) {
  if (stops.length <= 1) return stops.slice();
  if (mode === 'event_time') {
    return stops.slice().sort((a, b) => {
      const ta = timeToMinutes(a.event_time) ?? 1e9;
      const tb = timeToMinutes(b.event_time) ?? 1e9;
      if (ta !== tb) return ta - tb;
      return haversineKm(start, a) - haversineKm(start, b);
    });
  }
  return twoOpt(start, nearestNeighbor(start, stops), returnToBase);
}

// Walk the route and compute leg km / minutes / ETA per stop plus a "late" flag.
// departMin = minutes after midnight the van leaves the base.
export function evaluateRoute(start, stops, departMin, speedKph = DEFAULT_SPEED_KPH) {
  const speed = Number(speedKph) > 0 ? Number(speedKph) : DEFAULT_SPEED_KPH;
  let clock = departMin;
  let prev = start;
  return stops.map((s) => {
    const legKm = roadKm(prev, s);
    const legMin = (legKm / speed) * 60;
    const etaMin = clock + legMin;
    const eventMin = timeToMinutes(s.event_time);
    const deadlineMin = eventMin === null ? null : eventMin - SETUP_BUFFER_MIN;
    const late = deadlineMin !== null && etaMin > deadlineMin;
    clock = etaMin + SERVICE_MIN;
    prev = s;
    return { id: s.id, legKm, legMin, etaMin, deadlineMin, late };
  });
}

// Google Maps directions link (works on phones; Maps allows ~9 waypoints).
export function mapsDirectionsUrl(start, stops, returnToBase = false) {
  if (!stops.length) return '';
  const pt = (p) => `${Number(p.lat).toFixed(6)},${Number(p.lng).toFixed(6)}`;
  const dest = returnToBase ? start : stops[stops.length - 1];
  const via = returnToBase ? stops : stops.slice(0, -1);
  const params = new URLSearchParams({
    api: '1',
    origin: pt(start),
    destination: pt(dest),
    travelmode: 'driving',
  });
  if (via.length) params.set('waypoints', via.map(pt).join('|'));
  return `https://www.google.com/maps/dir/?${params.toString().replace(/%2C/g, ',').replace(/%7C/g, '|')}`;
}

// ---------- Validation ----------
export function cleanVehicleForm(form) {
  const name = String(form.name || '').trim();
  const plate = String(form.plate_number || '').trim().toUpperCase().replace(/\s+/g, ' ');
  if (!name) throw new Error('Vehicle name is required (e.g. "Van 1").');
  if (!plate) throw new Error('Plate number is required.');
  if (!VEHICLE_TYPES.includes(form.vehicle_type)) throw new Error('Choose a vehicle type.');
  const cap = form.capacity_kg === '' || form.capacity_kg === null || form.capacity_kg === undefined
    ? null
    : Number(form.capacity_kg);
  if (cap !== null && (!Number.isFinite(cap) || cap <= 0)) throw new Error('Capacity must be a positive number.');
  if (form.status && !VEHICLE_STATUSES.includes(form.status)) throw new Error('Invalid vehicle status.');
  return {
    name,
    plate_number: plate,
    vehicle_type: form.vehicle_type,
    capacity_kg: cap,
    status: form.status || 'Available',
    notes: String(form.notes || '').trim() || null,
  };
}

// ---------- Display helpers ----------
export function formatClock(t) {
  const m = timeToMinutes(t);
  if (m === null) return '—';
  return minutesToClock(m);
}

export function timeAgo(iso, now = Date.now()) {
  if (!iso) return 'No location yet';
  const diff = Math.max(0, now - new Date(iso).getTime());
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min} min ago`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} hr ago`;
  return `${Math.floor(h / 24)} d ago`;
}

export function vehicleStatusClass(status) {
  switch (status) {
    case 'Available': return 'text-emerald-700 dark:text-emerald-300';
    case 'On Delivery': return 'text-blue-700 dark:text-blue-300';
    case 'Maintenance': return 'text-amber-700 dark:text-amber-300';
    default: return 'text-gray-500 dark:text-gray-400';
  }
}

export function deliveryStatusClass(status) {
  switch (status) {
    case 'Delivered': return 'text-emerald-700 dark:text-emerald-300';
    case 'En Route': return 'text-blue-700 dark:text-blue-300';
    case 'Loading': return 'text-amber-700 dark:text-amber-300';
    case 'Failed': return 'text-red-700 dark:text-red-300';
    default: return 'text-gray-600 dark:text-gray-300';
  }
}