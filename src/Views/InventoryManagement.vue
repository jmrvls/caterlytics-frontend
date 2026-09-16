<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900 font-sans">

    <!-- MOBILE TOP BAR -->
    <div class="lg:hidden fixed top-0 inset-x-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 px-4 py-3 print:hidden">
      <button @click="isMobileSidebarOpen = true" class="p-2 -ml-2 rounded-none text-gray-600 dark:text-gray-300">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="font-bold text-gray-800 dark:text-gray-100 truncate">Caterlytics</span>
      </div>
      <NotificationBell />
    </div>

    <!-- MOBILE BACKDROP -->
    <div v-if="isMobileSidebarOpen" @click="isMobileSidebarOpen = false" class="fixed inset-0 bg-black/40 z-40 lg:hidden"></div>

    <!-- SIDEBAR -->
    <aside
      :class="[sidebarExpanded ? 'w-64' : 'w-20', isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
      class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 h-screen fixed lg:sticky top-0 left-0 z-50 lg:z-auto"
    >
      <div class="flex items-center justify-between p-4">
        <div v-if="sidebarExpanded" class="flex items-center gap-2 overflow-hidden">
          <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <span class="font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Caterlytics</span>
        </div>
        <button @click="isMobileSidebarOpen ? (isMobileSidebarOpen = false) : (isSidebarOpen = !isSidebarOpen)" :class="!sidebarExpanded ? 'mx-auto' : ''" class="relative group p-1.5 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 dark:text-gray-500">
          <img v-if="!sidebarExpanded" :src="logoUrl" alt="Toggle" class="w-8 h-8 object-contain group-hover:opacity-0 transition-opacity duration-150" />
          <svg v-if="!sidebarExpanded" class="w-8 h-8 absolute inset-0 m-auto opacity-0 group-hover:opacity-100 transition-opacity duration-150" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke-width="2" />
            <line x1="9" y1="4" x2="9" y2="20" stroke-width="2" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3" y="4" width="18" height="16" rx="2" stroke-width="2" />
            <line x1="9" y1="4" x2="9" y2="20" stroke-width="2" />
          </svg>
          <span class="pointer-events-none absolute left-full ml-2 top-1/2 -translate-y-1/2 whitespace-nowrap bg-gray-900 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
            {{ sidebarExpanded ? 'Close sidebar' : 'Open sidebar' }}
          </span>
        </button>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">
        <p v-if="sidebarExpanded" class="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 mb-2 uppercase tracking-wide">Menu</p>

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Inventory' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          class="flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          <span v-if="sidebarExpanded" class="whitespace-nowrap">{{ item.name }}</span>
        </a>
      </nav>

      <div class="border-t border-gray-200 dark:border-gray-700 p-3 relative">
        <!-- Click-outside backdrop -->
        <div v-if="showAccountMenu" @click="showAccountMenu = false" class="fixed inset-0 z-40"></div>

        <!-- Account menu (Log Out) -->
        <div v-if="showAccountMenu" class="absolute bottom-full left-2 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none shadow-lg overflow-hidden z-50">
          <button @click="handleLogout" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>

        <!-- Profile: click toggles the account menu -->
        <div @click="showAccountMenu = !showAccountMenu" class="flex items-center gap-3 px-2 py-2 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            <span>{{ userInitial }}</span>
          </div>
          <div v-if="sidebarExpanded" class="overflow-hidden">
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{{ userName }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ userRole }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 p-4 sm:p-8 pt-20 lg:pt-8 overflow-x-hidden w-full min-w-0">
      <div class="max-w-none 2xl:max-w-[1920px] mx-auto">

        <div class="flex flex-row items-center justify-between gap-2 sm:gap-3 mb-4">
          <!-- Search -->
          <div class="relative flex-1 max-w-sm">
            <svg class="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search items..."
              class="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
            />
          </div>

          <!-- Bell + New Item -->
          <div class="flex items-center gap-3 flex-shrink-0">
            <div class="hidden lg:block">
              <NotificationBell />
            </div>
            <button @click="openCreateModal" class="flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2.5 sm:px-4 rounded-none font-semibold text-sm hover:bg-emerald-700 transition whitespace-nowrap min-w-[172px]">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Item
            </button>
          </div>
        </div>

        <!-- Low Stock Alert -->
        <div v-if="lowStockItems.length > 0" class="text-red-700 dark:text-red-300 text-sm font-medium p-4 mb-4 flex gap-2">
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M10.29 3.86l-8.18 14.14A2 2 0 003.82 21h16.36a2 2 0 001.71-3l-8.18-14.14a2 2 0 00-3.42 0z" />
          </svg>
          <span>{{ lowStockItems.length }} item(s) below threshold: {{ lowStockItems.map(i => i.item_name).join(', ') }}</span>
        </div>

        <!-- Error Banner -->
        <div v-if="pageError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ pageError }}
        </div>

        <!-- Inventory — mobile card list (phone-friendly, replaces the table below md) -->
        <div class="md:hidden space-y-3">
          <div v-if="isLoading" class="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">Loading inventory...</div>
          <div v-else-if="filteredItems.length === 0" class="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
            {{ items.length === 0 ? 'No items yet. Tap "New Item" to add one.' : 'No items match your search.' }}
          </div>
          <div
            v-for="i in filteredItems" :key="i.item_id"
            class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-none p-4"
          >
            <div class="flex items-start justify-between gap-3 mb-3">
              <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ i.item_name }}</p>
              <span :class="isLow(i) ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'" class="shrink-0 text-xs font-semibold leading-5">
                {{ isLow(i) ? 'Low Stock' : 'OK' }}
              </span>
            </div>

            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-3">
                <button @click="adjustStock(i, -1)" class="w-9 h-9 flex items-center justify-center rounded-none border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 active:bg-gray-50 dark:active:bg-gray-700 text-lg" title="Deduct 1">−</button>
                <span class="text-lg font-bold text-gray-800 dark:text-gray-100 min-w-[2ch] text-center">{{ i.quantity }}</span>
                <button @click="adjustStock(i, 1)" class="w-9 h-9 flex items-center justify-center rounded-none border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 active:bg-gray-50 dark:active:bg-gray-700 text-lg" title="Add 1">+</button>
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500">Threshold: {{ i.low_stock_threshold }}</p>
            </div>

            <p class="text-xs text-gray-400 dark:text-gray-500 mb-3">Unit Cost: ₱{{ formatCost(i.unit_cost) }}</p>

            <div class="flex items-center gap-2">
              <button
                @click="openEditModal(i)"
                class="flex-1 py-2.5 rounded-none text-sm font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 active:bg-emerald-100 dark:active:bg-emerald-900/40"
              >
                Edit
              </button>
              <button
                @click="confirmDelete(i)"
                class="w-11 h-11 flex items-center justify-center rounded-none text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 active:bg-red-50 dark:active:bg-red-900/30 active:text-red-600"
                title="Delete"
              >
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- Inventory Table — desktop / tablet -->
        <div class="hidden md:block bg-white dark:bg-gray-800 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 uppercase text-xs tracking-wide">
                <tr>
                  <th class="text-left px-6 py-3 font-semibold">Item</th>
                  <th class="text-left px-6 py-3 font-semibold">Quantity</th>
                  <th class="text-left px-6 py-3 font-semibold">Low Stock Threshold</th>
                  <th class="text-left px-6 py-3 font-semibold">Unit Cost</th>
                  <th class="text-left px-6 py-3 font-semibold">Status</th>
                  <th class="text-right px-6 py-3 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-if="isLoading">
                  <td colspan="6" class="text-center py-10 text-gray-400 dark:text-gray-500">Loading inventory...</td>
                </tr>
                <tr v-else-if="filteredItems.length === 0">
                  <td colspan="6" class="text-center py-10 text-gray-400 dark:text-gray-500">
                    {{ items.length === 0 ? 'No items yet. Click "New Item" to add one.' : 'No items match your search.' }}
                  </td>
                </tr>
                <tr v-for="i in filteredItems" :key="i.item_id" class="hover:bg-gray-50/60 dark:hover:bg-gray-700/60">
                  <td class="px-6 py-3.5 font-medium text-gray-800 dark:text-gray-100">{{ i.item_name }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ i.quantity }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">{{ i.low_stock_threshold }}</td>
                  <td class="px-6 py-3.5 text-gray-600 dark:text-gray-300">₱{{ formatCost(i.unit_cost) }}</td>
                  <td class="px-6 py-3.5 align-middle">
                    <span :class="isLow(i) ? 'text-red-700 dark:text-red-300' : 'text-emerald-700 dark:text-emerald-300'" class="inline-block align-middle text-xs font-semibold leading-5">
                      {{ isLow(i) ? 'Low Stock' : 'OK' }}
                    </span>
                  </td>
                  <td class="px-6 py-3.5">
                    <div class="flex items-center justify-end gap-2">
                      <button @click="adjustStock(i, -1)" class="w-7 h-7 flex items-center justify-center rounded-none border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700" title="Deduct 1">−</button>
                      <button @click="adjustStock(i, 1)" class="w-7 h-7 flex items-center justify-center rounded-none border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700" title="Add 1">+</button>
                      <button @click="openEditModal(i)" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" title="Edit">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button @click="confirmDelete(i)" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete">
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

      </div>
    </main>

    <!-- ============ CREATE / EDIT MODAL ============ -->
    <div v-if="showFormModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{{ editingItem ? 'Edit Item' : 'New Item' }}</h3>

        <div v-if="modalError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleSaveItem" class="space-y-4">
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Item Name</label>
            <input type="text" v-model="form.item_name" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Quantity</label>
              <input type="number" min="0" v-model.number="form.quantity" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" required />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Low Stock Threshold</label>
              <input type="number" min="0" v-model.number="form.low_stock_threshold" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
            </div>
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Unit Cost (₱ per unit)</label>
            <input type="number" min="0" step="0.01" v-model.number="form.unit_cost" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" />
            <p class="text-[11px] text-gray-400 dark:text-gray-500 mt-1">Used to compute food costing/margin per package.</p>
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeFormModal" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" :disabled="isSaving" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSaving ? 'Saving...' : (editingItem ? 'Save Changes' : 'Create Item') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ DELETE CONFIRM MODAL ============ -->
    <div v-if="itemToDelete" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Item?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-5">
          This will permanently remove <span class="font-semibold text-gray-700 dark:text-gray-200">{{ itemToDelete.item_name }}</span> from inventory.
        </p>
        <div class="flex gap-3">
          <button @click="itemToDelete = null" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button @click="handleDelete" :disabled="isDeleting" class="flex-1 bg-red-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-red-700 disabled:opacity-50">
            {{ isDeleting ? 'Deleting...' : 'Delete' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>

<script setup>
import logoUrl from '../Assets/logofinal.png'
import { ref, computed, onMounted } from 'vue'
import NotificationBell from '../Components/NotificationBell.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { useRouter } from 'vue-router'
import {
  getAllInventory,
  createInventoryItem,
  updateInventoryItem,
  adjustInventoryStock,
  deleteInventoryItem
} from '../services/inventoryService'

const router = useRouter()

const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const showAccountMenu = ref(false)
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

const emptyForm = () => ({ item_name: '', quantity: 0, low_stock_threshold: 5, unit_cost: 0 })

// Displays a unit cost as e.g. "12.50" regardless of whether it comes back
// as a number or a numeric-string from Postgres.
function formatCost(value) {
  return Number(value || 0).toFixed(2)
}
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
  form.value = { item_name: item.item_name, quantity: item.quantity, low_stock_threshold: item.low_stock_threshold, unit_cost: item.unit_cost }
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
    pageError.value = error?.message || 'Failed to delete item.'
    console.error(error)
  } finally {
    isDeleting.value = false
  }
}

function goTo(item) {
  isMobileSidebarOpen.value = false
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
  { name: 'Payment Records', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
]

// Staff (per the manuscript's Use Case Diagram) only has access to
// Login/Authentication and Manage Payments -- so their sidebar only
// shows Dashboard (general landing view) and Payments.
const staffAllowedSections = ['Dashboard', 'Payment Records']

const navItems = computed(() =>
  userRole.value === 'Staff'
    ? allNavItems.filter(item => staffAllowedSections.includes(item.name))
    : allNavItems
)
</script>

<style scoped>
</style>