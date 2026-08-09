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

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">
        <p v-if="isSidebarOpen" class="text-xs font-semibold text-gray-400 px-3 mb-2 uppercase tracking-wide">Menu</p>

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Catering Packages' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'"
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
            <h1 class="text-2xl font-bold text-gray-900">Catering Packages</h1>
            <p class="text-sm text-gray-500 mt-1">Configure menu packages and pricing per head.</p>
          </div>
          <button @click="openCreateModal" class="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Package
          </button>
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
              placeholder="Search packages..."
              class="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <!-- Error Banner -->
        <div v-if="pageError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ pageError }}
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="bg-white rounded-2xl border border-gray-100 text-center py-14 text-gray-400">
          Loading packages...
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredPackages.length === 0" class="bg-white rounded-2xl border border-gray-100 text-center py-14 text-gray-400">
          {{ packages.length === 0 ? 'No packages yet. Click "New Package" to add one.' : 'No packages match your search.' }}
        </div>

        <!-- Package Cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="pkg in filteredPackages"
            :key="pkg.package_id"
            class="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col hover:border-emerald-200 transition"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div class="flex items-center gap-1">
                <button @click="openEditModal(pkg)" class="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" title="Edit package">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="confirmDelete(pkg)" class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete package">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <h3 class="font-bold text-gray-900">{{ pkg.package_name }}</h3>
            <p class="text-sm text-gray-500 mt-1 flex-1">{{ pkg.description || 'No description provided.' }}</p>

            <div class="mt-4 pt-4 border-t border-gray-100 flex items-baseline gap-1">
              <span class="text-xl font-black text-emerald-600">₱{{ formatPrice(pkg.price_per_head) }}</span>
              <span class="text-xs text-gray-400 font-medium">/ head</span>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ============ CREATE / EDIT PACKAGE MODAL ============ -->
    <div v-if="showFormModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">{{ isEditing ? 'Edit Package' : 'New Package' }}</h3>

        <div v-if="modalError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleSavePackage" class="space-y-4">
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Package Name</label>
            <input type="text" v-model="form.package_name" placeholder="e.g. Silver Package" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Description</label>
            <textarea v-model="form.description" rows="3" placeholder="What's included in this package..." class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"></textarea>
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Price per Head (₱)</label>
            <input type="number" min="0" step="0.01" v-model.number="form.price_per_head" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeFormModal" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="isSaving" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Package') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ DELETE CONFIRM MODAL ============ -->
    <div v-if="packageToDelete" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Delete Package?</h3>
        <p class="text-sm text-gray-500 mb-2">
          This will permanently remove <span class="font-semibold text-gray-700">{{ packageToDelete.package_name }}</span>.
        </p>
        <div v-if="deleteError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-3">
          {{ deleteError }}
        </div>
        <div class="flex gap-3 mt-3">
          <button @click="packageToDelete = null" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
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
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage
} from '../services/packageService'

const router = useRouter()

const isSidebarOpen = ref(true)
const userName = ref('User')
const userRole = ref('Staff')
const userInitial = ref('U')

const packages = ref([])
const isLoading = ref(false)
const pageError = ref('')

const searchQuery = ref('')

const showFormModal = ref(false)
const isEditing = ref(false)
const editingId = ref(null)
const isSaving = ref(false)
const modalError = ref('')

const packageToDelete = ref(null)
const isDeleting = ref(false)
const deleteError = ref('')

const emptyForm = () => ({
  package_name: '',
  description: '',
  price_per_head: null
})
const form = ref(emptyForm())

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

  fetchPackages()
})

async function fetchPackages() {
  isLoading.value = true
  pageError.value = ''
  try {
    packages.value = await getAllPackages()
  } catch (error) {
    pageError.value = 'Failed to load packages. Please refresh the page.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const filteredPackages = computed(() => {
  const q = searchQuery.value.toLowerCase()
  if (!q) return packages.value
  return packages.value.filter(
    (p) =>
      p.package_name?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
  )
})

function formatPrice(value) {
  const num = Number(value) || 0
  return num.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function openCreateModal() {
  isEditing.value = false
  editingId.value = null
  form.value = emptyForm()
  modalError.value = ''
  showFormModal.value = true
}

function openEditModal(pkg) {
  isEditing.value = true
  editingId.value = pkg.package_id
  form.value = {
    package_name: pkg.package_name,
    description: pkg.description || '',
    price_per_head: pkg.price_per_head
  }
  modalError.value = ''
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
}

async function handleSavePackage() {
  modalError.value = ''
  isSaving.value = true
  try {
    if (isEditing.value) {
      await updatePackage(editingId.value, form.value)
    } else {
      await createPackage(form.value)
    }
    showFormModal.value = false
    fetchPackages()
  } catch (error) {
    modalError.value = error?.response?.data?.error || 'Something went wrong. Please try again.'
  } finally {
    isSaving.value = false
  }
}

function confirmDelete(pkg) {
  deleteError.value = ''
  packageToDelete.value = pkg
}

async function handleDelete() {
  if (!packageToDelete.value) return
  isDeleting.value = true
  deleteError.value = ''
  try {
    await deletePackage(packageToDelete.value.package_id)
    packages.value = packages.value.filter((p) => p.package_id !== packageToDelete.value.package_id)
    packageToDelete.value = null
  } catch (error) {
    deleteError.value = error?.response?.data?.error || 'Failed to delete package.'
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

// Staff (per the manuscript's Use Case Diagram) only has access to
// Login/Authentication and Manage Payments -- so their sidebar only
// shows Dashboard (general landing view) and Payments.
const staffAllowedSections = ['Dashboard', 'Payments']

const navItems = computed(() =>
  userRole.value === 'Staff'
    ? allNavItems.filter(item => staffAllowedSections.includes(item.name))
    : allNavItems
)
</script>

<style scoped>
</style>