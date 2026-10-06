import { supabase } from '../supabaseClient';

// Communication Hub: Super Admin broadcasts announcements to every tenant.
// Requires announcements.sql. RLS is the real boundary: only Super Admin can
// write, and tenants only ever receive rows that are active and not expired.

const COLUMNS = 'announcement_id, title, message, severity, is_active, expires_at, created_at';

function isLive(a) {
  return a.is_active && (!a.expires_at || new Date(a.expires_at) > new Date());
}

// Tenant side: live announcements, newest first.
// Returns [] (instead of throwing) if the table doesn't exist yet so the
// rest of the dashboard keeps working.
export async function getActiveAnnouncements() {
  const { data, error } = await supabase
    .from('tbl_announcements')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) {
    console.error('Announcements not available:', error.message);
    return [];
  }
  return (data || []).filter(isLive);
}

// Super Admin side: everything, including hidden and expired ones.
export async function getAllAnnouncements() {
  const { data, error } = await supabase
    .from('tbl_announcements')
    .select(COLUMNS)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message || 'Failed to load announcements.');
  return data || [];
}

export async function createAnnouncement({ title, message, severity = 'info', expiresAt = null }) {
  const cleanTitle = String(title || '').trim();
  const cleanMessage = String(message || '').trim();
  if (cleanTitle.length < 3 || cleanTitle.length > 120) {
    throw new Error('Title must be 3 to 120 characters.');
  }
  if (cleanMessage.length < 3 || cleanMessage.length > 1000) {
    throw new Error('Message must be 3 to 1000 characters.');
  }
  if (!['info', 'warning', 'critical'].includes(severity)) {
    throw new Error('Invalid announcement type.');
  }
  const { data, error } = await supabase
    .from('tbl_announcements')
    .insert({
      title: cleanTitle,
      message: cleanMessage,
      severity,
      expires_at: expiresAt || null,
    })
    .select(COLUMNS)
    .single();
  if (error) throw new Error(error.message || 'Failed to publish the announcement.');
  return data;
}

export async function setAnnouncementActive(announcementId, isActive) {
  const { error } = await supabase
    .from('tbl_announcements')
    .update({ is_active: !!isActive })
    .eq('announcement_id', announcementId);
  if (error) throw new Error(error.message || 'Failed to update the announcement.');
}

export async function deleteAnnouncement(announcementId) {
  const { error } = await supabase
    .from('tbl_announcements')
    .delete()
    .eq('announcement_id', announcementId);
  if (error) throw new Error(error.message || 'Failed to delete the announcement.');
}