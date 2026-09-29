// Supabase "Send SMS" Auth Hook -> sends the OTP through PhilSMS.
// Deploy with:  supabase functions deploy sms-hook --no-verify-jwt
// (Supabase Auth calls it, not a logged-in user, so JWT check is off;
//  the request is protected by the Standard Webhooks signature instead.)
import { Webhook } from 'https://esm.sh/standardwebhooks@1.0.0';
import { normalizePhone, sendSms } from '../_shared/philsms.ts';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  const payload = await req.text();
  const headers = Object.fromEntries(req.headers);
  const secret = (Deno.env.get('SEND_SMS_HOOK_SECRET') ?? '').replace('v1,whsec_', '');

  try {
    const { user, sms } = new Webhook(secret).verify(payload, headers) as {
      user: { phone: string };
      sms: { otp: string };
    };

    const to = normalizePhone(user.phone);
    if (!to) throw new Error('Not a valid Philippine mobile number.');

    // Keep under 160 characters so it costs 1 SMS unit.
    await sendSms(to, `Caterlytics: ${sms.otp} is your verification code. Do not share it with anyone.`);
    return json({});
  } catch (e) {
    console.error('sms-hook failed:', (e as Error).message); // never log the OTP itself
    return json({ error: { http_code: 500, message: (e as Error).message } }, 500);
  }
});
