<template>
  <div class="min-h-screen flex bg-gray-50 font-sans">

    <!-- SIDEBAR -->
    <aside
      :class="isSidebarOpen ? 'w-64' : 'w-20'"
      class="bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-screen sticky top-0"
    >
      <div class="flex items-center justify-between p-4">
        <div class="flex items-center gap-2 overflow-hidden">
          <img src="/src/assets/logofinal.png" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <span v-if="isSidebarOpen" class="font-bold text-gray-800 whitespace-nowrap">Caterlytics</span>
        </div>
        <button @click="isSidebarOpen = !isSidebarOpen" class="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div class="px-3 mt-2">
        <button @click="openCreateModal" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-full border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 transition">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          <span v-if="isSidebarOpen" class="whitespace-nowrap">New Booking</span>
        </button>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">
        <p v-if="isSidebarOpen" class="text-xs font-semibold text-gray-400 px-3 mb-2 uppercase tracking-wide">Menu</p>

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Event Bookings' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'"
          class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          <span v-if="isSidebarOpen" class="whitespace-nowrap">{{ item.name }}</span>
        </a>
      </nav>

      <div class="border-t border-gray-200 p-3">
        <div class="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-gray-100 cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
            {{ userInitial }}
          </div>
          <div v-if="isSidebarOpen" class="overflow-hidden">
            <p class="text-sm font-semibold text-gray-800 truncate">{{ userName }}</p>
            <p class="text-xs text-gray-400 truncate">{{ userRole }}</p>
          </div>
        </div>
        <button v-if="isSidebarOpen" @click="handleLogout" class="w-full text-left text-xs text-red-500 hover:text-red-600 px-2 mt-2 font-medium">
          Log Out
        </button>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 p-8 overflow-x-hidden">
      <div class="max-w-7xl mx-auto">

        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Event Bookings</h1>
            <p class="text-sm text-gray-500 mt-1">Manage reservations and prevent scheduling conflicts.</p>
          </div>
          <button @click="openCreateModal" class="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Booking
          </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Total</h3>
            <p class="text-2xl font-black text-gray-900 mt-1">{{ bookings.length }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Pending</h3>
            <p class="text-2xl font-black text-amber-500 mt-1">{{ countByStatus('Pending') }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Confirmed</h3>
            <p class="text-2xl font-black text-emerald-600 mt-1">{{ countByStatus('Confirmed') }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Completed</h3>
            <p class="text-2xl font-black text-blue-600 mt-1">{{ countByStatus('Completed') }}</p>
          </div>
        </div>

        <!-- Filters -->
        <div class="bg-white p-4 rounded-2xl border border-gray-100 mb-4 flex flex-col sm:flex-row gap-3">
          <div class="relative flex-1">
            <svg class="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search by client name..."
              class="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <select v-model="statusFilter" class="px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>

        <!-- Error Banner -->
        <div v-if="pageError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ pageError }}
        </div>

        <!-- Bookings Table -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                <th class="text-left px-6 py-3 font-semibold">Client</th>
                <th class="text-left px-6 py-3 font-semibold">Event Date</th>
                <th class="text-left px-6 py-3 font-semibold">Time</th>
                <th class="text-left px-6 py-3 font-semibold">Location</th>
                <th class="text-left px-6 py-3 font-semibold">Guests</th>
                <th class="text-left px-6 py-3 font-semibold">Package</th>
                <th class="text-left px-6 py-3 font-semibold">Status</th>
                <th class="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="isLoading">
                <td colspan="8" class="text-center py-10 text-gray-400">Loading bookings...</td>
              </tr>
              <tr v-else-if="filteredBookings.length === 0">
                <td colspan="8" class="text-center py-10 text-gray-400">
                  {{ bookings.length === 0 ? 'No bookings yet. Click "New Booking" to create one.' : 'No bookings match your filters.' }}
                </td>
              </tr>
              <tr v-for="b in filteredBookings" :key="b.booking_id" class="hover:bg-gray-50/60">
                <td class="px-6 py-3.5 font-medium text-gray-800">{{ b.client_name }}</td>
                <td class="px-6 py-3.5 text-gray-600">{{ formatDate(b.event_date) }}</td>
                <td class="px-6 py-3.5 text-gray-600">{{ formatTime(b.event_time) }}</td>
                <td class="px-6 py-3.5 text-gray-600">{{ b.event_location }}</td>
                <td class="px-6 py-3.5 text-gray-600">{{ b.guest_count }}</td>
                <td class="px-6 py-3.5 text-gray-600">{{ b.package_name || '—' }}</td>
                <td class="px-6 py-3.5">
                  <span :class="statusBadgeClass(b.booking_status)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                    {{ b.booking_status }}
                  </span>
                </td>
                <td class="px-6 py-3.5">
                  <div class="flex items-center justify-end gap-2">
                    <select
                      :value="b.booking_status"
                      @change="handleStatusChange(b, $event.target.value)"
                      class="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Confirmed">Confirmed</option>
                      <option value="Completed">Completed</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                    <button @click="confirmDelete(b)" class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete booking">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

      </div>
    </main>

    <!-- ============ NEW BOOKING MODAL ============ -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-900 mb-4">New Booking</h3>

        <div v-if="modalError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ modalError }}
        </div>

        <div v-if="conflictWarning" class="bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium p-3 rounded-xl mb-4 flex gap-2">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86l-8.18 14.14A2 2 0 003.82 21h16.36a2 2 0 001.71-3l-8.18-14.14a2 2 0 00-3.42 0z" />
          </svg>
          <span>{{ conflictWarning }}</span>
        </div>

        <form @submit.prevent="handleCreateBooking" class="space-y-4">
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Client Name</label>
            <input type="text" v-model="form.client_name" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Event Date</label>
              <input
                type="date"
                v-model="form.event_date"
                @change="handleDateCheck"
                :min="todayStr"
                class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Event Time</label>
              <input type="time" v-model="form.event_time" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>
          </div>

          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Event Location</label>
            <input type="text" v-model="form.event_location" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Guest Count</label>
              <input type="number" min="1" v-model.number="form.guest_count" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Package</label>
              <input type="text" v-model="form.package_name" placeholder="e.g. Silver Package" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>
          <p class="text-xs text-gray-400 -mt-2">Manual entry for now — links to Package & Menu Management once that module is ready.</p>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeCreateModal" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="isCreating" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isCreating ? 'Saving...' : 'Create Booking' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ DELETE CONFIRM MODAL ============ -->
    <div v-if="bookingToDelete" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Delete Booking?</h3>
        <p class="text-sm text-gray-500 mb-5">
          This will permanently remove the booking for <span class="font-semibold text-gray-700">{{ bookingToDelete.client_name }}</span> on {{ formatDate(bookingToDelete.event_date) }}.
        </p>
        <div class="flex gap-3">
          <button @click="bookingToDelete = null" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button @click="handleDelete" :disabled="isDeleting" class="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  getAllBookings,
  createBooking,
  updateBookingStatus,
  deleteBooking,
  checkDateConflict
} from '../services/bookingService'

const router = useRouter()

const isSidebarOpen = ref(true)
const userName = ref('User')
const userRole = ref('Staff')
const userInitial = ref('U')

const bookings = ref([])
const isLoading = ref(false)
const pageError = ref('')

const searchQuery = ref('')
const statusFilter = ref('')

const showCreateModal = ref(false)
const isCreating = ref(false)
const modalError = ref('')
const conflictWarning = ref('')

const bookingToDelete = ref(null)
const isDeleting = ref(false)

const emptyForm = () => ({
  client_name: '',
  event_date: '',
  event_time: '',
  event_location: '',
  guest_count: null,
  package_name: ''
})
const form = ref(emptyForm())

const todayStr = new Date().toISOString().split('T')[0]

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  if (!['Admin', 'Staff', 'Owner/Manager'].includes(user.role)) {
    router.push('/')
    return
  }
  userName.value = user.full_name
  userRole.value = user.role
  userInitial.value = user.full_name.charAt(0).toUpperCase()

  fetchBookings()
})

