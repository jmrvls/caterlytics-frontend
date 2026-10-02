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
let firstLoadDone = false
const baseTitle = typeof document !== 'undefined' ? document.title : ''

// Short "ding" when a NEW message arrives. Browsers may block audio until the
// user has clicked something on the page -- that's fine, we just ignore it.
function playDing() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.4)
    osc.onended = () => ctx.close()
  } catch {
    /* audio not allowed yet */
  }
}

function updateTitle() {
  if (typeof document === 'undefined') return
  document.title = chatUnread.value > 0 ? `(${chatUnread.value}) ${baseTitle}` : baseTitle
}

async function refreshChatUnread() {
  try {
    const rows = await listConversations()
    const next = rows.reduce((n, c) => n + (Number(c.unread) || 0), 0)
    // Ding only when the count goes UP after the first load.
    if (firstLoadDone && next > chatUnread.value) playDing()
    chatUnread.value = next
    firstLoadDone = true
    updateTitle()
  } catch (e) {
    // Don't hide the reason anymore -- check the browser console (F12).
    console.error('[chat unread] failed to load conversations:', e)
    chatUnread.value = 0
    updateTitle()
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
  updateTitle()
}

function onVisible() {
  if (document.visibilityState === 'visible') refreshChatUnread()
}

function start() {
  firstLoadDone = false
  refreshChatUnread()
  unsubscribe = subscribeToChat({
    onMessage: scheduleRefresh,
    onConversationChange: scheduleRefresh
  })
  // Safety net if Realtime isn't enabled: re-check every 10s while visible.
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') refreshChatUnread()
  }, 10000)
  document.addEventListener('visibilitychange', onVisible)
}

function stop() {
  if (unsubscribe) unsubscribe()
  unsubscribe = null
  clearInterval(pollTimer)
  clearTimeout(refreshTimer)
  pollTimer = null
  refreshTimer = null
  document.removeEventListener('visibilitychange', onVisible)
}

// Call on logout so the next person to log in starts clean.
export function resetChatUnread() {
  stop()
  chatUnread.value = 0
  subscriberCount = 0
  firstLoadDone = false
  updateTitle()
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