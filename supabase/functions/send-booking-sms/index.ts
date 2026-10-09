// send-booking-cancel-sms: texts the client that their booking was cancelled
// (or, if it was still Pending, that the request could not be accepted).
//
// POST { booking_id, previous_status }  ->  { sent: true } | { sent: false, reason }
// Only admin/staff of the booking's business can call it, and only while the
// booking is actually Cancelled. Every attempt is logged in public.tbl_sms_log.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { normalizePhone, sendSms } from '../_shared/philsms.ts';

const cors = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '*',
  'Vary': 'Origin',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const ALLOWED_ROLES = ['Admin', 'Owner/Manager', 'Staff'];

function formatDate(d: string) {
  const dt = new Date(`${String(d).slice(0, 10)}T00:00:00Z`);
  if (isNaN(dt.getTime())) return String(d);
  return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
}

// Logging must never break the send itself.
async function logSms(row: Record<string, unknown>) {
  try {
    await admin.from('tbl_sms_log').insert(row);
  } catch (e) {
    console.error('sms log insert failed:', (e as Error).message);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);

  let logCtx: { booking_id: unknown; recipient: string; message: string } | null = null;
  try {
    // 1. Must be logged in as admin/staff.
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !auth?.user) return reply({ error: 'Not logged in.' }, 401);

    const { data: me } = await admin.from('tbl_profiles').select('role, business_id').eq('id', auth.user.id).maybeSingle();
    if (!me || !ALLOWED_ROLES.includes(me.role)) return reply({ error: 'Not allowed.' }, 403);

    // 2. Load the booking.
    const body = await req.json().catch(() => ({}));
    const bookingId = body?.booking_id;
    if (!bookingId) return reply({ error: 'booking_id is required.' }, 400);
    const wasPending = body?.previous_status === 'Pending';

    const { data: booking, error: bErr } = await admin.from('tbl_bookings')
      .select('booking_id, booking_status, client_name, client_contact_number, event_date, business_id, created_by')
      .eq('booking_id', bookingId).maybeSingle();
    if (bErr) throw new Error(`load booking: ${bErr.message}`);
    if (!booking) return reply({ error: 'Booking not found.' }, 404);

    let bookingBusinessId = booking.business_id;
    if (!bookingBusinessId && booking.created_by) {
      const { data: creator } = await admin.from('tbl_profiles').select('business_id').eq('id', booking.created_by).maybeSingle();
      bookingBusinessId = creator?.business_id ?? null;
    }
    if (me.business_id && bookingBusinessId && me.business_id !== bookingBusinessId) {
      return reply({ error: 'Not allowed.' }, 403);
    }
    if (booking.booking_status !== 'Cancelled') return reply({ sent: false, reason: 'not_cancelled' });

    // 3. Phone number (fall back to the client's profile, same as the confirmation SMS).
    let rawPhone = booking.client_contact_number;
    if (!normalizePhone(rawPhone) && booking.created_by) {
      const { data: owner } = await admin.from('tbl_profiles').select('contact_number').eq('id', booking.created_by).maybeSingle();
      if (owner?.contact_number) rawPhone = owner.contact_number;
    }
    const to = normalizePhone(rawPhone);
    if (!to) {
      await logSms({ booking_id: bookingId, recipient: String(rawPhone ?? ''), ok: false, error: 'invalid_phone' });
      return reply({ sent: false, reason: 'invalid_phone' });
    }

    let bizName = 'Caterlytics';
    if (bookingBusinessId) {
      const { data: biz } = await admin.from('tbl_business').select('business_name').eq('business_id', bookingBusinessId).maybeSingle();
      if (biz?.business_name) bizName = biz.business_name;
    }

    const firstName = String(booking.client_name ?? '').trim().split(/\s+/)[0] || 'there';
    const contactNumber = Deno.env.get('SUPPORT_CONTACT_NUMBER') ?? '09673193013';
    const shortBiz = bizName.length > 30 ? bizName.slice(0, 29) + '…' : bizName; // keep it near 1 SMS
    const date = formatDate(booking.event_date);
    const message = wasPending
      ? `Hi ${firstName}, we're sorry, your booking request with ${shortBiz} for ${date} could not be accepted. Questions? Call ${contactNumber}.`
      : `Hi ${firstName}, your booking with ${shortBiz} on ${date} has been CANCELLED. Questions? Call ${contactNumber}.`;
    logCtx = { booking_id: bookingId, recipient: to, message };

    const providerResponse = await sendSms(to, message);
    console.log('send-booking-cancel-sms provider response:', JSON.stringify(providerResponse));
    await logSms({
      ...logCtx,
      ok: true,
      provider_status: String(providerResponse?.status ?? 'unknown'),
      provider_response: providerResponse ?? null,
    });
    return reply({ sent: true });
  } catch (e) {
    const msg = (e as Error).message;
    console.error('send-booking-cancel-sms failed:', msg);
    if (logCtx) await logSms({ ...logCtx, ok: false, provider_status: 'error', error: msg });
    return reply({ sent: false, reason: 'error', error: 'The SMS provider rejected or could not send the text. ' + msg, detail: msg }, 500);
  }
});