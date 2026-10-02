<template>
  <div
    class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 flex overflow-hidden h-[calc(100vh-13rem)] min-h-[460px]"
    :class="mode === 'client' ? 'rounded-2xl' : ''"
  >
    <!-- ============ CONVERSATION LIST ============ -->
    <aside
      :class="activeId ? 'hidden md:flex' : 'flex'"
      class="w-full md:w-80 md:flex-shrink-0 flex-col border-r border-gray-100 dark:border-gray-700"
    >
      <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <h2 class="font-semibold text-gray-800 dark:text-gray-100">{{ mode === 'client' ? 'My conversations' : 'Client messages' }}</h2>
        <span v-if="totalUnread" class="text-[10px] font-bold px-2 py-0.5 bg-emerald-600 text-white rounded-full">{{ totalUnread }} new</span>
      </div>

      <div v-if="setupMissing" class="m-4 border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 text-amber-800 dark:text-amber-200 text-xs p-3">
        Chat needs a one-time database setup. Run <span class="font-mono font-semibold">chat_support.sql</span> in the Supabase SQL Editor, then refresh.
      </div>
      <p v-else-if="error && !activeId" class="m-4 text-xs text-red-600 dark:text-red-400">{{ error }}</p>
      <p v-else-if="listLoading && !conversations.length" class="p-6 text-center text-sm text-gray-400 dark:text-gray-500">Loading...</p>
      <p v-else-if="!conversations.length" class="p-6 text-center text-sm text-gray-400 dark:text-gray-500">
        <template v-if="mode === 'client'">No conversations yet. Open a caterer's profile and tap <span class="font-semibold">Message</span> to ask them anything.</template>
        <template v-else>No messages yet. When a client messages your business, it will show up here instantly.</template>
      </p>

      <ul v-else class="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-700">
        <li v-for="c in conversations" :key="c.conversation_id">
          <button
            type="button"
            @click="openConversation(c.conversation_id)"
            :class="c.conversation_id === activeId ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'"
            class="w-full flex items-center gap-3 px-4 py-3 text-left transition"
          >
            <img v-if="mode === 'client' && c.logo_url" :src="c.logo_url" alt="" class="w-10 h-10 rounded-full object-cover flex-shrink-0 border border-gray-200 dark:border-gray-700" />
            <div v-else class="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0">
              {{ titleOf(c).charAt(0).toUpperCase() }}
            </div>
            <div class="min-w-0 flex-1">
              <div class="flex items-center justify-between gap-2">
                <p :class="c.unread ? 'font-bold' : 'font-semibold'" class="text-sm text-gray-800 dark:text-gray-100 truncate">{{ titleOf(c) }}</p>
                <span class="text-[10px] text-gray-400 dark:text-gray-500 flex-shrink-0">{{ c.last_message_preview ? formatChatTime(c.last_message_at) : '' }}</span>
              </div>
              <div class="flex items-center justify-between gap-2 mt-0.5">
                <p :class="c.unread ? 'text-gray-700 dark:text-gray-200 font-medium' : 'text-gray-500 dark:text-gray-400'" class="text-xs truncate">
                  {{ c.last_message_preview || 'No messages yet' }}
                </p>
                <span v-if="c.unread" class="min-w-[18px] h-[18px] px-1 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">{{ c.unread }}</span>
              </div>
            </div>
          </button>
        </li>
      </ul>
    </aside>

    <!-- ============ THREAD ============ -->
    <section :class="activeId ? 'flex' : 'hidden md:flex'" class="flex-1 min-w-0 flex-col">
      <div v-if="!active" class="m-auto text-center px-6">
        <svg class="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p class="text-sm text-gray-400 dark:text-gray-500">Select a conversation to start chatting.</p>
      </div>

      <template v-else>
        <!-- thread header -->
        <div class="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
          <button type="button" @click="closeThread" class="md:hidden p-1 -ml-1 text-gray-500 dark:text-gray-400" aria-label="Back to conversations">
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div class="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold flex-shrink-0">
            {{ titleOf(active).charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{{ titleOf(active) }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ mode === 'client' ? 'The catering team will reply here' : 'Client' }}</p>
          </div>
        </div>

        <!-- messages -->
        <div ref="scrollEl" class="flex-1 overflow-y-auto px-4 py-4 space-y-1 bg-gray-50/60 dark:bg-gray-900/30">
          <p v-if="threadLoading" class="text-center text-sm text-gray-400 dark:text-gray-500 py-6">Loading messages...</p>
          <p v-else-if="!messages.length" class="text-center text-sm text-gray-400 dark:text-gray-500 py-6">
            {{ mode === 'client' ? 'Say hello! Ask about dates, menus, or anything for your event.' : 'No messages yet.' }}
          </p>

          <template v-for="m in displayMessages" :key="m.message_id">
            <div v-if="m.showDay" class="text-center text-[11px] text-gray-400 dark:text-gray-500 py-2">{{ m.dayLabel }}</div>
            <div :class="m.mine ? 'items-end' : 'items-start'" class="flex flex-col">
              <span v-if="m.showName" class="text-[10px] text-gray-400 dark:text-gray-500 mt-2 mb-0.5 px-1">{{ m.sender_name }}<template v-if="m.sender_role === 'staff'"> · Staff</template></span>
              <div
                :class="m.mine ? 'bg-emerald-600 text-white rounded-2xl rounded-br-sm' : 'bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-bl-sm'"
                class="max-w-[85%] sm:max-w-[70%] px-3.5 py-2 text-sm whitespace-pre-wrap break-words"
              >{{ m.body }}</div>
              <span class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5 px-1">{{ timeOnly(m.created_at) }}</span>
            </div>
          </template>
        </div>

        <!-- composer -->
        <div class="border-t border-gray-100 dark:border-gray-700 p-3">
          <p v-if="error" class="text-xs text-red-600 dark:text-red-400 mb-2">{{ error }}</p>
          <div class="flex items-end gap-2">
            <textarea
              v-model="draft"
              rows="2"
              maxlength="2000"
              placeholder="Type a message... (Enter to send, Shift+Enter for a new line)"
              @keydown.enter.exact.prevent="send"
              class="flex-1 min-w-0 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              :class="mode === 'client' ? 'rounded-xl' : 'rounded-none'"
            ></textarea>
            <button
              type="button"
              @click="send"
              :disabled="sending || !draft.trim()"
              class="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50"
              :class="mode === 'client' ? 'rounded-xl' : 'rounded-none'"
            >
              {{ sending ? '...' : 'Send' }}
            </button>
          </div>
        </div>
      </template>
    </section>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import {
  listConversations, startConversation, getMessages, sendMessage,
  markConversationRead, subscribeToChat, formatChatTime
} from '../services/chatService'
import { setChatUnread } from '../composables/useChatUnread'

const props = defineProps({
  // 'client' = a customer chatting with caterers, 'staff' = the business inbox
  mode: { type: String, default: 'client' },
  // client mode: open/create the chat with this business as soon as we mount
  startBusinessId: { type: String, default: null }
})

const conversations = ref([])
const activeId = ref(null)
const messages = ref([])
const draft = ref('')
const listLoading = ref(false)
const threadLoading = ref(false)
const sending = ref(false)
const error = ref('')
const setupMissing = ref(false)
const scrollEl = ref(null)

const active = computed(() => conversations.value.find((c) => c.conversation_id === activeId.value) || null)
const totalUnread = computed(() => conversations.value.reduce((n, c) => n + c.unread, 0))
watch(totalUnread, (n) => setChatUnread(n))
const myRole = computed(() => (props.mode === 'client' ? 'client' : 'staff'))

function titleOf(c) {
  return (props.mode === 'client' ? c.business_name : c.client_name) || 'Conversation'
}

function timeOnly(iso) {
  return iso ? new Date(iso).toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit' }) : ''
}

function dayLabel(iso) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Adds the "mine / day divider / sender name" flags the template needs.
const displayMessages = computed(() => {
  let prev = null
  return messages.value.map((m) => {
    const showDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
    // Show the sender's name on staff messages when the sender changes (so the
    // client knows who replied, and staff can see which teammate answered).
    const showName = m.sender_role === 'staff' && (!prev || prev.sender_id !== m.sender_id || showDay)
    const row = { ...m, mine: m.sender_role === myRole.value, showDay, dayLabel: showDay ? dayLabel(m.created_at) : '', showName }
    prev = m
    return row
  })
})

function scrollToBottom() {
  nextTick(() => {
    if (scrollEl.value) scrollEl.value.scrollTop = scrollEl.value.scrollHeight
  })
}

function handleError(e, fallback) {
  if (e?.code === 'CHAT_NOT_SET_UP') {
    setupMissing.value = true
    return
  }
  error.value = e?.message || fallback
}

async function loadList() {
  listLoading.value = true
  try {
    conversations.value = await listConversations()
    setupMissing.value = false
  } catch (e) {
    handleError(e, 'Failed to load conversations.')
  } finally {
    listLoading.value = false
  }
}

function setLocalUnread(id, n) {
  const c = conversations.value.find((x) => x.conversation_id === id)
  if (c) c.unread = n
}

async function openConversation(id) {
  activeId.value = id
  messages.value = []
  error.value = ''
  threadLoading.value = true
  try {
    messages.value = await getMessages(id, 0)
    if (activeId.value !== id) return
    scrollToBottom()
    await markConversationRead(id)
    setLocalUnread(id, 0)
  } catch (e) {
    handleError(e, 'Failed to load messages.')
  } finally {
    threadLoading.value = false
  }
}

function closeThread() {
  activeId.value = null
  messages.value = []
}

// Pulls only messages we don't have yet (used by Realtime, polling, and after sending).
async function fetchNew() {
  const id = activeId.value
  if (!id || threadLoading.value) return
  try {
    const last = messages.value.length ? messages.value[messages.value.length - 1].message_id : 0
    const fresh = await getMessages(id, last)
    if (activeId.value !== id || !fresh.length) return
    const seen = new Set(messages.value.map((m) => m.message_id))
    const add = fresh.filter((m) => !seen.has(m.message_id))
    if (!add.length) return
    messages.value = [...messages.value, ...add]
    scrollToBottom()
    if (add.some((m) => m.sender_role !== myRole.value)) {
      await markConversationRead(id)
      setLocalUnread(id, 0)
    }
  } catch (e) {
    handleError(e, 'Failed to refresh messages.')
  }
}

async function send() {
  const text = draft.value.trim()
  if (!text || sending.value || !activeId.value) return
  sending.value = true
  error.value = ''
  try {
    await sendMessage(activeId.value, text)
    draft.value = ''
    await fetchNew()
    loadList()
  } catch (e) {
    handleError(e, 'Failed to send the message.')
  } finally {
    sending.value = false
  }
}

async function startFromBusiness(businessId) {
  if (!businessId) return
  try {
    const id = await startConversation(businessId)
    await loadList()
    if (id) await openConversation(id)
  } catch (e) {
    handleError(e, 'Could not start the conversation.')
  }
}

let unsubscribe = null
let pollTimer = null
let listTimer = null

function onRealtimeMessage(row) {
  if (row?.conversation_id === activeId.value) fetchNew()
  loadList()
}

function onConversationChange() {
  // Debounce: a single message touches both tables.
  clearTimeout(listTimer)
  listTimer = setTimeout(loadList, 300)
}

onMounted(async () => {
  await loadList()
  if (setupMissing.value) return
  if (props.startBusinessId) await startFromBusiness(props.startBusinessId)

  unsubscribe = subscribeToChat({ onMessage: onRealtimeMessage, onConversationChange })
  // Safety net in case Realtime isn't enabled/connected: refresh every 15s while the tab is visible.
  pollTimer = setInterval(() => {
    if (document.visibilityState !== 'visible') return
    loadList()
    fetchNew()
  }, 15000)
})

watch(() => props.startBusinessId, (id) => {
  if (id) startFromBusiness(id)
})

onBeforeUnmount(() => {
  if (unsubscribe) unsubscribe()
  clearInterval(pollTimer)
  clearTimeout(listTimer)
})
</script>