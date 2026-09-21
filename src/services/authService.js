import { supabase } from '../supabaseClient';

async function usernameToEmail(username) {
  if (username.includes('@')) {
    return username.toLowerCase();
  }
  const { data, error } = await supabase.rpc('resolve_login_email', { p_username: username });
  if (error || !data) {
    // No matching username -- fall through with something that will
    // never match a real account, so the caller gets the normal
    // "Invalid username or password" error instead of a different one.
    return `${username.toLowerCase()}@caterlytics.local`;
  }
  return data;
}

export async function loginUser(username, password) {
  const email = await usernameToEmail(username);

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

export async function registerUser(username, email, password, full_name, contact_number) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name,
        contact_number,
        role: 'Client',
      },
      // Where Supabase sends the user after they click the confirmation
      // link in their email. We don't have a dedicated "welcome" page,
      // so send them back to the login screen — the ?confirmed=true flag
      // lets LoginView show a "your email is confirmed" banner instead
      // of just silently dropping them on a blank login form.
      emailRedirectTo: `${window.location.origin}/?confirmed=true`,
    },
  });

  if (error) throw new Error(error.message);

  // Supabase returns an empty identities array (and no error) when the email
  // is already registered, to avoid leaking which emails exist.
  if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
    throw new Error('This email is already registered. Please sign in instead.');
  }

  // If "Confirm email" is ON in Supabase: no session yet, user must click
  // the emailed link first.
  // If "Confirm email" is OFF: a session is returned right away. This app
  // keeps its own login state, so sign out and send the user to the login
  // screen instead of leaving a half-logged-in session behind.
  const needsEmailConfirmation = !data.session;
  if (data.session) {
    await supabase.auth.signOut();
  }

  return {
    message: needsEmailConfirmation ? 'Confirmation email sent.' : 'Account created.',
    needsEmailConfirmation,
    user: {
      user_id: data.user.id,
      username,
      full_name,
      role: 'Client',
    },
  };
}

export async function logoutUser() {
  await supabase.auth.signOut();
}


export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) throw new Error(error.message);
  return { message: 'Password reset email sent.' };
}


export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message);
  return { message: 'Password updated successfully.' };
}