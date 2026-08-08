<template>
  <div class="min-h-screen flex bg-gray-50 font-sans">

    <!-- SIDEBAR -->
    <aside
      :class="isSidebarOpen ? 'w-64' : 'w-20'"
      class="bg-white border-r border-gray-200 flex flex-col transition-all duration-300 h-screen sticky top-0 print:hidden"
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
        <button @click="printReport" class="w-full flex items-center gap-3 px-3 py-2.5 rounded-full border border-gray-300 hover:bg-gray-50 text-sm font-medium text-gray-700 transition">
          <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a1 1 0 001-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 001 1zm8-12V5a1 1 0 00-1-1H8a1 1 0 00-1 1v4h10z" />
          </svg>
          <span v-if="isSidebarOpen" class="whitespace-nowrap">Print Report</span>
        </button>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">
        <p v-if="isSidebarOpen" class="text-xs font-semibold text-gray-400 px-3 mb-2 uppercase tracking-wide">Menu</p>

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Reports' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'"
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
    <main class="flex-1 p-8 overflow-x-hidden print:p-0">
      <div class="max-w-7xl mx-auto">

        <div class="flex items-center justify-between mb-6 print:mb-4">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
            <p class="text-sm text-gray-500 mt-1 print:hidden">Sales, booking, and inventory overview.</p>
            <p class="hidden print:block text-xs text-gray-500 mt-1">Generated {{ generatedOn }}</p>
          </div>
          <button @click="printReport" class="print:hidden flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a1 1 0 001-1v-4a1 1 0 00-1-1H9a1 1 0 00-1 1v4a1 1 0 001 1zm8-12V5a1 1 0 00-1-1H8a1 1 0 00-1 1v4h10z" />
            </svg>
            Print / Export PDF
          </button>
        </div>

        <!-- TABS -->
        <div class="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 mb-4 w-fit print:hidden">
          <button
            v-for="tab in tabs" :key="tab"
            @click="activeTab = tab"
            :class="activeTab === tab ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50'"
            class="px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            {{ tab }}
          </button>
        </div>

        <!-- DATE FILTER (affects Overview + Bookings tabs) -->
        <div v-if="activeTab !== 'Inventory Report'" class="bg-white p-4 rounded-2xl border border-gray-100 mb-4 flex flex-wrap items-end gap-4 print:hidden">
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">From</label>
            <input type="date" v-model="dateFrom" class="block mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">To</label>
            <input type="date" v-model="dateTo" class="block mt-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <button v-if="dateFrom || dateTo" @click="dateFrom = ''; dateTo = ''" class="text-xs font-semibold text-gray-500 hover:text-red-600">
            Clear filter
          </button>
        </div>

        <!-- Error Banner -->
        <div v-if="pageError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ pageError }}
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-100 text-center py-14 text-gray-400">
          Loading report data...
        </div>

        <template v-else>

          <!-- ============ OVERVIEW TAB ============ -->
          <div v-if="activeTab === 'Overview'">

            <!-- Summary Cards -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div class="bg-white p-5 rounded-2xl border border-gray-100">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Bookings</h3>
                <p class="text-2xl font-black text-gray-900 mt-1">{{ filteredBookings.length }}</p>
              </div>
              <div class="bg-white p-5 rounded-2xl border border-gray-100">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Confirmed</h3>
                <p class="text-2xl font-black text-emerald-600 mt-1">{{ countByStatus('Confirmed') }}</p>
              </div>
              <div class="bg-white p-5 rounded-2xl border border-gray-100">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Completed</h3>
                <p class="text-2xl font-black text-blue-600 mt-1">{{ countByStatus('Completed') }}</p>
              </div>
              <div class="bg-white p-5 rounded-2xl border border-gray-100">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Cancelled</h3>
                <p class="text-2xl font-black text-red-500 mt-1">{{ countByStatus('Cancelled') }}</p>
              </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div class="bg-white p-5 rounded-2xl border border-gray-100 md:col-span-1">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Estimated Revenue</h3>
                <p class="text-2xl font-black text-emerald-600 mt-1">₱{{ formatPrice(estimatedRevenue) }}</p>
                <p class="text-[11px] text-gray-400 mt-2 leading-snug">
                  Based on Confirmed &amp; Completed bookings (package price × guest count). Not yet linked to actual payments — pending the Payment Management module.
                </p>
              </div>
              <div class="bg-white p-5 rounded-2xl border border-gray-100 md:col-span-1">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Low Stock Items</h3>
                <p class="text-2xl font-black text-amber-500 mt-1">{{ lowStockItems.length }}</p>
                <p class="text-[11px] text-gray-400 mt-2 leading-snug">Out of {{ inventory.length }} tracked item(s) in inventory.</p>
              </div>
              <div class="bg-white p-5 rounded-2xl border border-gray-100 md:col-span-1">
                <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Active Packages</h3>
                <p class="text-2xl font-black text-gray-900 mt-1">{{ packages.length }}</p>
                <p class="text-[11px] text-gray-400 mt-2 leading-snug">Catering packages currently configured.</p>
              </div>
            </div>

            <!-- Booking status breakdown (simple bar chart, no chart lib needed) -->
            <div class="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
              <h3 class="font-bold text-gray-800 mb-4">Bookings by Status</h3>
              <div v-if="filteredBookings.length === 0" class="text-sm text-gray-400 py-6 text-center">No bookings in this range.</div>
              <div v-else class="space-y-3">
                <div v-for="s in statusBreakdown" :key="s.status" class="flex items-center gap-3">
                  <span class="w-24 text-xs font-semibold text-gray-600 flex-shrink-0">{{ s.status }}</span>
                  <div class="flex-1 h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div class="h-full rounded-full transition-all" :class="s.barClass" :style="{ width: s.pct + '%' }"></div>
                  </div>
                  <span class="w-8 text-xs font-bold text-gray-700 text-right flex-shrink-0">{{ s.count }}</span>
                </div>
              </div>
            </div>

            <!-- Monthly bookings trend -->
            <div class="bg-white rounded-2xl border border-gray-100 p-5">
              <h3 class="font-bold text-gray-800 mb-4">Bookings per Month</h3>
              <div v-if="monthlyTrend.length === 0" class="text-sm text-gray-400 py-6 text-center">No bookings in this range.</div>
              <div v-else class="flex items-end gap-3 h-40">
                <div v-for="m in monthlyTrend" :key="m.label" class="flex-1 flex flex-col items-center justify-end h-full">
                  <span class="text-xs font-bold text-gray-700 mb-1">{{ m.count }}</span>
                  <div class="w-full bg-emerald-500 rounded-t-lg transition-all" :style="{ height: m.pct + '%' }"></div>
                  <span class="text-[11px] text-gray-400 mt-2">{{ m.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- ============ BOOKINGS REPORT TAB ============ -->
          <div v-else-if="activeTab === 'Bookings Report'">
            <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
                <h3 class="font-bold text-gray-800">Booking Records ({{ filteredBookings.length }})</h3>
              </div>
              <div v-if="filteredBookings.length === 0" class="text-center py-14 text-gray-400 text-sm">
                No bookings found for the selected date range.
              </div>
              <table v-else class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                  <tr>
                    <th class="text-left px-6 py-3 font-semibold">Client</th>
                    <th class="text-left px-6 py-3 font-semibold">Event Date</th>
                    <th class="text-left px-6 py-3 font-semibold">Location</th>
                    <th class="text-left px-6 py-3 font-semibold">Guests</th>
                    <th class="text-left px-6 py-3 font-semibold">Package</th>
                    <th class="text-left px-6 py-3 font-semibold">Est. Amount</th>
                    <th class="text-left px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="b in filteredBookings" :key="b.booking_id">
                    <td class="px-6 py-3.5 font-medium text-gray-800">{{ b.client_name }}</td>
                    <td class="px-6 py-3.5 text-gray-600">{{ formatDate(b.event_date) }}</td>
                    <td class="px-6 py-3.5 text-gray-600">{{ b.event_location }}</td>
                    <td class="px-6 py-3.5 text-gray-600">{{ b.guest_count }}</td>
                    <td class="px-6 py-3.5 text-gray-600">{{ b.package_name || '—' }}</td>
                    <td class="px-6 py-3.5 text-gray-600">₱{{ formatPrice(estimateBookingAmount(b)) }}</td>
                    <td class="px-6 py-3.5">
                      <span :class="statusBadgeClass(b.booking_status)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                        {{ b.booking_status }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- ============ INVENTORY REPORT TAB ============ -->
          <div v-else-if="activeTab === 'Inventory Report'">
            <div v-if="lowStockItems.length > 0" class="bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium p-3 rounded-xl mb-4 flex items-center gap-2">
              <svg class="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
              <span>{{ lowStockItems.length }} item(s) at or below their low-stock threshold.</span>
            </div>

            <div class="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div class="px-6 py-4 border-b border-gray-100">
                <h3 class="font-bold text-gray-800">Inventory Levels ({{ inventory.length }})</h3>
              </div>
              <div v-if="inventory.length === 0" class="text-center py-14 text-gray-400 text-sm">
                No inventory items recorded yet.
              </div>
              <table v-else class="w-full text-sm">
                <thead class="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
                  <tr>
                    <th class="text-left px-6 py-3 font-semibold">Item</th>
                    <th class="text-left px-6 py-3 font-semibold">Quantity</th>
                    <th class="text-left px-6 py-3 font-semibold">Low Stock Threshold</th>
                    <th class="text-left px-6 py-3 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100">
                  <tr v-for="i in sortedInventory" :key="i.item_id">
                    <td class="px-6 py-3.5 font-medium text-gray-800">{{ i.item_name }}</td>
                    <td class="px-6 py-3.5 text-gray-600">{{ i.quantity }}</td>
                    <td class="px-6 py-3.5 text-gray-600">{{ i.low_stock_threshold }}</td>
                    <td class="px-6 py-3.5">
                      <span
                        :class="isLowStock(i) ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'"
                        class="px-2.5 py-1 rounded-full text-xs font-semibold"
                      >
                        {{ isLowStock(i) ? 'Low Stock' : 'Sufficient' }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </template>

      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllBookings } from '../services/bookingService'
import { getAllInventory } from '../services/inventoryService'
import { getAllPackages } from '../services/packageService'

const router = useRouter()

const isSidebarOpen = ref(true)
const userName = ref('User')
const userRole = ref('Staff')
const userInitial = ref('U')

const isLoading = ref(false)
const pageError = ref('')

const bookings = ref([])
const inventory = ref([])
const packages = ref([])

const tabs = ['Overview', 'Bookings Report', 'Inventory Report']
const activeTab = ref('Overview')

const dateFrom = ref('')
const dateTo = ref('')

const generatedOn = new Date().toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })

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

  fetchReportData()
})

