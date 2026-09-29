// phone-otp: SMS OTP for registration and password reset (sent through PhilSMS).
//
// Deploy with:  supabase functions deploy phone-otp --no-verify-jwt
// verify_jwt is OFF because the callers are NOT logged in yet (they are
// registering or have forgotten their password). Protection comes from the OTP
// itself: codes are HMAC-hashed, expire in 5 minutes, allow 5 guesses, are
// single-use, and sending is rate limited to protect SMS credits.
//
// Actions (POST JSON):
//   send          { purpose: 'register'|'reset', phone, username? }
//   register      { phone, code, username, password, full_name }
//   reset-verify  { phone, code }                       (checks code, does not consume it)
//   reset         { phone, code, new_password }
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { normalizePhone, sendSms } from '../_shared/philsms.ts';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const reply = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const admin = createClient(Deno.env.get('SUPABASE_URL')!, SERVICE_KEY);

const CODE_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 60 * 1000;
const MAX_PER_PHONE_PER_HOUR = 5;
const MAX_GLOBAL_PER_HOUR = 40;
const INVALID_CODE = 'Invalid or expired code. Please try again.';

// 63917xxxxxxx -> 0917xxxxxxx (how numbers are stored on profiles)
const toLocal = (p: string) => '0' + p.slice(-10);

