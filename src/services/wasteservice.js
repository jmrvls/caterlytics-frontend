import { supabase } from '../supabaseClient';
import { cleanWasteForm } from '../utils/waste';

// Same idea as inventoryService: turn Supabase errors into readable messages.
function isMissingTable(error) {
  return (
    error?.code === '42P01' ||
    error?.code === 'PGRST205' ||
    /could not find the table|does not exist/i.test(error?.message || '')
  );
}

function isMissingFunction(error) {
  return (
    error?.code === '42883' ||
    error?.code === 'PGRST202' ||
    /could not find the function/i.test(error?.message || '')
  );
}

function setupError() {
  const err = new Error('Waste tracking is not set up in the database yet. Run waste_tracking.sql in the Supabase SQL Editor.');
  err.code = 'WASTE_NOT_SET_UP';
  return err;
}

// Supabase/PostgREST caps one response (1000 rows by default), so a single
// .limit(5000) can be cut short without any error. Read page by page instead,
// and report `truncated` if we hit our own safety cap.
const PAGE_SIZE = 1000;
const MAX_PAGES = 20; // up to 20,000 rows

async function fetchAllPages(buildQuery) {
  const rows = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const from = page * PAGE_SIZE;
    const { data, error } = await buildQuery().range(from, from + PAGE_SIZE - 1);
    if (error) return { rows, truncated: false, error };
    rows.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) return { rows, truncated: false, error: null };
  }
  return { rows, truncated: true, error: null };
}

// Logs on/after `fromDate` (YYYY-MM-DD). RLS limits this to the caller's business.
// Returns { rows, truncated }.
export async function getWasteLogs(fromDate) {
  const { rows, truncated, error } = await fetchAllPages(() =>
    supabase
      .from('tbl_waste_logs')
      .select('waste_id, item_id, item_name, unit, quantity, unit_cost, cost_lost, reason, note, waste_date, created_at')
      .gte('waste_date', fromDate)
      .order('waste_date', { ascending: false })
      .order('created_at', { ascending: false })
      .order('waste_id', { ascending: false }) // tiebreaker so pages never overlap
  );

  if (error) {
    if (isMissingTable(error)) throw setupError();
    throw new Error(error.message || 'Failed to load waste logs.');
  }
  return { rows, truncated };
}

// Records the waste and (optionally) deducts the stock in one DB transaction.
export async function logWaste(form, item) {
  const clean = cleanWasteForm(form, item); // validates + normalizes

  const { data, error } = await supabase.rpc('log_food_waste', {
    p_item_id: Number(clean.item_id),
    p_quantity: clean.quantity,
    p_reason: clean.reason,
    p_note: clean.note,
    p_waste_date: clean.waste_date,
    p_deduct: clean.deduct,
  });

  if (error) {
    if (isMissingFunction(error) || isMissingTable(error)) throw setupError();
    if (error.code === '42501') throw new Error('You do not have permission to log waste.');
    throw new Error(error.message || 'Failed to log waste.');
  }
  return data;
}

// Stock deducted by bookings since `fromDate` (YYYY-MM-DD). Used to work out how
// fast each item is really used, so reorder suggestions aren't based on waste alone.
// Admin / Owner-Manager only (RLS). Waste deductions are skipped here on purpose:
// they already come from the waste logs.
// Returns { rows, truncated }.
export async function getUsageMovements(fromDate) {
  const fromIso = new Date(`${fromDate}T00:00:00`).toISOString();
  const { rows, truncated, error } = await fetchAllPages(() =>
    supabase
      .from('tbl_inventory_movements')
      .select('movement_id, item_id, delta, reason, created_at')
      .gte('created_at', fromIso)
      .like('reason', 'Booking%')
      .order('movement_id', { ascending: true }) // stable order for paging
  );

  if (error) throw new Error(error.message || 'Failed to load stock usage.');
  return { rows, truncated };
}