// Shared inventory helpers. Before this file existed, the "is this item low
// on stock?" rule was copy-pasted in 4 places (Inventory, Dashboard, Reports,
// Notifications). Keep it here so they can never drift apart.

export const UNIT_OPTIONS = ['kg', 'g', 'L', 'mL', 'pcs', 'pack'];

// At or below the threshold counts as low (same rule the whole app used).
export function isLowStock(item) {
  return Number(item?.quantity) <= Number(item?.low_stock_threshold);
}

// Round to 3 decimals so floating-point noise (0.1 + 0.2) never leaks to the UI.
export function roundQty(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n * 1000) / 1000 : 0;
}

// "12.5 kg" -- always show the unit next to a quantity.
export function formatQty(value, unit) {
  const s = String(roundQty(value));
  return unit ? `${s} ${unit}` : s;
}

export function formatCost(value) {
  return Number(value || 0).toFixed(2);
}

// Validates + normalizes the create/edit form. Throws an Error with a
// user-readable message when something is wrong; otherwise returns a clean
// payload (trimmed name, numbers instead of '' / null / NaN).
export function cleanItemForm(form, { includeQuantity = true } = {}) {
  const name = String(form?.item_name ?? '').trim().replace(/\s+/g, ' ');
  if (!name) throw new Error('Item name is required.');
  if (name.length > 100) throw new Error('Item name is too long (max 100 characters).');

  const unit = form?.unit || 'kg';
  if (!UNIT_OPTIONS.includes(unit)) throw new Error('Please choose a valid unit.');

  const toNum = (v, fallback) => (v === '' || v === null || v === undefined ? fallback : Number(v));

  const threshold = toNum(form?.low_stock_threshold, 0);
  const unitCost = toNum(form?.unit_cost, 0);
  if (!Number.isInteger(threshold) || threshold < 0) {
    throw new Error('Low stock threshold must be a whole number, 0 or more.');
  }
  if (!Number.isFinite(unitCost) || unitCost < 0) throw new Error('Unit cost must be 0 or more.');

  const payload = {
    item_name: name,
    low_stock_threshold: threshold,
    unit_cost: unitCost,
    unit,
  };

  if (includeQuantity) {
    const qty = toNum(form?.quantity, 0);
    if (!Number.isInteger(qty) || qty < 0) {
      throw new Error('Quantity must be a whole number, 0 or more. (Need fractions? Count it in a smaller unit, e.g. g instead of kg.)');
    }
    payload.quantity = qty;
  }
  return payload;
}