// Shared PhilSMS helper. The API token lives ONLY in Supabase secrets,
// never in the frontend (.env with VITE_ prefix is visible to everyone).

// Accepts 09171234567, +639171234567, 639171234567, 9171234567
// Returns 639171234567 (PhilSMS format) or null if it isn't a PH mobile number.
export function normalizePhone(raw: unknown): string | null {
  const d = String(raw ?? '').replace(/\D/g, '');
  if (/^09\d{9}$/.test(d)) return '63' + d.slice(1);
  if (/^9\d{9}$/.test(d)) return '63' + d;
  if (/^639\d{9}$/.test(d)) return d;
  return null;
}

export async function sendSms(recipient: string, message: string) {
  const token = Deno.env.get('PHILSMS_API_TOKEN');
  if (!token) throw new Error('PHILSMS_API_TOKEN is not set');

  // Confirm this base URL in your PhilSMS dashboard > Developers.
  // If it differs, set the PHILSMS_BASE_URL secret instead of editing code.
  const base = (Deno.env.get('PHILSMS_BASE_URL') ?? 'https://dashboard.philsms.com/api/v3').replace(/\/$/, '');
  const senderId = Deno.env.get('PHILSMS_SENDER_ID') ?? 'PhilSMS';

  const res = await fetch(`${base}/sms/send`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ recipient, sender_id: senderId, type: 'plain', message }),
    // Never hang forever if PhilSMS is slow; the caller releases its claim on error.
    signal: AbortSignal.timeout(15000),
  });

  const text = await res.text();
  let json: any = null;
  try { json = JSON.parse(text); } catch { /* non-JSON response */ }

  if (!res.ok || json?.status === 'error') {
    throw new Error(`PhilSMS error (${res.status}): ${json?.message ?? text.slice(0, 200)}`);
  }
  return json;
}