async function hashCode(phone: string, purpose: string, code: string) {
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(SERVICE_KEY), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${purpose}:${phone}:${code}`));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function randomCode() {
  const n = crypto.getRandomValues(new Uint32Array(1))[0] % 1_000_000;
  return String(n).padStart(6, '0');
}

async function profilesByPhone(phone: string): Promise<{ id: string; username: string }[]> {
  const { data, error } = await admin.rpc('find_profiles_by_phone', { p_phone: phone });
  if (error) throw new Error(`find_profiles_by_phone: ${error.message}`);
  return data ?? [];
}

async function usernameTaken(username: string) {
  const safe = username.replace(/[\\%_]/g, '\\$&'); // escape LIKE wildcards
  const { data, error } = await admin.from('tbl_profiles').select('id').ilike('username', safe).limit(1);
  if (error) throw new Error(`usernameTaken: ${error.message}`);
  return (data?.length ?? 0) > 0;
}

function validatePassword(pw: string) {
  if (pw.length < 8) throw new HttpError(400, 'Password must be at least 8 characters long.');
  if (!/[A-Za-z]/.test(pw) || !/[0-9]/.test(pw)) {
    throw new HttpError(400, 'Password must contain at least one letter and one number.');
  }
}

async function throttle(phone: string, purpose: string) {
  const now = Date.now();

  const { data: last } = await admin.from('tbl_otp_codes').select('created_at')
    .eq('phone', phone).eq('purpose', purpose)
    .order('created_at', { ascending: false }).limit(1);
  if (last?.length && now - new Date(last[0].created_at).getTime() < RESEND_COOLDOWN_MS) {
    throw new HttpError(429, 'Please wait a minute before requesting another code.');
  }

  const hourAgo = new Date(now - 60 * 60 * 1000).toISOString();
  const { count: phoneCount } = await admin.from('tbl_otp_codes')
    .select('id', { count: 'exact', head: true }).eq('phone', phone).gte('created_at', hourAgo);
  if ((phoneCount ?? 0) >= MAX_PER_PHONE_PER_HOUR) {
    throw new HttpError(429, 'Too many code requests for this number. Please try again in an hour.');
  }

  const { count: globalCount } = await admin.from('tbl_otp_codes')
    .select('id', { count: 'exact', head: true }).gte('created_at', hourAgo);
  if ((globalCount ?? 0) >= MAX_GLOBAL_PER_HOUR) {
    throw new HttpError(429, 'Too many requests right now. Please try again later.');
  }
}

// Validates a code. consume=true makes it single-use.
async function checkCode(phone: string, purpose: string, code: unknown, consume: boolean) {
  const clean = String(code ?? '').trim();
  if (!/^\d{6}$/.test(clean)) throw new HttpError(400, INVALID_CODE);

  const { data: rows } = await admin.from('tbl_otp_codes').select('id, code_hash')
    .eq('phone', phone).eq('purpose', purpose).eq('consumed', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false }).limit(1);
  const row = rows?.[0];
  if (!row) throw new HttpError(400, INVALID_CODE);

  // Count this guess first (atomic), so parallel requests can't beat the limit.
  const { data: attempts } = await admin.rpc('bump_otp_attempts', { p_id: row.id });
  if ((attempts ?? MAX_ATTEMPTS + 1) > MAX_ATTEMPTS) {
    await admin.from('tbl_otp_codes').update({ consumed: true }).eq('id', row.id);
    throw new HttpError(400, 'Too many wrong attempts. Please request a new code.');
  }

  const expected = await hashCode(phone, purpose, clean);
  if (!safeEqual(row.code_hash, expected)) throw new HttpError(400, INVALID_CODE);

  if (consume) {
    const { data: claimed } = await admin.from('tbl_otp_codes')
      .update({ consumed: true }).eq('id', row.id).eq('consumed', false).select('id');
    if (!claimed?.length) throw new HttpError(400, INVALID_CODE);
  }
}

async function handleSend(body: any) {
  const purpose = body.purpose;
  if (purpose !== 'register' && purpose !== 'reset') throw new HttpError(400, 'Invalid request.');

  const phone = normalizePhone(body.phone);
  if (!phone) throw new HttpError(400, 'Please enter a valid Philippine mobile number (e.g. 0917 123 4567).');

  const matches = await profilesByPhone(phone);
  if (purpose === 'register') {
    if (matches.length) throw new HttpError(409, 'That contact number is already registered.');
    const username = String(body.username ?? '').trim();
    if (username && await usernameTaken(username)) throw new HttpError(409, 'That username is already taken.');
  } else {
    // Don't reveal whether a number has an account.
    if (!matches.length) return { ok: true };
    if (matches.length > 1) {
      throw new HttpError(409, 'This number is linked to more than one account. Please contact the administrator.');
    }
  }

  await throttle(phone, purpose);

  // Housekeeping + invalidate any earlier unused code for this number.
  await admin.from('tbl_otp_codes').delete().lt('created_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString());
  await admin.from('tbl_otp_codes').update({ consumed: true })
    .eq('phone', phone).eq('purpose', purpose).eq('consumed', false);

  const code = randomCode();
  const { data: inserted, error: insErr } = await admin.from('tbl_otp_codes').insert({
    phone,
    purpose,
    code_hash: await hashCode(phone, purpose, code),
    expires_at: new Date(Date.now() + CODE_TTL_MS).toISOString(),
  }).select('id').single();
  if (insErr || !inserted) throw new Error(`insert otp: ${insErr?.message}`);

  try {
    // Under 160 characters = 1 SMS unit.
    await sendSms(phone, `Caterlytics: ${code} is your verification code. It expires in 5 minutes. Do not share it.`);
  } catch (e) {
    await admin.from('tbl_otp_codes').delete().eq('id', inserted.id);
    console.error('sendSms failed:', (e as Error).message);
    throw new HttpError(502, 'We could not send the SMS right now. Please try again later.');
  }
  return { ok: true };
}

async function handleRegister(body: any) {
  const phone = normalizePhone(body.phone);
  if (!phone) throw new HttpError(400, 'Please enter a valid Philippine mobile number.');

  const username = String(body.username ?? '').trim();
  const fullName = String(body.full_name ?? '').trim();
  // Login trims the password, so store it trimmed too.
  const password = String(body.password ?? '').trim();

  if (!/^[A-Za-z0-9._-]{3,30}$/.test(username)) {
    throw new HttpError(400, 'Username must be 3-30 characters: letters, numbers, dot, dash or underscore only.');
  }
  if (!fullName || fullName.length > 100) throw new HttpError(400, 'Please enter your full name.');
  validatePassword(password);

  // Check before spending the code so a taken username doesn't burn it.
  if ((await profilesByPhone(phone)).length) throw new HttpError(409, 'That contact number is already registered.');
  if (await usernameTaken(username)) throw new HttpError(409, 'That username is already taken.');

  await checkCode(phone, 'register', body.code, true);

  // Internal login identity (nobody logs in with it; login is username/number based).
  const email = `${username.toLowerCase()}@gmail.com`;
  const { error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { username, full_name: fullName, contact_number: toLocal(phone), role: 'Client' },
  });
  if (error) {
    console.error('createUser failed:', error.message);
    if (/already|registered|exists/i.test(error.message)) throw new HttpError(409, 'That username is already taken.');
    throw new HttpError(500, 'We could not create the account. Please try again.');
  }
  return { ok: true };
}

async function handleReset(body: any) {
  const phone = normalizePhone(body.phone);
  if (!phone) throw new HttpError(400, INVALID_CODE);

  const password = String(body.new_password ?? '').trim();
  validatePassword(password);

  await checkCode(phone, 'reset', body.code, true);

  const matches = await profilesByPhone(phone);
  if (matches.length !== 1) throw new HttpError(400, INVALID_CODE);

  const { error } = await admin.auth.admin.updateUserById(matches[0].id, { password });
  if (error) {
    console.error('updateUserById failed:', error.message);
    throw new HttpError(500, 'We could not update the password. Please try again.');
  }
  return { ok: true };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return reply({ error: 'Method not allowed.' }, 405);

  try {
    const body = await req.json();
    switch (body?.action) {
      case 'send':
        return reply(await handleSend(body));
      case 'register':
        return reply(await handleRegister(body));
      case 'reset-verify': {
        const phone = normalizePhone(body.phone);
        if (!phone) throw new HttpError(400, INVALID_CODE);
        await checkCode(phone, 'reset', body.code, false);
        return reply({ ok: true });
      }
      case 'reset':
        return reply(await handleReset(body));
      default:
        return reply({ error: 'Invalid request.' }, 400);
    }
  } catch (e) {
    if (e instanceof HttpError) return reply({ error: e.message }, e.status);
    console.error('phone-otp failed:', (e as Error).message);
    return reply({ error: 'Something went wrong. Please try again.' }, 500);
  }
});