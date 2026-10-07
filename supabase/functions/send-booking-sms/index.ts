// send-booking-sms: texts the client that their booking is confirmed.
//
// POST { booking_id }  ->  { sent: true } | { sent: false, reason }
// Every send attempt is now recorded in public.tbl_sms_log (with PhilSMS's
// full response) so a "client never got the SMS" report can be traced.
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

  let claimedId: string | null = null;
  let claimRestore: string | null = null;
  let logCtx: { booking_id: unknown; recipient: string; message: string } | null = null;
  try {
    // 1. Who is calling? Must be logged in as admin/staff.
    const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '');
    const { data: auth, error: authErr } = await admin.auth.getUser(token);
    if (authErr || !auth?.user) return reply({ error: 'Not logged in.' }, 401);

    const { data: me } = await admin.from('tbl_profiles').select('role, business_id').eq('id', auth.user.id).maybeSingle();
    if (!me || !ALLOWED_ROLES.includes(me.role)) return reply({ error: 'Not allowed.' }, 403);

    // 2. Load the booking.
    const body = await req.json().catch(() => ({}));
    const bookingId = body?.booking_id;
    if (!bookingId) return reply({ error: 'booking_id is required.' }, 400);

    const { data: booking, error: bErr } = await admin.from('tbl_bookings')
      .select('booking_id, booking_status, client_name, client_contact_number, event_date, event_time, business_id, created_by, confirmation_sms_sent_at')
      .eq('booking_id', bookingId).maybeSingle();
    if (bErr) throw new Error(`load booking: ${bErr.message}`);
    if (!booking) return reply({ error: 'Booking not found.' }, 404);

    // Some bookings have no business_id; in that case use the business of whoever created it,
    // so staff of another business can never trigger (and spend credits on) this booking.
    let bookingBusinessId = booking.business_id;
    if (!bookingBusinessId && booking.created_by) {
      const { data: creator } = await admin.from('tbl_profiles').select('business_id').eq('id', booking.created_by).maybeSingle();
      bookingBusinessId = creator?.business_id ?? null;
    }
    if (me.business_id && bookingBusinessId && me.business_id !== bookingBusinessId) {
      return reply({ error: 'Not allowed.' }, 403);
    }
    if (booking.booking_status !== 'Confirmed') return reply({ sent: false, reason: 'not_confirmed' });
    // force=true is the admin's "Resend SMS" button (PhilSMS accepted it earlier but it never arrived).
    const force = body?.force === true;
    if (booking.confirmation_sms_sent_at && !force) return reply({ sent: false, reason: 'already_sent' });

    // Bookings made from the client dashboard have no number saved on the booking,
    // so fall back to the contact number on the client's own profile.
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

    // 3. Claim the booking first so two quick calls can't both send (and charge twice).
    const prevSentAt = booking.confirmation_sms_sent_at ?? null;
    let claimQ = admin.from('tbl_bookings')
      .update({ confirmation_sms_sent_at: new Date().toISOString() })
      .eq('booking_id', bookingId);
    // Normal send: only claim if nobody sent yet. Forced resend: only claim if nobody touched it meanwhile.
    claimQ = prevSentAt === null ? claimQ.is('confirmation_sms_sent_at', null) : claimQ.eq('confirmation_sms_sent_at', prevSentAt);
    const { data: claimed } = await claimQ.select('booking_id');
    if (!claimed?.length) return reply({ sent: false, reason: 'already_sent' });
    claimedId = bookingId;
    claimRestore = prevSentAt;

    let bizName = 'Caterlytics';
    if (bookingBusinessId) {
      const { data: biz } = await admin.from('tbl_business').select('business_name').eq('business_id', bookingBusinessId).maybeSingle();
      if (biz?.business_name) bizName = biz.business_name;
    }

    const firstName = String(booking.client_name ?? '').trim().split(/\s+/)[0] || 'there';
    const message = `Hi ${firstName}, your booking with ${bizName} on ${formatDate(booking.event_date)} is CONFIRMED. Thank you!`;
    logCtx = { booking_id: bookingId, recipient: to, message };

    const providerResponse = await sendSms(to, message);
    console.log('send-booking-sms provider response:', JSON.stringify(providerResponse));
    await logSms({
      ...logCtx,
      ok: true,
      provider_status: String(providerResponse?.status ?? 'unknown'),
      provider_response: providerResponse ?? null,
    });
    claimedId = null;
    return reply({ sent: true });
  } catch (e) {
    // Sending failed: release the claim so it can be retried.
    if (claimedId) await admin.from('tbl_bookings').update({ confirmation_sms_sent_at: claimRestore }).eq('booking_id', claimedId);
    const msg = (e as Error).message;
    console.error('send-booking-sms failed:', msg);
    if (logCtx) await logSms({ ...logCtx, ok: false, provider_status: 'error', error: msg });
    return reply({ sent: false, reason: 'error', error: 'The SMS provider rejected or could not send the text. ' + msg, detail: msg }, 500);
  }
});