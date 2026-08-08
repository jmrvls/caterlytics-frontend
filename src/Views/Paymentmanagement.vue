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

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">
        <p v-if="isSidebarOpen" class="text-xs font-semibold text-gray-400 px-3 mb-2 uppercase tracking-wide">Menu</p>

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Payments' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'"
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
    <main class="flex-1 p-8 overflow-x-hidden print:hidden">
      <div class="max-w-7xl mx-auto">

        <div class="flex items-center justify-between mb-6">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">Payments</h1>
            <p class="text-sm text-gray-500 mt-1">Track down payments, balances, and payment status per booking.</p>
          </div>
          <button @click="openCreateModal" class="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Payment
          </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Records</h3>
            <p class="text-2xl font-black text-gray-900 mt-1">{{ payments.length }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Fully Paid</h3>
            <p class="text-2xl font-black text-emerald-600 mt-1">{{ countByStatus('Paid') }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Partial</h3>
            <p class="text-2xl font-black text-amber-500 mt-1">{{ countByStatus('Partial') }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Unpaid</h3>
            <p class="text-2xl font-black text-red-500 mt-1">{{ countByStatus('Unpaid') }}</p>
          </div>
        </div>

        <!-- Search -->
        <div class="bg-white p-4 rounded-2xl border border-gray-100 mb-4">
          <div class="relative">
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
        </div>

        <!-- Error Banner -->
        <div v-if="pageError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ pageError }}
        </div>

        <!-- Payments Table -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                <th class="text-left px-6 py-3 font-semibold">Client</th>
                <th class="text-left px-6 py-3 font-semibold">Event Date</th>
                <th class="text-left px-6 py-3 font-semibold">Total</th>
                <th class="text-left px-6 py-3 font-semibold">Paid</th>
                <th class="text-left px-6 py-3 font-semibold">Balance</th>
                <th class="text-left px-6 py-3 font-semibold">Status</th>
                <th class="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="isLoading">
                <td colspan="7" class="text-center py-10 text-gray-400">Loading payments...</td>
              </tr>
              <tr v-else-if="filteredPayments.length === 0">
                <td colspan="7" class="text-center py-10 text-gray-400">
                  {{ payments.length === 0 ? 'No payment records yet. Click "New Payment" to add one.' : 'No records match your search.' }}
                </td>
              </tr>
              <tr v-for="p in filteredPayments" :key="p.payment_id" class="hover:bg-gray-50/60">
                <td class="px-6 py-3.5 font-medium text-gray-800">{{ p.tbl_bookings?.client_name || '—' }}</td>
                <td class="px-6 py-3.5 text-gray-600">{{ formatDate(p.tbl_bookings?.event_date) }}</td>
                <td class="px-6 py-3.5 text-gray-600">₱{{ Number(p.total_amount).toLocaleString() }}</td>
                <td class="px-6 py-3.5 text-gray-600">₱{{ Number(p.amount_paid).toLocaleString() }}</td>
                <td class="px-6 py-3.5 text-gray-600">₱{{ Number(p.balance).toLocaleString() }}</td>
                <td class="px-6 py-3.5">
                  <span :class="statusStyle(p.payment_status)" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                    {{ p.payment_status }}
                  </span>
                </td>
                <td class="px-6 py-3.5">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      v-if="p.payment_status !== 'Paid'"
                      @click="openRecordModal(p)"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100"
                    >
                      Record Payment
                    </button>
                    <button
                      @click="openReceiptModal(p)"
                      class="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100"
                    >
                      Receipt
                    </button>
                    <button @click="confirmDelete(p)" class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete">
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

    <!-- ============ NEW PAYMENT MODAL ============ -->
    <div v-if="showCreateModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">New Payment Record</h3>

        <div v-if="modalError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleCreatePayment" class="space-y-4">
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Booking</label>
            <select v-model.number="createForm.booking_id" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required>
              <option value="" disabled>Select a booking</option>
              <option v-for="b in bookingsWithoutPayment" :key="b.booking_id" :value="b.booking_id">
                {{ b.client_name }} — {{ formatDate(b.event_date) }}
              </option>
            </select>
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Total Amount</label>
            <input type="number" min="0" step="0.01" v-model.number="createForm.total_amount" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Initial Down Payment (optional)</label>
            <input type="number" min="0" step="0.01" v-model.number="createForm.amount_paid" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="showCreateModal = false" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="isSaving" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSaving ? 'Saving...' : 'Create Record' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ RECORD PAYMENT MODAL ============ -->
    <div v-if="recordingPayment" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-1">Record Payment</h3>
        <p class="text-sm text-gray-500 mb-4">
          Remaining balance: <span class="font-semibold text-gray-700">₱{{ Number(recordingPayment.balance).toLocaleString() }}</span>
        </p>

        <div v-if="modalError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleRecordPayment" class="space-y-4">
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Amount Received</label>
            <input type="number" min="0" step="0.01" :max="recordingPayment.balance" v-model.number="recordAmount" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>
          <div class="flex gap-3 pt-2">
            <button type="button" @click="recordingPayment = null" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="isSaving" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSaving ? 'Saving...' : 'Record' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ DELETE CONFIRM MODAL ============ -->
    <div v-if="paymentToDelete" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Delete Payment Record?</h3>
        <p class="text-sm text-gray-500 mb-5">
          This will permanently remove the payment record for
          <span class="font-semibold text-gray-700">{{ paymentToDelete.tbl_bookings?.client_name }}</span>.
        </p>
        <div class="flex gap-3">
          <button @click="paymentToDelete = null" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
            Cancel
          </button>
          <button @click="handleDelete" :disabled="isDeleting" class="flex-1 bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 disabled:opacity-50">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ RECEIPT MODAL ============ -->
    <div v-if="receiptPayment" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 print:static print:bg-white print:p-0">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 print:shadow-none print:rounded-none print:max-w-full">

        <div class="text-center border-b border-dashed border-gray-300 pb-4 mb-4">
          <img src="/src/assets/logofinal.png" alt="Logo" class="w-10 h-10 object-contain mx-auto mb-1" />
          <h3 class="font-black text-gray-900 text-lg">Caterlytics</h3>
          <p class="text-xs text-gray-400">Official Payment Receipt</p>
        </div>

        <div class="space-y-1.5 text-sm mb-4">
          <div class="flex justify-between">
            <span class="text-gray-400">Receipt No.</span>
            <span class="font-semibold text-gray-800">#{{ String(receiptPayment.payment_id).padStart(6, '0') }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Date Issued</span>
            <span class="font-semibold text-gray-800">{{ formatDate(receiptPayment.payment_date) || generatedOn }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Client</span>
            <span class="font-semibold text-gray-800">{{ receiptPayment.tbl_bookings?.client_name || '—' }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-400">Event Date</span>
            <span class="font-semibold text-gray-800">{{ formatDate(receiptPayment.tbl_bookings?.event_date) }}</span>
          </div>
        </div>

        <div class="border-t border-dashed border-gray-300 pt-4 space-y-1.5 text-sm mb-4">
          <div class="flex justify-between">
            <span class="text-gray-500">Total Amount</span>
            <span class="text-gray-800">₱{{ Number(receiptPayment.total_amount).toLocaleString() }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-gray-500">Amount Paid</span>
            <span class="text-gray-800">₱{{ Number(receiptPayment.amount_paid).toLocaleString() }}</span>
          </div>
          <div class="flex justify-between font-bold text-base pt-1">
            <span class="text-gray-700">Balance</span>
            <span :class="Number(receiptPayment.balance) > 0 ? 'text-red-600' : 'text-emerald-600'">₱{{ Number(receiptPayment.balance).toLocaleString() }}</span>
          </div>
        </div>

        <div class="text-center border-t border-dashed border-gray-300 pt-4">
          <span :class="statusStyle(receiptPayment.payment_status)" class="px-3 py-1 rounded-full text-xs font-bold">
            {{ receiptPayment.payment_status }}
          </span>
          <p class="text-xs text-gray-400 mt-3">Thank you for booking with Caterlytics!</p>
        </div>

        <div class="flex gap-3 pt-5 print:hidden">
          <button @click="receiptPayment = null" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
            Close
          </button>
          <button @click="printReceipt" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700">
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getAllPayments, createPayment, recordPayment, deletePayment } from '../services/paymentService'
import { getAllBookings } from '../services/bookingService'

const router = useRouter()

const isSidebarOpen = ref(true)
const userName = ref('User')
const userRole = ref('Staff')
const userInitial = ref('U')

const payments = ref([])
const bookings = ref([])
const isLoading = ref(false)
const pageError = ref('')
const searchQuery = ref('')

const showCreateModal = ref(false)
const isSaving = ref(false)
const modalError = ref('')
const createForm = ref({ booking_id: '', total_amount: 0, amount_paid: 0 })

const recordingPayment = ref(null)
const recordAmount = ref(0)

const paymentToDelete = ref(null)
const isDeleting = ref(false)

const receiptPayment = ref(null)
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

  fetchData()
})

async function fetchData() {
  isLoading.value = true
  pageError.value = ''
  try {
    const [paymentsData, bookingsData] = await Promise.all([getAllPayments(), getAllBookings()])
    payments.value = paymentsData
    bookings.value = bookingsData
  } catch (error) {
    pageError.value = 'Failed to load payments. Please refresh the page.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const filteredPayments = computed(() =>
  payments.value.filter((p) =>
    (p.tbl_bookings?.client_name || '').toLowerCase().includes(searchQuery.value.toLowerCase())
  )
)

const bookingsWithoutPayment = computed(() => {
  const bookedIds = new Set(payments.value.map((p) => p.booking_id))
  return bookings.value.filter((b) => !bookedIds.has(b.booking_id))
})

function countByStatus(status) {
  return payments.value.filter((p) => p.payment_status === status).length
}

function statusStyle(status) {
  if (status === 'Paid') return 'bg-emerald-50 text-emerald-700'
  if (status === 'Partial') return 'bg-amber-50 text-amber-700'
  return 'bg-red-50 text-red-700'
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function openCreateModal() {
  createForm.value = { booking_id: '', total_amount: 0, amount_paid: 0 }
  modalError.value = ''
  showCreateModal.value = true
}

async function handleCreatePayment() {
  modalError.value = ''
  isSaving.value = true
  try {
    await createPayment(createForm.value)
    showCreateModal.value = false
    fetchData()
  } catch (error) {
    modalError.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function openRecordModal(payment) {
  recordingPayment.value = payment
  recordAmount.value = 0
  modalError.value = ''
}

async function handleRecordPayment() {
  modalError.value = ''
  isSaving.value = true
  try {
    await recordPayment(recordingPayment.value.payment_id, recordAmount.value)
    recordingPayment.value = null
    fetchData()
  } catch (error) {
    modalError.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function confirmDelete(payment) {
  paymentToDelete.value = payment
}

function openReceiptModal(payment) {
  receiptPayment.value = payment
}

function printReceipt() {
  window.print()
}

async function handleDelete() {
  if (!paymentToDelete.value) return
  isDeleting.value = true
  try {
    await deletePayment(paymentToDelete.value.payment_id)
    payments.value = payments.value.filter((p) => p.payment_id !== paymentToDelete.value.payment_id)
    paymentToDelete.value = null
  } catch (error) {
    pageError.value = 'Failed to delete payment record.'
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
@media print {
  :deep(.print\:hidden) { display: none !important; }
  :deep(.print\:static) { position: static !important; }
  :deep(.print\:bg-white) { background: white !important; }
  :deep(.print\:p-0) { padding: 0 !important; }
  :deep(.print\:shadow-none) { box-shadow: none !important; }
  :deep(.print\:rounded-none) { border-radius: 0 !important; }
  :deep(.print\:max-w-full) { max-width: 100% !important; }
}
</style>