async function fetchBookings() {
  isLoading.value = true
  pageError.value = ''
  try {
    bookings.value = await getAllBookings()
  } catch (error) {
    pageError.value = 'Failed to load bookings. Please refresh the page.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const filteredBookings = computed(() => {
  return bookings.value.filter((b) => {
    const matchesSearch = b.client_name?.toLowerCase().includes(searchQuery.value.toLowerCase())
    const matchesStatus = !statusFilter.value || b.booking_status === statusFilter.value
    return matchesSearch && matchesStatus
  })
})

function countByStatus(status) {
  return bookings.value.filter((b) => b.booking_status === status).length
}

function statusBadgeClass(status) {
  switch (status) {
    case 'Confirmed': return 'bg-emerald-50 text-emerald-700'
    case 'Pending': return 'bg-amber-50 text-amber-700'
    case 'Completed': return 'bg-blue-50 text-blue-700'
    case 'Cancelled': return 'bg-red-50 text-red-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-PH', {
    year: 'numeric', month: 'short', day: 'numeric'
  })
}

function formatTime(timeStr) {
  if (!timeStr) return '—'
  const [h, m] = timeStr.split(':')
  const hour = parseInt(h, 10)
  const suffix = hour >= 12 ? 'PM' : 'AM'
  const hour12 = hour % 12 === 0 ? 12 : hour % 12
  return `${hour12}:${m} ${suffix}`
}

