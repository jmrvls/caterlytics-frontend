<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">
    <!-- Top bar -->
    <header class="sticky top-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <div class="max-w-2xl mx-auto flex items-center gap-3 px-4 py-3">
        <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="font-bold text-gray-800 dark:text-gray-100 leading-tight">My deliveries</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ userName }} · Driver</p>
        </div>
        <button @click="reload(true)" :disabled="isLoading" class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">Refresh</button>
        <button @click="handleLogout" class="px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-50 dark:hover:bg-red-900/30">Log out</button>
      </div>
    </header>

    <main class="max-w-2xl mx-auto p-4 space-y-4">
      <div v-if="newAssigned" class="border border-emerald-300 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 text-sm p-3 flex items-center justify-between gap-3">
        <span>You have a new delivery assigned.</span>
        <button @click="newAssigned = false" class="text-xs font-semibold underline">Dismiss</button>
      </div>
      <div v-if="pageError" class="text-red-600 dark:text-red-400 text-sm font-medium">{{ pageError }}</div>
      <div v-if="successMessage" class="text-emerald-700 dark:text-emerald-300 text-sm font-medium">{{ successMessage }}</div>

      <!-- Location sharing status -->
      <div v-if="activeVehicleId" class="border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs p-3">
        <template v-if="geoState === 'sharing'">Sharing this phone's location with the office while your delivery is active. Keep this page open.</template>
        <template v-else-if="geoState === 'denied'">Location permission is off, so the office can't see where you are. Allow location for this site in your browser settings.</template>
        <template v-else>Starting location sharing...</template>
      </div>

      <div v-if="isLoading" class="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">Loading your deliveries...</div>

      <div v-else-if="!deliveries.length" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center py-12 px-4 text-gray-400 dark:text-gray-500 text-sm">
        No deliveries assigned to you right now. The office will assign one here.
      </div>

      <template v-else>
        <section v-for="g in groups" :key="g.date">
          <h2 class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
            {{ g.date === today ? 'Today' : formatDateOnly(g.date) }}<span v-if="g.date < today && g.open" class="ml-2 text-amber-600 dark:text-amber-400 normal-case">overdue</span>
          </h2>
          <div class="space-y-3">
            <article v-for="d in g.items" :key="d.delivery_id" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">
                    <span v-if="d.stop_order" class="inline-flex w-5 h-5 mr-1 items-center justify-center text-[11px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{{ d.stop_order }}</span>{{ d.client_name }}
                  </p>
                  <p class="text-sm text-gray-600 dark:text-gray-300 mt-0.5">Event {{ formatClock(d.event_time) }} · {{ d.guest_count }} guests</p>
                </div>
                <span :class="deliveryStatusClass(d.status)" class="text-xs font-semibold whitespace-nowrap">{{ d.status }}</span>
              </div>

              <p class="text-sm text-gray-700 dark:text-gray-200 mt-2 break-words">{{ d.dest_address || d.event_location || 'No address' }}</p>
              <p v-if="d.plate_number" class="text-xs text-gray-500 dark:text-gray-400 mt-1">Vehicle: {{ d.vehicle_name }} ({{ d.plate_number }})</p>
              <p v-else-if="!isFinal(d)" class="text-xs text-amber-600 dark:text-amber-400 mt-1">No vehicle assigned yet.</p>
              <p v-if="d.notes" :class="d.status === 'Failed' ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'" class="text-xs mt-2 break-words">
                <span class="font-semibold">{{ d.status === 'Failed' ? 'Reason:' : 'Note:' }}</span> {{ d.notes }}
              </p>

              <div v-if="!isFinal(d)" class="mt-3 flex flex-wrap gap-2">
                <a :href="mapsUrl(d)" target="_blank" rel="noopener" class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Open in Maps</a>
                <button v-if="d.status === 'Scheduled'" @click="setStatus(d, 'Loading')" :disabled="busyId === d.delivery_id" class="px-3 py-2 bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 disabled:opacity-50">Start loading</button>
                <button v-if="d.status === 'Scheduled' || d.status === 'Loading'" @click="setStatus(d, 'En Route')" :disabled="busyId === d.delivery_id" class="px-3 py-2 bg-blue-600 text-white text-xs font-semibold hover:bg-blue-700 disabled:opacity-50">I'm on my way</button>
                <button v-if="d.status === 'En Route'" @click="setStatus(d, 'Delivered')" :disabled="busyId === d.delivery_id" class="px-3 py-2 bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50">Mark delivered</button>
                <button @click="openFail(d)" :disabled="busyId === d.delivery_id" class="px-3 py-2 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 text-xs font-semibold hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50">Can't deliver</button>
              </div>
              <p v-else-if="d.delivered_at" class="mt-2 text-xs text-gray-400 dark:text-gray-500">Delivered {{ new Date(d.delivered_at).toLocaleString() }}</p>
            </article>
          </div>
        </section>
      </template>
    </main>

    <!-- Failed: reason is required -->
    <div v-if="failTarget" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="failTarget = null"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-sm p-5 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">Can't deliver?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">{{ failTarget.client_name }} - tell the office what happened so they can reschedule.</p>
        <div v-if="modalError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-2">{{ modalError }}</div>
        <textarea v-model="failReason" rows="3" maxlength="500" placeholder="e.g. Nobody at the venue, wrong address, vehicle broke down" class="w-full mb-4 px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500"></textarea>
        <div class="flex justify-end gap-2">
          <button @click="failTarget = null" class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
          <button @click="confirmFail" :disabled="busyId === failTarget.delivery_id" class="px-4 py-2.5 bg-red-600 text-white text-sm font-semibold hover:bg-red-700 disabled:opacity-50">Mark failed</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import logoUrl from '../Assets/logofinal.png'
