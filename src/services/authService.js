import { supabase } from '../supabaseClient';

// Accepts either a username or a contact number (any common PH format:
// 09171234567, +639171234567, with or without spaces/dashes). Email is no
// longer accepted here — login is username-or-number only.
function looksLikePhoneNumber(identifier) {
  return /^[+]?[\d\s-]{7,}$/.test(identifier.trim());
}

async function loginIdentifierToEmail(identifier) {
  // Stray leading/trailing whitespace (very common from autofill or
  // copy-paste out of a password manager) would otherwise make an
  // otherwise-correct username fail to resolve to its email, since the
  // lookup below is case-insensitive but not whitespace-insensitive.
  const cleanIdentifier = identifier.trim();

  if (looksLikePhoneNumber(cleanIdentifier)) {
    const { data, error } = await supabase.rpc('resolve_login_email_by_phone', { p_contact_number: cleanIdentifier });
    if (error || !data) {
      // No matching number -- fall through with something that will
      // never match a real account, so the caller gets the normal
      // "Invalid username or password" error instead of a different one.
      return `${cleanIdentifier.replace(/\D/g, '')}@gmail.com`;
    }
    return data;
  }

  const { data, error } = await supabase.rpc('resolve_login_email', { p_username: cleanIdentifier });
  if (error || !data) {
    return `${cleanIdentifier.toLowerCase()}@gmail.com`;
  }
  return data;
}

export async function loginUser(identifier, password) {
  const email = await loginIdentifierToEmail(identifier);

  // Trim the password too -- a trailing space picked up from autofill/paste
  // is invisible in the masked field and silently breaks the exact-match
  // bcrypt comparison Supabase Auth does.
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password: password.trim(),
  });

  if (error) throw new Error('Invalid username or password.');

  const { data: profile, error: profileError } = await supabase
    .from('tbl_profiles')
    .select('username, full_name, role, avatar_url, business_id')
    .eq('id', data.user.id)
    .single();

  if (profileError) throw new Error('Failed to load user profile.');

  // Multi-tenant gate: a business-scoped account (Admin/Staff/Owner-Manager)
  // can only log in while its business is Active. A brand-new self-service
  // registration starts as 'Pending' until the platform Super Admin approves
  // it; a tenant the Super Admin has since suspended is locked out the same
  // way. Client accounts (no business yet) and the Super Admin itself
  // (no business at all) skip this check entirely.
  if (profile.business_id) {
    const { data: business, error: businessError } = await supabase
      .from('tbl_business')
      .select('status, business_name')
      .eq('business_id', profile.business_id)
      .maybeSingle();

    // Fail CLOSED (same as the router guard): if the business can't be
    // verified, don't let the user in. Before, a lookup error skipped this
    // whole block, logged them in, and the router then bounced them back to
    // the login page with no explanation.
    if (businessError || !business) {
      await supabase.auth.signOut();
      throw new Error('Could not verify your business account. Please try again or contact the platform admin.');
    }

    {
      if (business.status === 'Pending') {
        await supabase.auth.signOut();
        throw new Error('Your business registration is still pending approval by the platform admin.');
      }
      if (business.status === 'Suspended') {
        await supabase.auth.signOut();
        throw new Error('This business account has been suspended. Contact the platform admin.');
      }
      if (business.status === 'Rejected') {
        await supabase.auth.signOut();
        throw new Error('This business registration was not approved. Contact the platform admin.');
      }
      if (business.status === 'Closed') {
        await supabase.auth.signOut();
        throw new Error('This business is closed and can no longer be accessed. Contact the platform admin.');
      }
      // Safety net: any status other than Active (including ones added later)
      // must not get in. The router guard blocks non-Active businesses too, so
      // without this the user would log in and then be bounced back to the
      // login page with no explanation.
      if (business.status !== 'Active') {
        await supabase.auth.signOut();
        throw new Error('This business account is not active. Contact the platform admin.');
      }
    }
  }

  return {
    message: 'Login successful',
    token: data.session.access_token,
    user: {
      user_id: data.user.id,
      username: profile.username,
      full_name: profile.full_name,
      role: profile.role,
      business_id: profile.business_id || null,
      avatar_url: profile.avatar_url || '',
      email: data.user.email,
    },
  };
}

// ---------------------------------------------------------------------------
// SMS OTP: registration + forgot password
//
// Everything goes through the `phone-otp` edge function (sent via PhilSMS).
// Registration: the account is only created AFTER the correct OTP is entered.
// Forgot password: the OTP and the new password are checked together on the
// server, so no login session is ever opened on the browser.
// ---------------------------------------------------------------------------
async function callPhoneOtp(body) {
  const { data, error } = await supabase.functions.invoke('phone-otp', { body });
  if (error) {
    let message = 'Something went wrong. Please try again.';
    try {
      // The function replies with { error: '...' } on failures.
      const payload = await error.context.json();
      if (payload?.error) message = payload.error;
    } catch {
      // No readable body (e.g. network down) -- keep the default message.
    }
    throw new Error(message);
  }
  return data;
}

// Step 1 of registration: check the username/number are free and text the OTP.
// No account exists yet at this point.
export async function requestRegistrationOtp(username, contact_number) {
  await callPhoneOtp({ action: 'send', purpose: 'register', phone: contact_number, username });
  return { message: 'OTP sent.' };
}

// Step 2 of registration: the user typed the 6-digit code. If it is correct
// the server creates the account (as a Client). Nobody is logged in afterwards;
// the user signs in on the login screen.
export async function verifyRegistrationOtp({ username, password, full_name, contact_number }, code) {
  await callPhoneOtp({
    action: 'register',
    phone: contact_number,
    code,
    username,
    password,
    full_name,
  });
  return { message: 'Phone verified. Account created.' };
}

// "Resend code" on the registration OTP screen.
export async function resendRegistrationOtp(contact_number, username) {
  await callPhoneOtp({ action: 'send', purpose: 'register', phone: contact_number, username });
  return { message: 'OTP resent.' };
}

export async function logoutUser() {
  await supabase.auth.signOut();
}

// Forgot password, step 1: text a 6-digit code to the number on the account.
export async function requestPasswordReset(contact_number) {
  await callPhoneOtp({ action: 'send', purpose: 'reset', phone: contact_number });
  return { message: 'OTP sent to phone.' };
}

// The number + code that passed step 2. Kept in memory only (never stored),
// and sent again with the new password in step 3.
let pendingReset = null;

// Forgot password, step 2: check the code (it is NOT used up yet).
export async function verifyPasswordResetOtp(contact_number, token) {
  await callPhoneOtp({ action: 'reset-verify', phone: contact_number, code: token });
  pendingReset = { phone: contact_number, code: token };
  return { message: 'OTP verified.' };
}

// "Resend code" on the reset OTP screen.
export async function resendPasswordResetOtp(contact_number) {
  await callPhoneOtp({ action: 'send', purpose: 'reset', phone: contact_number });
  return { message: 'OTP resent.' };
}

// Forgot password, step 3: set the new password. The server re-checks the code
// and uses it up, so it cannot be reused.
export async function setNewPasswordAfterReset(newPassword) {
  if (!pendingReset) {
    throw new Error('Your reset session expired. Please request a new code.');
  }
  await callPhoneOtp({
    action: 'reset',
    phone: pendingReset.phone,
    code: pendingReset.code,
    new_password: newPassword,
  });
  pendingReset = null;
  return { message: 'Password updated successfully.' };
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  return { message: 'Password updated successfully.' };
}