// Shared helpers for Waste Tracking. Pure functions only (no Supabase calls),
// so the numbers on screen can be unit-tested and never drift between views.
import { roundQty } from './inventory';

export const WASTE_REASONS = [
  'Spoiled / Expired',
  'Overproduction',
  'Leftover after event',
  'Preparation trimmings',
  'Overcooked / Burnt',
  'Dropped / Contaminated',
  'Other',
];

export const RANGE_OPTIONS = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

// What to do about each kind of waste (shown when a reason dominates the cost).
const REASON_TIPS = {
  'Spoiled / Expired':
    'Spoilage is the biggest loss. Order smaller batches more often and use first-in-first-out (oldest stock first).',
  'Overproduction':
    'Overproduction is the biggest loss. Prepare closer to the confirmed guest count instead of adding a big buffer.',
  'Leftover after event':
    'Event leftovers are the biggest loss. Re-check the per-guest quantities in your packages against what is actually eaten.',
  'Preparation trimmings':
    'Trimming loss is the biggest cost. Review how ingredients are cut and reuse trimmings for stocks or sides.',
  'Overcooked / Burnt':
    'Cooking mistakes are the biggest loss. Check timers and the kitchen workflow during peak prep.',
  'Dropped / Contaminated':
    'Handling losses are the biggest cost. Review storage, transport and handling steps.',
  'Other': 'Most waste is logged as "Other". Use specific reasons so the causes become clear.',
};

// Local calendar date as YYYY-MM-DD (toISOString() would shift the day in PH time).
export function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function daysAgoISO(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0); // noon avoids DST edge cases
  d.setDate(d.getDate() - n);
  return localISODate(d);
}