import { logoutUser } from '../services/authService'
import { resetNotifications } from '../composables/useNotifications'
import { getMyDeliveries, driverSetDeliveryStatus, driverReportLocation } from '../services/fleetservice'
import { formatClock, deliveryStatusClass } from '../utils/fleet'
import { localToday, formatDateOnly } from '../utils/date'

const router = useRouter()
const userName = ref('Driver')
const deliveries = ref([])
const isLoading = ref(true)
const pageError = ref('')
const successMessage = ref('')
const newAssigned = ref(false)
const busyId = ref(null)
const today = ref(localToday())

const isFinal = (d) => d.status === 'Delivered' || d.status === 'Failed'

// ---------- loading (+ light polling so new assignments show up) ----------
let knownIds = null
let pollTimer = null

async function reload(manual = false) {
  if (manual) isLoading.value = true
  pageError.value = ''
  try {
    const rows = await getMyDeliveries()
    const open = rows.filter((r) => !isFinal(r))
    const ids = new Set(open.map((r) => r.delivery_id))
    if (knownIds && open.some((r) => !knownIds.has(r.delivery_id))) newAssigned.value = true
    knownIds = ids
    deliveries.value = rows
    today.value = localToday()
  } catch (error) {
    pageError.value = error?.message || 'Failed to load your deliveries.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const stored = sessionStorage.getItem('user')
  if (!stored) { router.push('/'); return }
  const user = JSON.parse(stored)
  userName.value = user.full_name || user.username || 'Driver'
  reload()
  pollTimer = setInterval(() => { if (!document.hidden) reload() }, 60000)
})

onBeforeUnmount(() => {
  clearInterval(pollTimer)
  stopSharing()
})

// ---------- list grouped by run date ----------
const groups = computed(() => {
  const map = new Map()
  for (const d of deliveries.value) {
    if (!map.has(d.run_date)) map.set(d.run_date, [])
    map.get(d.run_date).push(d)
  }
  return [...map.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([date, items]) => ({ date, items, open: items.some((i) => !isFinal(i)) }))
})

function mapsUrl(d) {
  const hasPoint = d.dest_lat !== null && d.dest_lat !== undefined && d.dest_lng !== null && d.dest_lng !== undefined
  const dest = hasPoint ? `${d.dest_lat},${d.dest_lng}` : (d.dest_address || d.event_location || '')
  return `https://www.google.com/maps/dir/?api=1&travelmode=driving&destination=${encodeURIComponent(dest)}`
}

// ---------- status updates ----------
let msgTimer = null
function flash(msg) {
  successMessage.value = msg
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => { successMessage.value = '' }, 4000)
}

async function setStatus(d, status, notes = null) {
  busyId.value = d.delivery_id
  pageError.value = ''
  try {
    await driverSetDeliveryStatus(d.delivery_id, status, notes)
    flash(status === 'Delivered' ? 'Marked as delivered. Nice work!' : `Status: ${status}.`)
    await reload()
    return true
  } catch (error) {
    pageError.value = error?.message || 'Failed to update the delivery.'
    return false
  } finally {
    busyId.value = null
  }
}

const failTarget = ref(null)
const failReason = ref('')
const modalError = ref('')

function openFail(d) {
  failTarget.value = d
  failReason.value = ''
  modalError.value = ''
}

async function confirmFail() {
  const reason = failReason.value.trim()
  if (!reason) { modalError.value = 'Please write why the delivery failed.'; return }
  const ok = await setStatus(failTarget.value, 'Failed', reason)
  if (ok) failTarget.value = null
  else modalError.value = pageError.value
}

// ---------- real location from THIS phone while a delivery is active ----------
// Only while a delivery is Loading / En Route. The database accepts the ping only
// from the driver assigned to that vehicle.
const geoState = ref('idle') // idle | sharing | denied
const activeVehicleId = computed(() => {
  const d = deliveries.value.find((x) => (x.status === 'Loading' || x.status === 'En Route') && x.vehicle_id)
  return d ? d.vehicle_id : null
})

let watchId = null
let lastSent = 0
const SEND_EVERY_MS = 30000

function stopSharing() {
  if (watchId !== null && navigator.geolocation) navigator.geolocation.clearWatch(watchId)
  watchId = null
  geoState.value = 'idle'
}

function startSharing(vehicleId) {
  stopSharing()
  if (!navigator.geolocation) { geoState.value = 'denied'; return }
  geoState.value = 'idle'
  watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      geoState.value = 'sharing'
      const now = Date.now()
      if (now - lastSent < SEND_EVERY_MS) return
      lastSent = now
      try {
        await driverReportLocation(vehicleId, pos.coords.latitude, pos.coords.longitude)
      } catch (e) {
        console.warn('Location not sent:', e?.message || e)
      }
    },
    (err) => { if (err.code === 1) geoState.value = 'denied' },
    { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 }
  )
}

watch(activeVehicleId, (vid) => {
  if (vid) { lastSent = 0; startSharing(vid) } else stopSharing()
}, { immediate: true })

const handleLogout = async () => {
  stopSharing()
  try {
    await logoutUser()
  } catch (error) {
    console.error('Sign out failed:', error)
  }
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  resetNotifications()
  router.push('/')
}
</script>