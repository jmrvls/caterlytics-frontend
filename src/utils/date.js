// Local-date helpers.
//
// `new Date().toISOString()` is UTC, so in the Philippines (UTC+8) it still
// returns *yesterday's* date between 12:00 AM and 8:00 AM. Anything that means
// "today" (date-input minimums, default expense date, "upcoming events",
// payment date, file names) must use the LOCAL date instead.

export function toLocalDateStr(d = new Date()) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function localToday() {
  return toLocalDateStr(new Date())
}

// 'YYYY-MM-DD' (a date-only column) -> readable date WITHOUT timezone shifting.
// `new Date('2026-10-01')` is parsed as UTC midnight and can show the previous
// day in timezones behind UTC; adding a time part parses it as local time.
export function formatDateOnly(dateStr, options = { year: 'numeric', month: 'short', day: 'numeric' }) {
  if (!dateStr) return '—'
  const s = String(dateStr)
  const d = /^\d{4}-\d{2}-\d{2}$/.test(s) ? new Date(s + 'T00:00:00') : new Date(s)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-PH', options)
}