<template>
  <div class="min-h-screen bg-gray-50 font-sans">

    <!-- TOP NAV -->
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div class="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <div class="flex items-center gap-2">
          <img src="/src/assets/logofinal.png" alt="Logo" class="w-8 h-8 object-contain" />
          <span class="font-bold text-gray-800">Caterlytics</span>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right hidden sm:block">
            <p class="text-sm font-semibold text-gray-800 leading-none">{{ userName }}</p>
            <p class="text-xs text-gray-400 mt-0.5">Client</p>
          </div>
          <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
            {{ userInitial }}
          </div>
          <button @click="handleLogout" class="text-xs font-semibold text-red-500 hover:text-red-600">Log Out</button>
        </div>
      </div>
    </header>

    <main class="max-w-5xl mx-auto px-6 py-8">

      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900">Welcome, {{ userName }}</h1>
        <p class="text-sm text-gray-500 mt-1">Book a catering package or check the status of your reservations.</p>
      </div>

      <!-- TABS -->
      <div class="flex gap-1 bg-white p-1 rounded-xl border border-gray-100 mb-6 w-fit">
        <button
          v-for="tab in tabs" :key="tab"
          @click="activeTab = tab"
          :class="activeTab === tab ? 'bg-emerald-600 text-white' : 'text-gray-500 hover:bg-gray-50'"
          class="px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          {{ tab }}
        </button>
      </div>

      <!-- Global success / error banners -->
      <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium p-3 rounded-xl mb-4">
        {{ successMessage }}
      </div>
      <div v-if="pageError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
        {{ pageError }}
      </div>

      <!-- ============ BOOK CATERING TAB ============ -->
      <div v-if="activeTab === 'Book Catering'" class="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 class="font-bold text-gray-800 mb-4">New Booking Request</h3>

        <form @submit.prevent="submitBooking" class="space-y-5">

          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Booked Under</label>
            <input type="text" :value="userName" disabled class="w-full mt-1 p-3 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Event Date</label>
              <input type="date" v-model="form.event_date" required :min="todayStr" class="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Event Time</label>
              <input type="time" v-model="form.event_time" required class="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Event Location</label>
            <input type="text" v-model="form.event_location" required placeholder="e.g. Barangay Hall, Roxas City" class="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Number of Guests</label>
              <input type="number" v-model.number="form.guest_count" required min="1" class="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Catering Package</label>
              <select v-model="form.package_name" class="w-full mt-1 p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="">Select a package (optional)</option>
                <option v-for="p in packages" :key="p.package_id" :value="p.package_name">
                  {{ p.package_name }} — ₱{{ formatPrice(p.price_per_head) }}/head
                </option>
              </select>
            </div>
          </div>

          <div v-if="selectedPackage" class="bg-gray-50 border border-gray-100 rounded-xl p-4">
            <p class="text-sm font-semibold text-gray-800">{{ selectedPackage.package_name }}</p>
            <p class="text-xs text-gray-500 mt-1">{{ selectedPackage.description }}</p>
            <p class="text-sm font-bold text-emerald-600 mt-2">
              Est. Total: ₱{{ formatPrice((selectedPackage.price_per_head || 0) * (form.guest_count || 0)) }}
            </p>
          </div>

          <button type="submit" :disabled="isSubmitting" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-50">
            {{ isSubmitting ? 'Submitting...' : 'Submit Booking Request' }}
          </button>
        </form>
      </div>

      <!-- ============ MY BOOKINGS TAB ============ -->
      <div v-else-if="activeTab === 'My Bookings'">
        <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-100 text-center py-14 text-gray-400">
          Loading your bookings...
        </div>
        <div v-else-if="myBookings.length === 0" class="bg-white rounded-2xl border border-gray-100 text-center py-14">
          <p class="text-gray-400 text-sm">You haven't made any bookings yet.</p>
          <button @click="activeTab = 'Book Catering'" class="mt-3 text-emerald-600 font-semibold text-sm hover:underline">
            Book your first event
          </button>
        </div>
        <div v-else class="grid gap-4">
          <div v-for="b in myBookings" :key="b.booking_id" class="bg-white rounded-2xl border border-gray-100 p-5 flex items-center justify-between">
            <div>
              <p class="font-bold text-gray-800">{{ b.package_name || 'Custom Booking' }}</p>
              <p class="text-sm text-gray-500 mt-0.5">{{ formatDate(b.event_date) }} at {{ b.event_time }} — {{ b.event_location }}</p>
              <p class="text-xs text-gray-400 mt-1">{{ b.guest_count }} guests</p>
            </div>
            <span :class="statusBadgeClass(b.booking_status)" class="px-3 py-1.5 rounded-full text-xs font-semibold flex-shrink-0">
              {{ b.booking_status }}
            </span>
          </div>
        </div>
      </div>

    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { createBooking, getMyBookings } from '../services/bookingService'
import { getAllPackages } from '../services/packageService'

const router = useRouter()

const userName = ref('')
const userInitial = ref('U')

const tabs = ['Book Catering', 'My Bookings']
const activeTab = ref('Book Catering')

const packages = ref([])
const myBookings = ref([])

const isLoading = ref(false)
const isSubmitting = ref(false)
const successMessage = ref('')
const pageError = ref('')

const todayStr = new Date().toISOString().split('T')[0]

const form = ref({
  event_date: '',
  event_time: '',
  event_location: '',
  guest_count: null,
  package_name: ''
})

const selectedPackage = computed(() => packages.value.find((p) => p.package_name === form.value.package_name))

onMounted(() => {
  const storedUser = localStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  if (user.role !== 'Client') {
    router.push('/admin/dashboard')
    return
  }
  userName.value = user.full_name
  userInitial.value = user.full_name.charAt(0).toUpperCase()

  loadPackages()
  loadMyBookings()
})

async function loadPackages() {
  try {
    packages.value = await getAllPackages()
  } catch (error) {
    console.error(error)
  }
}

async function loadMyBookings() {
  isLoading.value = true
  try {
    myBookings.value = await getMyBookings()
  } catch (error) {
    pageError.value = 'Failed to load your bookings.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

async function submitBooking() {
  successMessage.value = ''
  pageError.value = ''
  isSubmitting.value = true

  try {
    await createBooking({
      client_name: userName.value,
      event_date: form.value.event_date,
      event_time: form.value.event_time,
      event_location: form.value.event_location,
      guest_count: form.value.guest_count,
      package_name: form.value.package_name || null
    })

    successMessage.value = 'Booking request submitted! We will confirm it shortly.'
    form.value = { event_date: '', event_time: '', event_location: '', guest_count: null, package_name: '' }
    await loadMyBookings()
    activeTab.value = 'My Bookings'
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      pageError.value = error.response.data.error
    } else {
      pageError.value = 'Something went wrong. Please try again.'
    }
  } finally {
    isSubmitting.value = false
  }
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

function formatPrice(value) {
  const num = Number(value) || 0
  return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

function handleLogout() {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
  router.push('/')
}
</script>