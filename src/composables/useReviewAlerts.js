import { ref, onMounted, onUnmounted } from 'vue'
import { getUnrepliedReviewCount } from '../services/reviewService'

// App-wide "reviews waiting for a reply" counter. Drives the red badge on the
// "Feedback & Ratings" sidebar item (Admin / Owner only).
//
// Module-level state so every page shares ONE count and ONE poll timer.
//
// Usage in any View:
//   import { useReviewAlerts } from '../composables/useReviewAlerts'
//   const { reviewPending } = useReviewAlerts()

const reviewPending = ref(0)
let subscriberCount = 0
let pollTimer = null
let loggedError = false

function canSeeReviews() {
  try {
    const u = JSON.parse(sessionStorage.getItem('user'))
    return ['Admin', 'Owner/Manager'].includes(u?.role)
  } catch {
    return false
  }
}

async function refreshReviewPending() {
  if (!canSeeReviews()) {
    reviewPending.value = 0
    return
  }
  try {
    reviewPending.value = await getUnrepliedReviewCount()
  } catch (e) {
    // Keep the last known count; log once so the console isn't spammed.
    if (!loggedError) {
      console.error('[review alerts] failed to load unreplied review count:', e)
      loggedError = true
    }
  }
}

// FeedbackRatings calls this right after loading / replying so the badge
// updates instantly instead of waiting for the next poll.
export function setReviewPending(n) {
  reviewPending.value = Math.max(0, Number(n) || 0)
}

function onVisible() {
  if (document.visibilityState === 'visible') refreshReviewPending()
}

function start() {
  refreshReviewPending()
  pollTimer = setInterval(() => {
    if (document.visibilityState === 'visible') refreshReviewPending()
  }, 30000)
  document.addEventListener('visibilitychange', onVisible)
}

function stop() {
  clearInterval(pollTimer)
  pollTimer = null
  document.removeEventListener('visibilitychange', onVisible)
}

// Call on logout so the next person to log in starts clean.
export function resetReviewAlerts() {
  stop()
  reviewPending.value = 0
  subscriberCount = 0
  loggedError = false
}

export function useReviewAlerts() {
  onMounted(() => {
    subscriberCount += 1
    if (subscriberCount === 1) start()
    else refreshReviewPending()
  })
  onUnmounted(() => {
    subscriberCount = Math.max(0, subscriberCount - 1)
    if (subscriberCount === 0) stop()
  })
  return { reviewPending, refreshReviewPending }
}