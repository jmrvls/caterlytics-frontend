<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">

    <!-- TOP BAR -->
    <header class="bg-gray-900 dark:bg-black border-b border-gray-800 sticky top-0 z-30">
      <div class="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-bold text-white leading-tight truncate">Caterlytics</p>
            <p class="text-[11px] text-indigo-300 leading-tight tracking-wide uppercase">Super Admin &middot; Platform Console</p>
          </div>
        </div>

        <div class="flex items-center gap-3 flex-shrink-0">
          <span class="hidden sm:inline text-sm text-gray-400">{{ userName }}</span>
          <button
            @click="handleLogout"
            class="flex items-center gap-2 px-3 py-2 rounded-none text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>
      </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 sm:px-8 py-8">

      <!-- STATS -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none p-5">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Businesses</p>
          <p class="text-3xl font-black text-gray-900 dark:text-gray-100 mt-1">{{ isLoading ? '…' : stats.total_businesses }}</p>
        </div>
        <button
          @click="statusFilter = 'Pending'"
          class="text-left bg-white dark:bg-gray-800 border rounded-none p-5 transition"
          :class="stats.pending_businesses > 0 ? 'border-amber-300 dark:border-amber-700 ring-1 ring-amber-200 dark:ring-amber-800' : 'border-gray-200 dark:border-gray-700'"
        >
          <p class="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wide">Pending Approval</p>
          <p class="text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{{ isLoading ? '…' : stats.pending_businesses }}</p>
        </button>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none p-5">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Tenants</p>
          <p class="text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{{ isLoading ? '…' : stats.active_businesses }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none p-5">
          <p class="text-xs font-semibold text-gray-400 uppercase tracking-wide">Suspended</p>
          <p class="text-3xl font-black text-red-500 mt-1">{{ isLoading ? '…' : stats.suspended_businesses }}</p>
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4 mb-8">
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none p-4 text-center">
          <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ isLoading ? '…' : stats.total_owners }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Owners</p>
        </div>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none p-4 text-center">
          <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ isLoading ? '…' : stats.total_staff }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Staff / Business Admins</p>
        </div>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none p-4 text-center">
          <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ isLoading ? '…' : stats.total_clients }}</p>
          <p class="text-xs text-gray-400 mt-0.5">Clients</p>
        </div>
      </div>

      <!-- BUSINESSES -->
      <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none overflow-hidden">
        <div class="flex flex-wrap items-center justify-between gap-3 p-4 border-b border-gray-100 dark:border-gray-700">
          <h2 class="font-bold text-gray-900 dark:text-gray-100">Registered Businesses (Tenants)</h2>
          <div class="flex items-center gap-2">
            <button
              v-for="f in ['All', 'Pending', 'Active', 'Suspended', 'Rejected']" :key="f"
              @click="statusFilter = f"
              :class="statusFilter === f ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'"
              class="text-xs font-semibold px-3 py-1.5 rounded-none transition"
            >
              {{ f }}
            </button>
          </div>
        </div>

        <div v-if="errorMessage" class="p-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20">{{ errorMessage }}</div>

        <div v-if="isLoading" class="p-8 text-center text-gray-400 text-sm">Loading businesses…</div>

        <div v-else-if="filteredBusinesses.length === 0" class="p-8 text-center text-gray-400 text-sm">
          No businesses match this filter.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/40 text-left text-xs uppercase tracking-wide text-gray-400">
              <tr>
                <th class="px-4 py-3 font-semibold">Business</th>
                <th class="px-4 py-3 font-semibold">Owner</th>
                <th class="px-4 py-3 font-semibold">Contact</th>
                <th class="px-4 py-3 font-semibold text-center">Staff</th>
                <th class="px-4 py-3 font-semibold text-center">Packages</th>
                <th class="px-4 py-3 font-semibold text-center">Bookings</th>
                <th class="px-4 py-3 font-semibold">Registered</th>
                <th class="px-4 py-3 font-semibold">Status</th>
                <th class="px-4 py-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-for="b in filteredBusinesses" :key="b.business_id" class="hover:bg-gray-50 dark:hover:bg-gray-700/40">
                <td class="px-4 py-3 font-semibold text-gray-800 dark:text-gray-100">{{ b.business_name }}</td>
                <td class="px-4 py-3 text-gray-600 dark:text-gray-300">
                  {{ b.owner_full_name || '—' }}
                  <span v-if="b.owner_username" class="block text-xs text-gray-400">@{{ b.owner_username }}</span>
                </td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                  <span class="block">{{ b.contact_email || b.owner_contact_number || '—' }}</span>
                  <span v-if="b.address" class="block truncate max-w-[180px]">{{ b.address }}</span>
                </td>
                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{{ b.staff_count }}</td>
                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{{ b.packages_count }}</td>
                <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{{ b.bookings_count }}</td>
                <td class="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{{ formatDate(b.created_at) }}</td>
                <td class="px-4 py-3">
                  <span class="inline-block px-2 py-1 rounded-none text-xs font-bold" :class="statusBadgeClass(b.status)">{{ b.status }}</span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-2 flex-wrap">
                    <button
                      v-if="b.status === 'Pending'"
                      @click="changeStatus(b, 'Active')"
                      :disabled="pendingActionId === b.business_id"
                      class="text-xs font-bold px-3 py-1.5 rounded-none bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                    >Approve</button>
                    <button
                      v-if="b.status === 'Pending'"
                      @click="changeStatus(b, 'Rejected')"
                      :disabled="pendingActionId === b.business_id"
                      class="text-xs font-bold px-3 py-1.5 rounded-none bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
                    >Reject</button>
                    <button
                      v-if="b.status === 'Active'"
                      @click="changeStatus(b, 'Suspended')"
                      :disabled="pendingActionId === b.business_id"
                      class="text-xs font-bold px-3 py-1.5 rounded-none bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/50 disabled:opacity-50"
                    >Suspend</button>
                    <button
                      v-if="b.status === 'Suspended' || b.status === 'Rejected'"
                      @click="changeStatus(b, 'Active')"
                      :disabled="pendingActionId === b.business_id"
                      class="text-xs font-bold px-3 py-1.5 rounded-none bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 disabled:opacity-50"
                    >Reactivate</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p class="text-xs text-gray-400 mt-4">
        A newly self-registered business starts as <span class="font-semibold">Pending</span> and its owner cannot log in
        until you approve it here. Suspending an active business blocks that owner, their staff, and their business admin
        from logging in until it's reactivated.
      </p>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import logoUrl from '../Assets/logofinal.png'
