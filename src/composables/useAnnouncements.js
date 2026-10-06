import { ref, computed, onMounted, onUnmounted } from 'vue'
import { getActiveAnnouncements } from '../services/announcementService'

// Shared, app-wide feed of Super Admin announcements for tenant users
// (Admin / Owner-Manager / Staff). Used by both the bell and the banner so
// they always agree on what is unread.
//
// "Seen" state is stored in localStorage per user, so a refresh or re-login
// doesn't bring back announcements that were already read.
//
// Usage:
//   const { announcements, unseen, unseenCount, markAllSeen, markSeen } = useAnnouncements()

const announcements = ref([])
const seenIds = ref(new Set())
let timer = null
let subscriberCount = 0
let currentUserKey = 'anon'

function readUser() {
  try {
    return JSON.parse(sessionStorage.getItem('user') || '{}') || {}
  } catch {
    return {}
  }
}

const storageKey = () => `caterlytics:seenAnnouncements:${currentUserKey}`

function loadSeen() {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey()) || '[]')
    seenIds.value = new Set(Array.isArray(raw) ? raw : [])
  } catch {
    seenIds.value = new Set()
  }
}

function saveSeen() {
  try {
    // keep the list from growing forever
    localStorage.setItem(storageKey(), JSON.stringify([...seenIds.value].slice(-200)))
  } catch { /* storage unavailable -- ignore */ }
}

export async function refreshAnnouncements() {
  try {
    announcements.value = await getActiveAnnouncements()
  } catch (err) {
    console.error('Failed to load announcements:', err)
  }
}

function markSeen(id) {
  const next = new Set(seenIds.value)
  next.add(id)
  seenIds.value = next
  saveSeen()
}

function markAllSeen() {
  const next = new Set(seenIds.value)
  announcements.value.forEach((a) => next.add(a.announcement_id))
  seenIds.value = next
  saveSeen()
}

// Call on logout so the next person on this tab starts clean.
export function resetAnnouncements() {
  announcements.value = []
  seenIds.value = new Set()
}

export function useAnnouncements() {
  const unseen = computed(() => announcements.value.filter((a) => !seenIds.value.has(a.announcement_id)))
  const unseenCount = computed(() => unseen.value.length)

  onMounted(() => {
    subscriberCount++
    const u = readUser()
    const key = `${u.user_id || u.id || u.email || 'anon'}`
    if (key !== currentUserKey) {
      announcements.value = []
      currentUserKey = key
    }
    loadSeen()

    // Super Admin writes announcements; they don't receive them.
    if (u.role === 'Super Admin' || u.role === 'Client') return

    refreshAnnouncements()
    if (!timer) timer = setInterval(refreshAnnouncements, 60000)
  })

  onUnmounted(() => {
    subscriberCount = Math.max(0, subscriberCount - 1)
    if (subscriberCount === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  })

  return { announcements, unseen, unseenCount, markSeen, markAllSeen, refresh: refreshAnnouncements }
}