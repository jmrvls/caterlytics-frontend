import { supabase } from '../supabaseClient';
import { localToday } from '../utils/date';

// ---------------------------------------------------------------------------
// Global Configuration & Policy Control
//
// One platform-wide settings row, edited by the Super Admin and read by every
// signed-in user. Requires global_config.sql. If that script hasn't been run
// yet, getPlatformSettings() quietly returns the defaults below so the rest of
// the app keeps working exactly as it did before.
// ---------------------------------------------------------------------------

export const SETTINGS_DEFAULTS = {
  min_lead_days: 0,
  max_advance_days: 1095,
  max_guests: 5000,
  cancel_min_days: 0,
  cancellation_policy: '',
  currency_code: 'PHP',
  currency_symbol: '₱',
  tax_rate_percent: 0,
  tax_label: 'VAT',
  service_fee_type: 'percent',
  service_fee_value: 0,
};

export const CURRENCY_OPTIONS = [
  { code: 'PHP', symbol: '₱', label: 'Philippine Peso (₱)' },
  { code: 'USD', symbol: '$', label: 'US Dollar ($)' },
  { code: 'EUR', symbol: '€', label: 'Euro (€)' },
  { code: 'JPY', symbol: '¥', label: 'Japanese Yen (¥)' },
  { code: 'SGD', symbol: 'S$', label: 'Singapore Dollar (S$)' },
];

let cached = null;
let cachedAt = 0;
const CACHE_MS = 60_000;

function normalize(row) {
  const r = { ...SETTINGS_DEFAULTS, ...(row || {}) };
  return {
    ...r,
    min_lead_days: Number(r.min_lead_days),
    max_advance_days: Number(r.max_advance_days),
    max_guests: Number(r.max_guests),
    cancel_min_days: Number(r.cancel_min_days),
    tax_rate_percent: Number(r.tax_rate_percent),
    service_fee_value: Number(r.service_fee_value),
  };
}

// Returns { settings, ready }. ready=false means global_config.sql has not
// been run (or the call failed) and the defaults are being used.
export async function getPlatformSettings({ force = false } = {}) {
  if (!force && cached && Date.now() - cachedAt < CACHE_MS) return cached;

  const { data, error } = await supabase.rpc('get_platform_settings');
  if (error || !data) {
    if (error) console.error('Platform settings not available:', error.message);
    // Don't cache a failure for the full minute.
    return { settings: normalize(null), ready: false };
  }
  const row = Array.isArray(data) ? data[0] : data;
  cached = { settings: normalize(row), ready: true, updated_at: row?.updated_at || null };
  cachedAt = Date.now();
  return cached;
}

export function clearPlatformSettingsCache() {
  cached = null;
  cachedAt = 0;
}

// Super Admin only -- enforced inside the RPC, so this is not a client-side check.
export async function savePlatformSettings(values) {
  const v = validateSettings(values);
  const { data, error } = await supabase.rpc('update_platform_settings', { p: v });
  if (error) throw new Error(error.message || 'Failed to save platform settings.');
  clearPlatformSettingsCache();
  return normalize(Array.isArray(data) ? data[0] : data);
}

