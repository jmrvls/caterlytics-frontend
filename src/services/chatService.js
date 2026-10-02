import { supabase } from '../supabaseClient';

// Real-time chat between clients and a catering business's staff.
// All writes go through SECURITY DEFINER RPCs (see supabase/chat_support.sql).

function isMissingFunction(error) {
  return (
    error?.code === '42883' ||
    error?.code === 'PGRST202' ||
    /could not find the function/i.test(error?.message || '')
  );
}

function toError(error, fallback) {
  if (isMissingFunction(error)) {
    const err = new Error('Chat is not set up in the database yet. Run chat_support.sql in the Supabase SQL Editor.');
    err.code = 'CHAT_NOT_SET_UP';
    return err;
  }
  return new Error(error?.message || fallback);
}

// Conversations visible to the caller (client: own chats, staff: business inbox).
// Columns: conversation_id, business_id, business_name, logo_url, client_id,
//          client_name, last_message_at, last_message_preview, unread
export async function listConversations() {
  const { data, error } = await supabase.rpc('chat_list_conversations');
  if (error) throw toError(error, 'Failed to load conversations.');
  return (data || []).map((c) => ({ ...c, unread: Number(c.unread) || 0 }));
}

// Client: open (or reuse) the conversation with a business. Returns conversation_id.
export async function startConversation(businessId) {
  const { data, error } = await supabase.rpc('chat_start_conversation', { p_business_id: businessId });
  if (error) throw toError(error, 'Could not start the conversation.');
  return data;
}

// Messages with id > afterId (0 = from the start), oldest first.
export async function getMessages(conversationId, afterId = 0) {
  const { data, error } = await supabase.rpc('chat_get_messages', {
    p_conversation_id: conversationId,
    p_after_id: afterId
  });
  if (error) throw toError(error, 'Failed to load messages.');
  return (data || []).map((m) => ({ ...m, message_id: Number(m.message_id) }));
}

export async function sendMessage(conversationId, body) {
  const text = (body || '').trim();
  if (!text) throw new Error('Type a message first.');
  if (text.length > 2000) throw new Error('Message is too long (max 2000 characters).');
  const { error } = await supabase.rpc('chat_send_message', {
    p_conversation_id: conversationId,
    p_body: text
  });
  if (error) throw toError(error, 'Failed to send the message.');
}

export async function markConversationRead(conversationId) {
  const { error } = await supabase.rpc('chat_mark_read', { p_conversation_id: conversationId });
  if (error) throw toError(error, 'Failed to mark as read.');
}

// One Realtime channel for the whole inbox. RLS decides which rows each user
// is allowed to receive, so every event here is already scoped to the caller.
// Returns an unsubscribe function.
export function subscribeToChat({ onMessage, onConversationChange }) {
  const name = `chat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const channel = supabase
    .channel(name)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tbl_chat_messages' }, (payload) => {
      onMessage?.(payload.new);
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'tbl_chat_conversations' }, () => {
      onConversationChange?.();
    })
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

// ---------- pure helpers ----------

export function formatChatTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  if (sameDay) return d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' });
  const sameYear = d.getFullYear() === now.getFullYear();
  return d.toLocaleDateString('en-PH', sameYear ? { month: 'short', day: 'numeric' } : { year: 'numeric', month: 'short', day: 'numeric' });
}