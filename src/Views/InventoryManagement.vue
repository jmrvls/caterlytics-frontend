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
          <span v-if="isSidebarOpen" class="whitespace-nowrap">New Item</span>
        </button>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">
        <p v-if="isSidebarOpen" class="text-xs font-semibold text-gray-400 px-3 mb-2 uppercase tracking-wide">Menu</p>

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Inventory' ? 'bg-emerald-50 text-emerald-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'"
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
            <h1 class="text-2xl font-bold text-gray-900">Inventory</h1>
            <p class="text-sm text-gray-500 mt-1">Track stock levels and get notified when supplies run low.</p>
          </div>
          <button @click="openCreateModal" class="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 transition">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            New Item
          </button>
        </div>

        <!-- Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Total Items</h3>
            <p class="text-2xl font-black text-gray-900 mt-1">{{ items.length }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Low Stock</h3>
            <p class="text-2xl font-black text-red-500 mt-1">{{ lowStockItems.length }}</p>
          </div>
          <div class="bg-white p-5 rounded-2xl border border-gray-100">
            <h3 class="text-xs font-bold text-gray-400 uppercase tracking-wide">Healthy Stock</h3>
            <p class="text-2xl font-black text-emerald-600 mt-1">{{ items.length - lowStockItems.length }}</p>
          </div>
        </div>

        <!-- Low Stock Alert -->
        <div v-if="lowStockItems.length > 0" class="bg-red-50 border border-red-200 text-red-700 text-sm font-medium p-4 rounded-xl mb-4 flex gap-2">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86l-8.18 14.14A2 2 0 003.82 21h16.36a2 2 0 001.71-3l-8.18-14.14a2 2 0 00-3.42 0z" />
          </svg>
          <span>{{ lowStockItems.length }} item(s) below threshold: {{ lowStockItems.map(i => i.item_name).join(', ') }}</span>
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
              placeholder="Search items..."
              class="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <!-- Error Banner -->
        <div v-if="pageError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ pageError }}
        </div>

        <!-- Inventory Table -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 text-gray-500 uppercase text-xs tracking-wide">
              <tr>
                <th class="text-left px-6 py-3 font-semibold">Item</th>
                <th class="text-left px-6 py-3 font-semibold">Quantity</th>
                <th class="text-left px-6 py-3 font-semibold">Low Stock Threshold</th>
                <th class="text-left px-6 py-3 font-semibold">Status</th>
                <th class="text-right px-6 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-if="isLoading">
                <td colspan="5" class="text-center py-10 text-gray-400">Loading inventory...</td>
              </tr>
              <tr v-else-if="filteredItems.length === 0">
                <td colspan="5" class="text-center py-10 text-gray-400">
                  {{ items.length === 0 ? 'No items yet. Click "New Item" to add one.' : 'No items match your search.' }}
                </td>
              </tr>
              <tr v-for="i in filteredItems" :key="i.item_id" class="hover:bg-gray-50/60">
                <td class="px-6 py-3.5 font-medium text-gray-800">{{ i.item_name }}</td>
                <td class="px-6 py-3.5 text-gray-600">{{ i.quantity }}</td>
                <td class="px-6 py-3.5 text-gray-600">{{ i.low_stock_threshold }}</td>
                <td class="px-6 py-3.5">
                  <span :class="isLow(i) ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'" class="px-2.5 py-1 rounded-full text-xs font-semibold">
                    {{ isLow(i) ? 'Low Stock' : 'OK' }}
                  </span>
                </td>
                <td class="px-6 py-3.5">
                  <div class="flex items-center justify-end gap-2">
                    <button @click="adjustStock(i, -1)" class="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Deduct 1">−</button>
                    <button @click="adjustStock(i, 1)" class="w-7 h-7 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50" title="Add 1">+</button>
                    <button @click="openEditModal(i)" class="p-1.5 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-emerald-50" title="Edit">
                      <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button @click="confirmDelete(i)" class="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50" title="Delete">
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

    <!-- ============ CREATE / EDIT MODAL ============ -->
    <div v-if="showFormModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-4">{{ editingItem ? 'Edit Item' : 'New Item' }}</h3>

        <div v-if="modalError" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl mb-4">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleSaveItem" class="space-y-4">
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Item Name</label>
            <input type="text" v-model="form.item_name" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
          </div>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Quantity</label>
              <input type="number" min="0" v-model.number="form.quantity" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" required />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Low Stock Threshold</label>
              <input type="number" min="0" v-model.number="form.low_stock_threshold" class="w-full mt-1 p-3 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            </div>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeFormModal" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" :disabled="isSaving" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSaving ? 'Saving...' : (editingItem ? 'Save Changes' : 'Create Item') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ DELETE CONFIRM MODAL ============ -->
    <div v-if="itemToDelete" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 mb-2">Delete Item?</h3>
        <p class="text-sm text-gray-500 mb-5">
          This will permanently remove <span class="font-semibold text-gray-700">{{ itemToDelete.item_name }}</span> from inventory.
        </p>
        <div class="flex gap-3">
          <button @click="itemToDelete = null" class="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-50">
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
  getAllInventory,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryStock,
  deleteInventoryItem
} from '../services/inventoryService'