export function validateSettings(s) {
  const int = (x) => Number(x);
  const isInt = (x) => Number.isInteger(int(x));

  if (!isInt(s.min_lead_days) || int(s.min_lead_days) < 0 || int(s.min_lead_days) > 365) {
    throw new Error('Minimum lead time must be a whole number from 0 to 365 days.');
  }
  if (!isInt(s.max_advance_days) || int(s.max_advance_days) < 1 || int(s.max_advance_days) > 1095) {
    throw new Error('Maximum advance booking must be a whole number from 1 to 1095 days.');
  }
  if (int(s.max_advance_days) <= int(s.min_lead_days)) {
    throw new Error('Maximum advance booking must be longer than the minimum lead time.');
  }
  if (!isInt(s.max_guests) || int(s.max_guests) < 1 || int(s.max_guests) > 100000) {
    throw new Error('Maximum guests must be a whole number from 1 to 100,000.');
  }
  if (!isInt(s.cancel_min_days) || int(s.cancel_min_days) < 0 || int(s.cancel_min_days) > 365) {
    throw new Error('Cancellation cut-off must be a whole number from 0 to 365 days.');
  }
  if (String(s.cancellation_policy || '').length > 1000) {
    throw new Error('Cancellation policy text is too long (max 1000 characters).');
  }
  const tax = int(s.tax_rate_percent);
  if (!Number.isFinite(tax) || tax < 0 || tax > 100) throw new Error('Tax rate must be between 0 and 100%.');
  if (!String(s.tax_label || '').trim()) throw new Error('Give the tax a label (e.g. VAT).');
  const fee = int(s.service_fee_value);
  if (!Number.isFinite(fee) || fee < 0) throw new Error('Service fee cannot be negative.');
  if (!['percent', 'fixed'].includes(s.service_fee_type)) throw new Error('Choose a service fee type.');
  if (s.service_fee_type === 'percent' && fee > 100) throw new Error('A percent service fee cannot be more than 100.');
  if (!/^[A-Za-z]{3}$/.test(String(s.currency_code || ''))) throw new Error('Currency code must be 3 letters (e.g. PHP).');
  if (!String(s.currency_symbol || '').trim() || String(s.currency_symbol).length > 4) {
    throw new Error('Currency symbol must be 1 to 4 characters.');
  }

  return {
    min_lead_days: int(s.min_lead_days),
    max_advance_days: int(s.max_advance_days),
    max_guests: int(s.max_guests),
    cancel_min_days: int(s.cancel_min_days),
    cancellation_policy: String(s.cancellation_policy || '').trim(),
    currency_code: String(s.currency_code).toUpperCase(),
    currency_symbol: String(s.currency_symbol).trim(),
    tax_rate_percent: tax,
    tax_label: String(s.tax_label).trim(),
    service_fee_type: s.service_fee_type,
    service_fee_value: fee,
  };
}

// ---------- Helpers used by booking / pricing screens ----------

function addDays(isoDate, days) {
  const [y, m, d] = isoDate.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  const mm = String(dt.getMonth() + 1).padStart(2, '0');
  const dd = String(dt.getDate()).padStart(2, '0');
  return `${dt.getFullYear()}-${mm}-${dd}`;
}

// Earliest / latest event date a client may pick under the booking rules.
export function bookingDateRange(settings) {
  const today = localToday();
  return {
    min: addDays(today, Number(settings.min_lead_days) || 0),
    max: addDays(today, Number(settings.max_advance_days) || 1095),
  };
}

// Returns an error message, or '' when the booking fits the rules.
export function checkBookingRules(settings, { event_date, guest_count } = {}) {
  if (event_date) {
    const { min, max } = bookingDateRange(settings);
    if (event_date < min) {
      return settings.min_lead_days > 0
        ? `Bookings must be made at least ${settings.min_lead_days} day(s) before the event.`
        : 'Event date cannot be in the past.';
    }
    if (event_date > max) return `Bookings can only be made up to ${settings.max_advance_days} days in advance.`;
  }
  if (guest_count !== undefined && guest_count !== null && Number(guest_count) > settings.max_guests) {
    return `Guest count cannot be more than ${Number(settings.max_guests).toLocaleString()}.`;
  }
  return '';
}

// Can a client still cancel online? Returns { allowed, message }.
export function checkCancellation(settings, eventDate) {
  const cutoff = Number(settings.cancel_min_days) || 0;
  if (!eventDate || cutoff <= 0) return { allowed: true, message: '' };
  const lastDay = addDays(String(eventDate).slice(0, 10), -cutoff);
  if (localToday() > lastDay) {
    return {
      allowed: false,
      message: `Online cancellation closes ${cutoff} day(s) before the event. Please contact the caterer.`,
    };
  }
  return { allowed: true, message: '' };
}

// Tax + service fee on top of a subtotal. Display/estimate helper -- see the
// note in ClientDashboard about where the stored totals come from.
export function computeFees(settings, subtotal) {
  const base = Number(subtotal) || 0;
  const fee =
    settings.service_fee_type === 'fixed'
      ? Number(settings.service_fee_value) || 0
      : base * ((Number(settings.service_fee_value) || 0) / 100);
  const serviceFee = base > 0 ? round2(fee) : 0;
  const tax = round2((base + serviceFee) * ((Number(settings.tax_rate_percent) || 0) / 100));
  return { serviceFee, tax, total: round2(base + serviceFee + tax) };
}

function round2(n) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}

export function formatMoney(settings, amount) {
  const n = Number(amount) || 0;
  return `${settings.currency_symbol}${n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}