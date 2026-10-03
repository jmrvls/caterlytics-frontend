import { supabase } from '../supabaseClient';

// ---------- Seasonal pricing (Admin/Owner) ----------
// Scoped to the caller's business by RLS, same convention as addonService.js.

export const ADJUSTMENT_TYPES = [
  { value: 'percent', label: '% of package total' },
  { value: 'fixed_per_head', label: '₱ per head' },
];

function validateRule(r) {
  if (!String(r.rule_name || '').trim()) throw new Error('Give the season a name.');
  const v = Number(r.adjustment_value);
  if (!Number.isFinite(v) || v === 0) throw new Error('Enter an adjustment other than 0.');
  if (r.adjustment_type === 'percent' && (v < -100 || v > 500)) throw new Error('Percent must be between -100 and 500.');
  if (!r.start_date || !r.end_date) throw new Error('Pick the start and end dates.');
  if (!r.recurring_yearly && r.end_date < r.start_date) throw new Error('End date cannot be before the start date.');
}

function rulePayload(r) {
  return {
    rule_name: String(r.rule_name).trim(),
    adjustment_type: r.adjustment_type || 'percent',
    adjustment_value: Number(r.adjustment_value),
    start_date: r.start_date,
    end_date: r.end_date,
    recurring_yearly: !!r.recurring_yearly,
    package_id: r.package_id || null,
    priority: Number.isInteger(Number(r.priority)) ? Number(r.priority) : 0,
    is_active: r.is_active ?? true,
  };
}