const router = useRouter()

const isSidebarOpen = ref(true)
const userName = ref('User')
const userRole = ref('Staff')
const userInitial = ref('U')

const items = ref([])
const isLoading = ref(false)
const pageError = ref('')
const searchQuery = ref('')

const showFormModal = ref(false)
const editingItem = ref(null)
const isSaving = ref(false)
const modalError = ref('')

const itemToDelete = ref(null)
const isDeleting = ref(false)

const emptyForm = () => ({ item_name: '', quantity: 0, low_stock_threshold: 5 })
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

  fetchItems()
})

async function fetchItems() {
  isLoading.value = true
  pageError.value = ''
  try {
    items.value = await getAllInventory()
  } catch (error) {
    pageError.value = 'Failed to load inventory. Please refresh the page.'
    console.error(error)
  } finally {
    isLoading.value = false
  }
}

const filteredItems = computed(() =>
  items.value.filter((i) => i.item_name?.toLowerCase().includes(searchQuery.value.toLowerCase()))
)

const lowStockItems = computed(() => items.value.filter((i) => isLow(i)))

function isLow(item) {
  return Number(item.quantity) <= Number(item.low_stock_threshold)
}

function openCreateModal() {
  editingItem.value = null
  form.value = emptyForm()
  modalError.value = ''
  showFormModal.value = true
}

function openEditModal(item) {
  editingItem.value = item
  form.value = { item_name: item.item_name, quantity: item.quantity, low_stock_threshold: item.low_stock_threshold }
  modalError.value = ''
  showFormModal.value = true
}

function closeFormModal() {
  showFormModal.value = false
}

async function handleSaveItem() {
  modalError.value = ''
  isSaving.value = true
  try {
    if (editingItem.value) {
      await updateInventoryItem(editingItem.value.item_id, form.value)
    } else {
      await createInventoryItem(form.value)
    }
    showFormModal.value = false
    fetchItems()
  } catch (error) {
    modalError.value = error?.response?.data?.error || 'Something went wrong. Please try again.'
  } finally {
    isSaving.value = false
  }
}

async function adjustStock(item, delta) {
  const previousQuantity = item.quantity
  item.quantity = Number(item.quantity) + delta // optimistic update
  try {
    await adjustInventoryStock(item.item_id, delta)
  } catch (error) {
    item.quantity = previousQuantity
    pageError.value = 'Failed to adjust stock.'
    console.error(error)
  }
}

function confirmDelete(item) {
  itemToDelete.value = item
}

async function handleDelete() {
  if (!itemToDelete.value) return
  isDeleting.value = true
  try {
    await deleteInventoryItem(itemToDelete.value.item_id)
    items.value = items.value.filter((i) => i.item_id !== itemToDelete.value.item_id)
    itemToDelete.value = null
  } catch (error) {
    pageError.value = 'Failed to delete item.'
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

const navItems = ref([
  { name: 'Dashboard', path: '/admin/dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', path: '/admin/bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Catering Packages', path: '/admin/packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Payments', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Staff Management', path: '/admin/dashboard', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
])
</script>

<style scoped>
</style>