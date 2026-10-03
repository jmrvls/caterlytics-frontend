// Shared helpers for Contract & Legal Document Handling.
// Pure functions only (no Supabase calls), same idea as utils/waste.js.

export const DOC_TYPES = [
  { value: 'Catering Agreement', category: 'Agreements' },
  { value: 'Client Contract', category: 'Agreements' },
  { value: 'Supplier Agreement', category: 'Agreements' },
  { value: 'Venue / Partner Agreement', category: 'Agreements' },
  { value: 'Mayor\'s / Business Permit', category: 'Permits' },
  { value: 'Sanitary Permit', category: 'Permits' },
  { value: 'Fire Safety Certificate (FSIC)', category: 'Permits' },
  { value: 'DTI / SEC Registration', category: 'Permits' },
  { value: 'BIR Certificate of Registration', category: 'Permits' },
  { value: 'FDA License to Operate', category: 'Permits' },
  { value: 'Health Certificate', category: 'Compliance' },
  { value: 'Food Safety Inspection', category: 'Compliance' },
  { value: 'Insurance Policy', category: 'Compliance' },
  { value: 'Other', category: 'Other' },
];

export const CATEGORIES = ['Agreements', 'Permits', 'Compliance', 'Other'];

export function categoryOf(docType) {
  return DOC_TYPES.find((t) => t.value === docType)?.category || 'Other';
}

// Documents expiring within this many days are flagged "Expiring soon".
export const EXPIRY_WARN_DAYS = 30;

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB (also enforced by the bucket)
export const ACCEPT_ATTR = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
const ALLOWED_EXT = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png'];

export function fileExt(name) {
  const parts = String(name || '').split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

export function validateFile(file) {
  if (!file) throw new Error('Please choose a file to upload.');
  if (!ALLOWED_EXT.includes(fileExt(file.name))) {
    throw new Error('Unsupported file type. Upload a PDF, Word (.doc/.docx), JPG or PNG file.');
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('That file is too large. The limit is 10 MB.');
  }
  if (file.size === 0) throw new Error('That file is empty.');
}

// Local calendar date as YYYY-MM-DD (toISOString() would shift the day in PH time).
export function localISODate(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function dayNumber(iso) {
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}

// Whole days from `today` until `iso` (negative = already past).
export function daysUntil(iso, today = localISODate()) {
  if (!iso) return null;
  return dayNumber(iso) - dayNumber(today);
}

// 'expired' | 'expiring' | 'valid' | 'none' (no expiry date, e.g. a one-off contract)
export function docStatus(doc, today = localISODate()) {
  const left = daysUntil(doc?.expiry_date, today);
  if (left === null) return 'none';
  if (left < 0) return 'expired';
  if (left <= EXPIRY_WARN_DAYS) return 'expiring';
  return 'valid';
}

export const STATUS_UI = {
  expired: { label: 'Expired', cls: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  expiring: { label: 'Expiring soon', cls: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  valid: { label: 'Valid', cls: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  none: { label: 'No expiry', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
};

export function expiryNote(doc, today = localISODate()) {
  const left = daysUntil(doc?.expiry_date, today);
  if (left === null) return '';
  if (left < 0) return `${Math.abs(left)} ${Math.abs(left) === 1 ? 'day' : 'days'} ago`;
  if (left === 0) return 'Expires today';
  return `in ${left} ${left === 1 ? 'day' : 'days'}`;
}

export function summarize(docs, today = localISODate()) {
  const out = { total: docs.length, valid: 0, expiring: 0, expired: 0, none: 0 };
  for (const d of docs) out[docStatus(d, today)] += 1;
  return out;
}

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(iso) {
  if (!iso) return '—';
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Validates + normalizes the upload/edit form. Throws an Error with a readable message.
export function cleanDocForm(form) {
  const title = String(form.title || '').trim();
  if (title.length < 2) throw new Error('Please enter a document title.');
  if (title.length > 150) throw new Error('The title is too long (150 characters max).');
  if (!DOC_TYPES.some((t) => t.value === form.doc_type)) throw new Error('Please choose a document type.');

  const issue_date = form.issue_date || null;
  const expiry_date = form.expiry_date || null;
  if (issue_date && expiry_date && expiry_date < issue_date) {
    throw new Error('The expiry date cannot be earlier than the issue date.');
  }
  const notes = String(form.notes || '').trim();
  if (notes.length > 500) throw new Error('Notes are too long (500 characters max).');

  return {
    title,
    doc_type: form.doc_type,
    party_name: String(form.party_name || '').trim() || null,
    reference_no: String(form.reference_no || '').trim() || null,
    issue_date,
    expiry_date,
    notes: notes || null,
  };
}