async function fetchReportData() {
  isLoading.value = true
  pageError.value = ''
  try {
    const [b, i, p] = await Promise.all([getAllBookings(), getAllInventory(), getAllPackages()])
    bookings.value = b
    inventory.value = i
    packages.value = p
  } catch (error) {
    pageError.value = 'Failed to load report data. Please refresh the page.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

// ---------- Filtering ----------
const filteredBookings = computed(() => {
  return bookings.value.filter((b) => {
    if (dateFrom.value && b.event_date < dateFrom.value) return false
    if (dateTo.value && b.event_date > dateTo.value) return false
    return true
  })
})

function countByStatus(status) {
  return filteredBookings.value.filter((b) => b.booking_status === status).length
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

// ---------- Revenue estimate (package price x guest count, since there's no Payment module yet) ----------
function findPackagePrice(packageName) {
  const match = packages.value.find((p) => p.package_name === packageName)
  return match ? Number(match.price_per_head) || 0 : 0
}

function estimateBookingAmount(booking) {
  return findPackagePrice(booking.package_name) * (Number(booking.guest_count) || 0)
}

const estimatedRevenue = computed(() => {
  return filteredBookings.value
    .filter((b) => ['Confirmed', 'Completed'].includes(b.booking_status))
    .reduce((sum, b) => sum + estimateBookingAmount(b), 0)
})

function formatPrice(value) {
  const num = Number(value) || 0
  return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

// ---------- Charts (plain CSS, no chart library needed) ----------
const STATUS_LIST = ['Pending', 'Confirmed', 'Completed', 'Cancelled']
const STATUS_BAR_CLASS = {
  Pending: 'bg-amber-400',
  Confirmed: 'bg-emerald-500',
  Completed: 'bg-blue-500',
  Cancelled: 'bg-red-400'
}

const statusBreakdown = computed(() => {
  const total = filteredBookings.value.length || 1
  return STATUS_LIST.map((status) => {
    const count = countByStatus(status)
    return {
      status,
      count,
      pct: Math.round((count / total) * 100),
      barClass: STATUS_BAR_CLASS[status]
    }
  })
})

const monthlyTrend = computed(() => {
  const counts = {}
  filteredBookings.value.forEach((b) => {
    if (!b.event_date) return
    const d = new Date(b.event_date)
    const key = d.toLocaleDateString('en-PH', { month: 'short', year: '2-digit' })
    counts[key] = (counts[key] || 0) + 1
  })
  const entries = Object.entries(counts)
  const max = Math.max(...entries.map(([, c]) => c), 1)
  return entries.map(([label, count]) => ({
    label,
    count,
    pct: Math.max(Math.round((count / max) * 100), 6)
  }))
})

// ---------- Inventory ----------
function isLowStock(item) {
  return Number(item.quantity) <= Number(item.low_stock_threshold)
}

const lowStockItems = computed(() => inventory.value.filter(isLowStock))

const sortedInventory = computed(() => {
  return [...inventory.value].sort((a, b) => {
    const aLow = isLowStock(a) ? 0 : 1
    const bLow = isLowStock(b) ? 0 : 1
    return aLow - bLow
  })
})

// ---------- Print / export ----------
function printReport() {
  window.print()
}

// ---------- Nav / auth ----------
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
@media print {
  :deep(.print\:hidden) { display: none !important; }
}
</style>