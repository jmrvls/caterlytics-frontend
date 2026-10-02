import { ref, onMounted, onUnmounted } from 'vue'
import { listConversations, subscribeToChat } from '../services/chatService'

// App-wide unread chat counter. Drives the red badge on the "Support Chat"
// sidebar item (Admin / Owner / Staff) and the "Messages" tab (Client).
//
// Module-level state so every page shares ONE count, ONE Realtime channel and
// ONE poll timer no matter how many views are mounted.
//
// Usage in any View:
//   import { useChatUnread } from '../composables/useChatUnread'
//   const { chatUnread } = useChatUnread()

const chatUnread = ref(0)
let subscriberCount = 0
let unsubscribe = null
let pollTimer = null
let refreshTimer = null

async function refreshChatUnread() {
  try {
    const rows = await listConversations()
    chatUnread.value = rows.reduce((n, c) => n + (Number(c.unread) || 0), 0)
  } catch {
    // Chat not set up yet / not logged in -- just show no badge.
    chatUnread.value = 0
  }
}

// Debounce: one message touches two tables -> two Realtime events.
function scheduleRefresh() {
  clearTimeout(refreshTimer)
  refreshTimer = setTimeout(refreshChatUnread, 300)
}

// ChatInbox calls this right after it marks a conversation read, so the badge
// clears instantly instead of waiting for the next refresh.
export function setChatUnread(n) {
  chatUnread.value = Number(n) || 0
}

function start() {
  refreshChatUnread()
  unsubscribe = subscribeToChat({
    onMessage: scheduleRefresh,
    onConversationChange: scheduleRefresh
  })
  // Safety net if Realtime isn't enabled: re-check every 15s while visible.
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') refreshChatUnread()
  }, 15000)
}

function stop() {
  if (unsubscribe) unsubscribe()
  unsubscribe = null
  clearInterval(pollTimer)
  clearTimeout(refreshTimer)
  pollTimer = null
  refreshTimer = null
}

// Call on logout so the next person to log in starts clean.
export function resetChatUnread() {
  stop()
  chatUnread.value = 0
  subscriberCount = 0
}

export function useChatUnread() {
  onMounted(() => {
    subscriberCount += 1
    if (subscriberCount === 1) start()
    else refreshChatUnread()
  })
  onUnmounted(() => {
    subscriberCount = Math.max(0, subscriberCount - 1)
    if (subscriberCount === 0) stop()
  })
  return { chatUnread, refreshChatUnread }
}