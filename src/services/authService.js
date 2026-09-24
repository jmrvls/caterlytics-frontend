import { supabase } from '../supabaseClient';

// Accepts either a username or a contact number (any common PH format:
// 09171234567, +639171234567, with or without spaces/dashes). Email is no
// longer accepted here — login is username-or-number only.
function looksLikePhoneNumber(identifier) {
  return /^[+]?[\d\s-]{7,}$/.test(identifier.trim());
}

async function loginIdentifierToEmail(identifier) {
  if (looksLikePhoneNumber(identifier)) {
    const { data, error } = await supabase.rpc('resolve_login_email_by_phone', { p_contact_number: identifier });
    if (error || !data) {
      // No matching number -- fall through with something that will
      // never match a real account, so the caller gets the normal
      // "Invalid username or password" error instead of a different one.
      return `${identifier.replace(/\D/g, '')}@gmail.com`;
    }
    return data;
  }

  const { data, error } = await supabase.rpc('resolve_login_email', { p_username: identifier });
  if (error || !data) {
    return `${identifier.toLowerCase()}@gmail.com`;
  }
  return data;
}

export async function loginUser(identifier, password) {
  const email = await loginIdentifierToEmail(identifier);

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new Error('Invalid username or password.');

  const { data: profile, error: profileError } = await supabase
    .from('tbl_profiles')
    .select('username, full_name, role, avatar_url')
    .eq('id', data.user.id)
    .single();

  if (profileError) throw new Error('Failed to load user profile.');

  return {
    message: 'Login successful',
    token: data.session.access_token,
    user: {
      user_id: data.user.id,
      username: profile.username,
      full_name: profile.full_name,
      role: profile.role,
      avatar_url: profile.avatar_url || '',
      email: data.user.email,
    },
  };
}

export async function registerUser(username, password, full_name, contact_number) {
  // "Confirm email" must be OFF in the Supabase dashboard (Auth > Providers > Email)
  // so this returns an active session right away.
  //
  // TEMPORARY: there's no Email field in the form anymore (number + password
  // is the real plan), but Supabase still needs *some* identity to create
  // the account with, so we generate one internally from the username.
  // Nobody sees this value or logs in with it.
  //
  // Domain choice matters here: Supabase Auth rejects the whole signUp()
  // call with "Email address ... is invalid" if the domain has no real
  // DNS/MX records (this is why made-up domains like @caterlytics.local
  // or @caterlytics.com fail -- they were never registered). @gmail.com
  // always has valid MX records, so it always passes that check. Since
  // "Confirm email" is OFF, no actual email is ever sent, so it doesn't
  // matter that we don't own the mailbox.
  //
  // Phone OTP verification is also skipped for now — Twilio/Phone provider
  // isn't fully configured yet in Supabase, so calling updateUser({ phone })
  // here would just fail and block every signup. Once Twilio is ready,
  // un-comment the phone step below to require OTP verification again.
  const internalEmail = `${username.toLowerCase()}@gmail.com`;

  const { data, error } = await supabase.auth.signUp({
    email: internalEmail,
    password,
    options: {
      data: {
        username,
        full_name,
        contact_number,
        role: 'Client',
      },
    },
  });

  if (error) throw new Error(error.message);

  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('That username is already taken. Please choose another.');
  }

  if (!data.session) {
    throw new Error('Registration is not fully set up yet. Please contact the administrator.');
  }

  // --- Phone OTP step (disabled until Twilio/Phone provider is ready) ---
  // const { error: phoneError } = await supabase.auth.updateUser({ phone: contact_number });
  // if (phoneError) throw new Error(phoneError.message);

  // This app keeps its own login state, so sign out now and send the user
  // to the login screen rather than leaving a half-logged-in session behind.
  await supabase.auth.signOut();

  return {
    message: 'Account created.',
    user: {
      user_id: data.user.id,
      username,
      full_name,
      role: 'Client',
    },
  };
}

// Called after the user types in the 6-digit code they received by SMS.
export async function verifyRegistrationOtp(contact_number, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: contact_number,
    token,
    type: 'phone_change',
  });

  if (error) throw new Error(error.message);

  // The account is now fully verified. This app keeps its own login state,
  // so sign out here and send the user to the login screen rather than
  // leaving a half-logged-in session behind.
  await supabase.auth.signOut();

  return { message: 'Phone verified. Account activated.', user: data.user };
}

// Called if the user taps "Resend code" on the OTP screen.
export async function resendRegistrationOtp(contact_number) {
  const { error } = await supabase.auth.updateUser({ phone: contact_number });
  if (error) throw new Error(error.message);
  return { message: 'OTP resent.' };
}

export async function logoutUser() {
  await supabase.auth.signOut();
}


export async function requestPasswordReset(contact_number) {
  // Sends a 6-digit SMS OTP to sign the user in — works only if this phone
  // number is already attached and verified on an account (which happens
  // during registration's phone verification step).
  const { error } = await supabase.auth.signInWithOtp({ phone: contact_number });
  if (error) throw new Error(error.message);
  return { message: 'OTP sent to phone.' };
}

// Called after the user types in the 6-digit code from the reset SMS.
// On success this returns an authenticated session, which is what lets
// the next step (setNewPassword) actually change the password.
export async function verifyPasswordResetOtp(contact_number, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    phone: contact_number,
    token,
    type: 'sms',
  });
  if (error) throw new Error(error.message);
  return { message: 'OTP verified.', user: data.user };
}

// Called if the user taps "Resend code" on the reset OTP screen.
export async function resendPasswordResetOtp(contact_number) {
  const { error } = await supabase.auth.signInWithOtp({ phone: contact_number });
  if (error) throw new Error(error.message);
  return { message: 'OTP resent.' };
}

// Final step: set the new password on the session opened by the OTP
// verification above, then sign out so the user logs back in fresh.
export async function setNewPasswordAfterReset(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  await supabase.auth.signOut();
  return { message: 'Password updated successfully.' };
}


export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  return { message: 'Password updated successfully.' };
}