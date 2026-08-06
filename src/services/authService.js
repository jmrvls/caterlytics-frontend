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
    .select('username, full_name, role')
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
    },
  };
}

export async function registerUser(username, password, full_name) {
  const email = usernameToEmail(username);

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        username,
        full_name,
        role: 'Client',
      },
    },
  });

  if (error) throw new Error(error.message);

  return {
    message: 'Account created successfully',
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