export function formatPeso(value) {
  return `₱${Number(value || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function formatShortDate(iso) {
  if (!iso) return '';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
}

export function costOf(log) {
  if (log?.cost_lost !== null && log?.cost_lost !== undefined) return Number(log.cost_lost) || 0;
  return (Number(log?.quantity) || 0) * (Number(log?.unit_cost) || 0);
}

// Validates the "Log Waste" form. Throws a user-readable Error, otherwise
// returns the clean values to send to the database.
export function cleanWasteForm(form, item) {
  if (!item) throw new Error('Please choose an inventory item.');

  const qty = Number(form?.quantity);
  if (!Number.isFinite(qty) || qty <= 0) throw new Error('Quantity wasted must be greater than 0.');
  if (!Number.isInteger(qty)) throw new Error('Quantity must be a whole number. (Need fractions? Count it in a smaller unit, e.g. g instead of kg.)');

  const reason = String(form?.reason || '').trim();
  if (!WASTE_REASONS.includes(reason)) throw new Error('Please choose a reason.');

  const date = String(form?.waste_date || '');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('Please choose the date of the waste.');
  if (date > localISODate()) throw new Error('The waste date cannot be in the future.');

  const note = String(form?.note || '').trim();
  if (note.length > 300) throw new Error('Note is too long (max 300 characters).');

  const deduct = form?.deduct !== false;
  if (deduct && qty > Number(item.quantity)) {
    throw new Error(`Only ${roundQty(item.quantity)} ${item.unit || ''} on hand. Lower the quantity, or untick "Deduct from inventory" if it was already removed.`);
  }

  return { item_id: item.item_id, quantity: qty, reason, waste_date: date, note: note || null, deduct };
}

// Builds every number the page shows from the raw logs.
// `logs` should cover the current period AND the one before it (for the trend).
export function summarize(logs, days) {
  const curStart = daysAgoISO(days - 1);
  const prevStart = daysAgoISO(days * 2 - 1);
  const cur = [];
  let prevCost = 0;

  for (const l of logs || []) {
    const d = String(l.waste_date).slice(0, 10);
    if (d >= curStart) cur.push(l);
    else if (d >= prevStart) prevCost += costOf(l);
  }

  const totalCost = cur.reduce((s, l) => s + costOf(l), 0);

  const reasonMap = new Map();
  const itemMap = new Map();
  for (const l of cur) {
    const c = costOf(l);
    const r = reasonMap.get(l.reason) || { reason: l.reason, cost: 0, entries: 0 };
    r.cost += c; r.entries += 1; reasonMap.set(l.reason, r);

    const key = l.item_id ?? `name:${l.item_name}`;
    const it = itemMap.get(key) || { key, item_id: l.item_id, name: l.item_name, unit: l.unit, qty: 0, cost: 0, entries: 0 };
    it.qty += Number(l.quantity) || 0; it.cost += c; it.entries += 1; itemMap.set(key, it);
  }

  const byReason = [...reasonMap.values()]
    .sort((a, b) => b.cost - a.cost)
    .map((r) => ({ ...r, pct: totalCost > 0 ? (r.cost / totalCost) * 100 : 0 }));
  const topItems = [...itemMap.values()]
    .map((i) => ({ ...i, qty: roundQty(i.qty) }))
    .sort((a, b) => b.cost - a.cost);

  // Trend buckets: one per day up to 31 days, otherwise one per week.
  const step = days <= 31 ? 1 : 7;
  const buckets = [];
  const total = Math.ceil(days / step);
  for (let i = 0; i < total; i++) {
    const startAgo = days - 1 - i * step;
    const endAgo = Math.max(startAgo - (step - 1), 0);
    buckets.push({ from: daysAgoISO(startAgo), to: daysAgoISO(endAgo), label: formatShortDate(daysAgoISO(startAgo)), cost: 0 });
  }
  for (const l of cur) {
    const d = String(l.waste_date).slice(0, 10);
    const b = buckets.find((x) => d >= x.from && d <= x.to);
    if (b) b.cost += costOf(l);
  }

  return {
    current: cur,
    totalCost,
    entries: cur.length,
    prevCost,
    changePct: prevCost > 0 ? ((totalCost - prevCost) / prevCost) * 100 : null,
    byReason,
    topItems,
    buckets,
  };
}

// Plain rule-based suggestions (no AI guesswork): each one is tied to a number
// the user can see on the page. `items` = current inventory, for stock levels.
export function buildInsights(summary, items) {
  const out = [];
  if (!summary.entries) return out;

  if (summary.changePct !== null) {
    if (summary.changePct >= 20) {
      out.push({ type: 'warn', text: `Waste cost is up ${Math.round(summary.changePct)}% compared with the previous period (${formatPeso(summary.prevCost)} → ${formatPeso(summary.totalCost)}).` });
    } else if (summary.changePct <= -10) {
      out.push({ type: 'good', text: `Waste cost is down ${Math.round(Math.abs(summary.changePct))}% compared with the previous period. Keep doing what changed.` });
    }
  }

  const top = summary.byReason[0];
  if (top && top.pct >= 40 && summary.entries >= 3) {
    out.push({ type: 'tip', text: `${Math.round(top.pct)}% of the loss is "${top.reason}". ${REASON_TIPS[top.reason] || ''}`.trim() });
  }

  const stockById = new Map((items || []).map((i) => [String(i.item_id), Number(i.quantity) || 0]));
  for (const it of summary.topItems.slice(0, 5)) {
    if (out.length >= 5) break;
    const onHand = it.item_id != null ? stockById.get(String(it.item_id)) : undefined;
    if (onHand !== undefined && it.entries >= 2 && onHand > 0) {
      const share = (it.qty / (it.qty + onHand)) * 100;
      if (share >= 25) {
        out.push({ type: 'tip', text: `${it.name}: wasted ${it.qty} ${it.unit} in this period against ${roundQty(onHand)} ${it.unit} on hand (about ${Math.round(share)}% of what you held). Consider a smaller reorder quantity or a lower stock level for this item.` });
        continue;
      }
    }
    if (it.entries >= 3) {
      out.push({ type: 'tip', text: `${it.name} was wasted ${it.entries} times (${it.qty} ${it.unit}, ${formatPeso(it.cost)}). Check how it is stored and how much you order per event.` });
    }
  }
  return out.slice(0, 5);
}

export function logsToCSV(logs) {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const head = ['Date', 'Item', 'Quantity', 'Unit', 'Reason', 'Unit Cost', 'Cost Lost', 'Note'];
  const rows = (logs || []).map((l) => [
    String(l.waste_date).slice(0, 10), l.item_name, l.quantity, l.unit, l.reason, l.unit_cost, costOf(l).toFixed(2), l.note,
  ]);
  return [head, ...rows].map((r) => r.map(esc).join(',')).join('\r\n');
}