function openCreateModal() {
  form.value = emptyForm()
  modalError.value = ''
  conflictWarning.value = ''
  showCreateModal.value = true
}

function closeCreateModal() {
  showCreateModal.value = false
}

async function handleDateCheck() {
  conflictWarning.value = ''
  if (!form.value.event_date) return
  try {
    const result = await checkDateConflict(form.value.event_date)
    if (result.conflict) {
      const existing = result.existingBookings[0]
      conflictWarning.value = `Heads up: may existing booking na sa date na ito (${existing.client_name} at ${formatTime(existing.event_time)}). Puwede ka pa ring mag-submit, pero i-double check muna.`
    }
  } catch (error) {
    console.error('Conflict check failed:', error)
  }
}

async function handleCreateBooking() {
  modalError.value = ''
  isCreating.value = true
  try {
    await createBooking(form.value)
    showCreateModal.value = false
    fetchBookings()
  } catch (error) {
    modalError.value = error?.response?.data?.error || 'Something went wrong. Please try again.'
  } finally {
    isCreating.value = false
  }
}

async function handleStatusChange(booking, newStatus) {
  const previousStatus = booking.booking_status
  booking.booking_status = newStatus // optimistic update
  try {
    await updateBookingStatus(booking.booking_id, newStatus)
  } catch (error) {
    booking.booking_status = previousStatus
    pageError.value = 'Failed to update booking status.'
    console.error(error)
  }
}

function confirmDelete(booking) {
  bookingToDelete.value = booking
}

async function handleDelete() {
  if (!bookingToDelete.value) return
  isDeleting.value = true
  try {
    await deleteBooking(bookingToDelete.value.booking_id)
    bookings.value = bookings.value.filter((b) => b.booking_id !== bookingToDelete.value.booking_id)
    bookingToDelete.value = null
  } catch (error) {
    pageError.value = 'Failed to delete booking.'
    console.error(error)
  } finally {
    isDeleting.value = false
  }
}

function goTo(item) {
  router.push(item.path)
}

const handleLogout = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}

const allNavItems = [
  { name: 'Dashboard', path: '/admin/dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', path: '/admin/bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Catering Packages', path: '/admin/packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Payments', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Staff Management', path: '/admin/dashboard', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
]


const staffAllowedSections = ['Dashboard', 'Payments']

const navItems = computed(() =>
  userRole.value === 'Staff'
    ? allNavItems.filter(item => staffAllowedSections.includes(item.name))
    : allNavItems
)
</script>

<style scoped>
</style>