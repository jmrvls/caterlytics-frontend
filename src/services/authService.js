import { supabase } from '../supabaseClient';

function usernameToEmail(username) {
  if (username.includes('@')) {
    return username.toLowerCase(); 
  }
  return `${username.toLowerCase()}@caterlytics.local`; 
}

export async function loginUser(username, password) {
  const email = usernameToEmail(username);

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
    },
  };
}

export async function registerUser(username, email, password, full_name) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name,
        role: 'Client',
      },
      // Where Supabase sends the user after they click the confirmation
      // link in their email. Since we don't have a dedicated "welcome"
      // page, send them straight back to the login screen.
      emailRedirectTo: `${window.location.origin}/`,
    },
  });

  if (error) throw new Error(error.message);

  // NOTE: with "Confirm email" enabled in Supabase, the account exists but
  // is unconfirmed at this point. No session is returned yet — the user
  // must click the confirmation link emailed to them before they can log in.
  return {
    message: 'Confirmation email sent.',
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