import { getPlatformStats, getPlatformBusinesses, setBusinessStatus } from '../services/superAdminService'

const router = useRouter()

const userName = ref('')
const isLoading = ref(true)
const errorMessage = ref('')
const statusFilter = ref('All')
const pendingActionId = ref(null)

const stats = ref({
  total_businesses: 0, pending_businesses: 0, active_businesses: 0,
  suspended_businesses: 0, total_owners: 0, total_staff: 0, total_clients: 0,
})
const businesses = ref([])

const filteredBusinesses = computed(() =>
  statusFilter.value === 'All'
    ? businesses.value
    : businesses.value.filter(b => b.status === statusFilter.value)
)

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function statusBadgeClass(status) {
  switch (status) {
    case 'Active': return 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
    case 'Pending': return 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
    case 'Suspended': return 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-300'
    case 'Rejected': return 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
    default: return 'bg-gray-100 text-gray-600'
  }
}

async function loadData() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const [s, b] = await Promise.all([getPlatformStats(), getPlatformBusinesses()])
    stats.value = s
    businesses.value = b
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to load platform data.'
  } finally {
    isLoading.value = false
  }
}

async function changeStatus(business, newStatus) {
  const confirmMsgs = {
    Active: `Approve "${business.business_name}"? Its owner and staff will be able to log in.`,
    Suspended: `Suspend "${business.business_name}"? Its owner, staff, and business admin will be locked out immediately.`,
    Rejected: `Reject "${business.business_name}"'s registration?`,
  }
  if (confirmMsgs[newStatus] && !window.confirm(confirmMsgs[newStatus])) return

  pendingActionId.value = business.business_id
  errorMessage.value = ''
  try {
    await setBusinessStatus(business.business_id, newStatus)
    business.status = newStatus
    await loadData()
  } catch (error) {
    errorMessage.value = error?.message || 'Failed to update status.'
  } finally {
    pendingActionId.value = null
  }
}

const handleLogout = () => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  router.push('/')
}

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  if (user.role !== 'Super Admin') {
    router.push('/')
    return
  }
  userName.value = user.full_name
  loadData()
})
</script>

<style scoped>
</style>