// Shared helpers for Supplier Management. Pure functions only (no Supabase calls).
import { localISODate } from './waste';

export { formatPeso, formatShortDate, localISODate } from './waste';

export const SUPPLIER_CATEGORIES = ['Meat & Poultry', 'Seafood', 'Produce', 'Dry Goods', 'Dairy & Eggs', 'Beverages', 'Packaging & Supplies', 'Equipment', 'Other'];
export const PAYMENT_TERMS = ['COD', 'Net 7', 'Net 15', 'Net 30'];

// Look + wording of each purchase order status.
export const PO_STATUS = {
  Draft: { label: 'Draft', cls: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200' },
  Ordered: { label: 'Ordered', cls: 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
  'Partially Received': { label: 'Partially received', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  Received: { label: 'Received', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  Cancelled: { label: 'Cancelled', cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};
export const OPEN_STATUSES = ['Ordered', 'Partially Received'];

const text = (v) => String(v ?? '').trim().replace(/\s+/g, ' ');
const orNull = (v) => (text(v) === '' ? null : text(v));

// Validates + normalizes the supplier form. Throws an Error with a readable message.
export function cleanSupplierForm(form) {
  const name = text(form?.supplier_name);
  if (!name) throw new Error('Supplier name is required.');
  if (name.length > 120) throw new Error('Supplier name is too long (max 120 characters).');
  const phone = orNull(form?.contact_number);
  if (phone && !/^[0-9+()\-\s]{7,20}$/.test(phone)) throw new Error('Contact number looks invalid. Use digits, +, - or spaces only.');
  const email = orNull(form?.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email address looks invalid.');
  return {
    supplier_name: name,
    category: SUPPLIER_CATEGORIES.includes(form?.category) ? form.category : 'Other',
    contact_person: orNull(form?.contact_person),
    contact_number: phone,
    email,
    address: orNull(form?.address),
    payment_terms: PAYMENT_TERMS.includes(form?.payment_terms) ? form.payment_terms : 'COD',
    notes: orNull(form?.notes),
  };
}

// Validates a purchase order form and returns the arguments save_purchase_order needs.
export function cleanPoForm(form) {
  if (!form?.supplier_id) throw new Error('Choose a supplier.');
  if (form.expected_date && form.order_date && form.expected_date < form.order_date) {
    throw new Error('Expected delivery cannot be before the order date.');
  }
  const lines = (form.lines || []).filter((l) => l.item_id || text(l.item_name) || l.quantity !== '');
  if (!lines.length) throw new Error('Add at least one item.');
  const clean = lines.map((l, i) => {
    const name = text(l.item_name);
    const qty = Number(l.quantity);
    const cost = l.unit_cost === '' || l.unit_cost == null ? 0 : Number(l.unit_cost);
    if (!name) throw new Error(`Line ${i + 1}: choose or type an item.`);
    if (!Number.isInteger(qty) || qty <= 0) throw new Error(`Line ${i + 1}: quantity must be a whole number above 0.`);
    if (!Number.isFinite(cost) || cost < 0) throw new Error(`Line ${i + 1}: unit cost cannot be negative.`);
    return { item_id: l.item_id || null, item_name: name, unit: l.unit || 'pcs', quantity: qty, unit_cost: cost };
  });
  return {
    p_po_id: form.po_id || null,
    p_supplier_id: Number(form.supplier_id),
    p_order_date: form.order_date || null,
    p_expected_date: form.expected_date || null,
    p_notes: orNull(form.notes),
    p_lines: clean,
  };
}

export const lineTotal = (l) => (Number(l.quantity) || 0) * (Number(l.unit_cost) || 0);
export const poTotal = (po) => (po?.items || po?.lines || []).reduce((s, l) => s + lineTotal(l), 0);
export const poOutstandingValue = (po) =>
  (po?.items || []).reduce((s, l) => s + Math.max((Number(l.quantity) || 0) - (Number(l.received_qty) || 0), 0) * (Number(l.unit_cost) || 0), 0);

export function isOverdue(po, today = localISODate()) {
  return OPEN_STATUSES.includes(po.status) && !!po.expected_date && po.expected_date < today;
}

// Whole days from `today` to `iso` (negative = in the past).
export function daysFrom(iso, today = localISODate()) {
  const [a, b, c] = String(iso).slice(0, 10).split('-').map(Number);
  const [x, y, z] = today.split('-').map(Number);
  return Math.round((Date.UTC(a, b - 1, c) - Date.UTC(x, y - 1, z)) / 86400000);
}

// Buckets open orders for the delivery schedule, soonest first inside each bucket.
export function buildSchedule(orders, today = localISODate()) {
  const groups = [
    { key: 'overdue', title: 'Overdue', tone: 'text-red-600 dark:text-red-400', rows: [] },
    { key: 'today', title: 'Today', tone: 'text-emerald-700 dark:text-emerald-300', rows: [] },
    { key: 'week', title: 'Next 7 days', tone: 'text-gray-800 dark:text-gray-100', rows: [] },
    { key: 'later', title: 'Later', tone: 'text-gray-800 dark:text-gray-100', rows: [] },
    { key: 'none', title: 'No delivery date set', tone: 'text-gray-500 dark:text-gray-400', rows: [] },
  ];
  const by = Object.fromEntries(groups.map((g) => [g.key, g]));
  orders.filter((o) => OPEN_STATUSES.includes(o.status)).forEach((o) => {
    if (!o.expected_date) return by.none.rows.push(o);
    const d = daysFrom(o.expected_date, today);
    (d < 0 ? by.overdue : d === 0 ? by.today : d <= 7 ? by.week : by.later).rows.push(o);
  });
  groups.forEach((g) => g.rows.sort((a, b) => String(a.expected_date || '').localeCompare(String(b.expected_date || ''))));
  return groups.filter((g) => g.rows.length);
}

// Per-supplier numbers shown in the vendor table.
export function supplierStats(orders) {
  const map = {};
  orders.forEach((o) => {
    const s = (map[o.supplier_id] ||= { orders: 0, open: 0, spent: 0 });
    if (o.status === 'Cancelled' || o.status === 'Draft') return;
    s.orders += 1;
    if (OPEN_STATUSES.includes(o.status)) s.open += 1;
    s.spent += (o.items || []).reduce((t, l) => t + (Number(l.received_qty) || 0) * (Number(l.unit_cost) || 0), 0);
  });
  return map;
}