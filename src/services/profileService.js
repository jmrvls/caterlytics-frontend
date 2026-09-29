import { supabase } from '../supabaseClient';

// Lightweight query used by sidebars/top-navs across the app to show the
// user's uploaded profile picture (falls back to initials if none set).
export async function getMyAvatarUrl(userId) {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .select('avatar_url')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data.avatar_url || null;
}

export async function getMyProfile(userId) {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .select('id, username, full_name, role, contact_number, availability, avatar_url')
    .eq('id', userId)
    .single();

  if (error) throw new Error('Failed to load profile.');
  return data;
}

export async function updateMyProfile(userId, { full_name, contact_number }) {
  const { data, error } = await supabase
    .from('tbl_profiles')
    .update({ full_name, contact_number })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error('Failed to update profile.');
  return data;
}

// Uploads a new avatar image and updates tbl_profiles.avatar_url.
// File is stored at {userId}/avatar.{ext} so the RLS storage policies
// (which check the first folder segment against auth.uid()) allow it.
export async function uploadMyAvatar(userId, file) {
  const ext = file.name.split('.').pop();
  const filePath = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true, cacheControl: '3600' });

  if (uploadError) throw new Error('Failed to upload picture.');

  const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
  // Cache-bust so the new picture shows immediately instead of the
  // browser reusing a stale cached image at the same URL.
  const avatar_url = `${publicUrlData.publicUrl}?t=${Date.now()}`;

  const { data, error } = await supabase
    .from('tbl_profiles')
    .update({ avatar_url })
    .eq('id', userId)
    .select()
    .single();

  if (error) throw new Error('Failed to save picture.');
  return data;
}

export async function changeMyPassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw new Error(error.message || 'Failed to update password.');
  return { message: 'Password updated' };
}