export async function getPricingRules() {
  const { data, error } = await supabase
    .from('tbl_pricing_rules')
    .select('*')
    .order('start_date', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function savePricingRule(rule) {
  validateRule(rule);
  const q = rule.rule_id
    ? supabase.from('tbl_pricing_rules').update(rulePayload(rule)).eq('rule_id', rule.rule_id)
    : supabase.from('tbl_pricing_rules').insert(rulePayload(rule));
  const { data, error } = await q.select().single();
  if (error) throw new Error('Failed to save the seasonal rule.');
  return data;
}

export async function deletePricingRule(ruleId) {
  const { error } = await supabase.from('tbl_pricing_rules').delete().eq('rule_id', ruleId);
  if (error) throw new Error('Failed to delete the seasonal rule.');
}

// ---------- Promo codes (Admin/Owner) ----------

export function normalizePromoCode(code) {
  return String(code || '').toUpperCase().replace(/[^A-Z0-9_-]/g, '');
}

function validatePromo(p) {
  const code = normalizePromoCode(p.code);
  if (code.length < 3 || code.length > 20) throw new Error('Code must be 3-20 letters/numbers (e.g. SUMMER10).');
  const v = Number(p.discount_value);
  if (!Number.isFinite(v) || v <= 0) throw new Error('Discount must be greater than 0.');
  if (p.discount_type === 'percent' && v > 100) throw new Error('A percent discount cannot be more than 100.');
  if (p.valid_from && p.valid_until && p.valid_until < p.valid_from) throw new Error('"Valid until" cannot be before "valid from".');
  if (p.usage_limit !== '' && p.usage_limit != null && !(Number(p.usage_limit) >= 1)) throw new Error('Usage limit must be at least 1.');
  if (!(Number(p.per_client_limit) >= 1)) throw new Error('Per-client limit must be at least 1.');
}

function promoPayload(p) {
  const num = (x) => (x === '' || x == null ? null : Number(x));
  return {
    code: normalizePromoCode(p.code),
    description: String(p.description || '').trim() || null,
    discount_type: p.discount_type || 'percent',
    discount_value: Number(p.discount_value),
    min_subtotal: Number(p.min_subtotal) || 0,
    max_discount: p.discount_type === 'percent' ? num(p.max_discount) : null,
    valid_from: p.valid_from || null,
    valid_until: p.valid_until || null,
    usage_limit: num(p.usage_limit),
    per_client_limit: Number(p.per_client_limit) || 1,
    is_active: p.is_active ?? true,
  };
}

export async function getPromoCodes() {
  const { data, error } = await supabase
    .from('tbl_promo_codes')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function savePromoCode(promo) {
  validatePromo(promo);
  const q = promo.promo_id
    ? supabase.from('tbl_promo_codes').update(promoPayload(promo)).eq('promo_id', promo.promo_id)
    : supabase.from('tbl_promo_codes').insert(promoPayload(promo));
  const { data, error } = await q.select().single();
  if (error) {
    if (error.code === '23505') throw new Error('You already have a promo code with that name.');
    throw new Error('Failed to save the promo code.');
  }
  return data;
}

export async function deletePromoCode(promoId) {
  const { error } = await supabase.from('tbl_promo_codes').delete().eq('promo_id', promoId);
  if (error) throw new Error('Failed to delete the promo code.');
}

// ---------- Loyalty rewards (Admin/Owner) ----------

export const LOYALTY_DEFAULTS = {
  is_enabled: false,
  points_per_100: 1,
  peso_per_point: 1,
  min_redeem_points: 100,
  max_redeem_percent: 30,
  silver_threshold: 500,
  gold_threshold: 2000,
  platinum_threshold: 5000,
};

export const TIER_MULTIPLIERS = { Bronze: 1, Silver: 1.1, Gold: 1.25, Platinum: 1.5 };

export async function getLoyaltySettings() {
  const { data, error } = await supabase.from('tbl_loyalty_settings').select('*').maybeSingle();
  if (error) throw error;
  return { ...LOYALTY_DEFAULTS, ...(data || {}) };
}

export async function saveLoyaltySettings(s) {
  const n = (x) => Number(x);
  if (!(n(s.points_per_100) >= 0)) throw new Error('Points per ₱100 cannot be negative.');
  if (!(n(s.peso_per_point) > 0)) throw new Error('Each point must be worth more than ₱0.');
  if (!(n(s.min_redeem_points) >= 0)) throw new Error('Minimum redeem cannot be negative.');
  if (!(n(s.max_redeem_percent) >= 1 && n(s.max_redeem_percent) <= 100)) throw new Error('Max redeem must be 1-100%.');
  if (!(n(s.silver_threshold) < n(s.gold_threshold) && n(s.gold_threshold) < n(s.platinum_threshold))) {
    throw new Error('Tier points must go up: Silver < Gold < Platinum.');
  }
  const row = {
    is_enabled: !!s.is_enabled,
    points_per_100: n(s.points_per_100),
    peso_per_point: n(s.peso_per_point),
    min_redeem_points: Math.round(n(s.min_redeem_points)),
    max_redeem_percent: Math.round(n(s.max_redeem_percent)),
    silver_threshold: Math.round(n(s.silver_threshold)),
    gold_threshold: Math.round(n(s.gold_threshold)),
    platinum_threshold: Math.round(n(s.platinum_threshold)),
    updated_at: new Date().toISOString(),
  };
  // business_id is filled in by the database on first insert, so look the row up first.
  const { data: existing, error: findError } = await supabase.from('tbl_loyalty_settings').select('business_id').maybeSingle();
  if (findError) throw new Error('Failed to save loyalty settings.');
  const q = existing
    ? supabase.from('tbl_loyalty_settings').update(row).eq('business_id', existing.business_id)
    : supabase.from('tbl_loyalty_settings').insert(row);
  const { data, error } = await q.select().single();
  if (error) throw new Error('Failed to save loyalty settings.');
  return data;
}

export async function getLoyaltyMembers() {
  const { data, error } = await supabase.rpc('get_loyalty_members');
  if (error) throw new Error(error.message || 'Failed to load loyalty members.');
  return data || [];
}

export async function adjustLoyaltyPoints(clientId, points, note) {
  const { error } = await supabase.rpc('adjust_loyalty_points', {
    p_client_id: clientId,
    p_points: Math.round(Number(points)),
    p_note: note || null,
  });
  if (error) throw new Error(error.message || 'Failed to adjust points.');
}

// ---------- Client side ----------

// Live price preview while filling in the booking form. Changes nothing.
export async function quoteBookingPrice({ businessId, packageId, eventDate, guests, addonsTotal = 0, promoCode = '', points = 0 }) {
  const { data, error } = await supabase.rpc('quote_booking_price', {
    p_business_id: businessId,
    p_package_id: packageId,
    p_event_date: eventDate,
    p_guests: guests,
    p_addons_total: addonsTotal,
    p_promo_code: promoCode || null,
    p_points: points || 0,
  });
  if (error) throw new Error(error.message || 'Could not calculate the price.');
  return data;
}

// Locks the price onto the booking (promo used, points spent). Call after the booking
// and its add-ons exist. `strict: false` is for edits: a promo that no longer fits is
// dropped instead of blocking the edit.
export async function applyBookingPricing(bookingId, { promoCode = '', points = 0, strict = true } = {}) {
  const { data, error } = await supabase.rpc('apply_booking_pricing', {
    p_booking_id: bookingId,
    p_promo_code: promoCode || null,
    p_points: points || 0,
    p_strict: strict,
  });
  if (error) throw new Error(error.message || 'Could not apply pricing.');
  return data;
}

export async function getMyLoyalty() {
  const { data, error } = await supabase.rpc('get_my_loyalty');
  if (error) throw new Error(error.message || 'Failed to load rewards.');
  return data || [];
}

export function tierBadgeClass(tier) {
  return {
    Platinum: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
    Gold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
    Silver: 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200',
  }[tier] || 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300';
}