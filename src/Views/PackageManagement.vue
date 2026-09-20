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
      @mouseenter="isSidebarOpen = true"
      @mouseleave="isSidebarOpen = false"
    >
      <div class="flex items-center gap-2 overflow-hidden p-4">
        <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
        <span v-if="sidebarExpanded" class="font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Caterlytics</span>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">
        <p v-if="sidebarExpanded" class="text-xs font-semibold text-gray-400 dark:text-gray-500 px-3 mb-2 uppercase tracking-wide">Menu</p>

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Catering Packages' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
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
          <div class="relative flex-1 max-w-sm">
            <svg class="w-4 h-4 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Search packages..."
              class="w-full pl-9 pr-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div class="flex items-center gap-3 flex-shrink-0">
            <div class="hidden lg:block">
              <NotificationBell />
            </div>
            <button @click="openCreateModal" class="flex items-center justify-center gap-2 bg-emerald-600 text-white px-3 py-2.5 sm:px-4 rounded-none font-semibold text-sm hover:bg-emerald-700 transition whitespace-nowrap min-w-[172px]">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              New Package
            </button>
          </div>
        </div>

        <!-- Error Banner -->
        <div v-if="pageError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ pageError }}
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 text-center py-14 text-gray-400 dark:text-gray-500">
          Loading packages...
        </div>

        <!-- Empty state -->
        <div v-else-if="filteredPackages.length === 0" class="bg-white dark:bg-gray-800 rounded-none border border-gray-100 dark:border-gray-700 text-center py-14 text-gray-400 dark:text-gray-500">
          {{ packages.length === 0 ? 'No packages yet. Click "New Package" to add one.' : 'No packages match your search.' }}
        </div>

        <!-- Package Cards -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          <div
            v-for="pkg in filteredPackages"
            :key="pkg.package_id"
            class="bg-white dark:bg-gray-800 rounded-none shadow-sm border border-gray-100 dark:border-gray-700 p-5 flex flex-col hover:border-emerald-200 dark:hover:border-emerald-700 transition"
          >
            <div class="flex items-start justify-between mb-2">
              <div class="w-10 h-10 rounded-none bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div class="flex items-center gap-1">
                <button @click="openIngredientsModal(pkg)" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/30" title="Manage ingredients">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4" />
                  </svg>
                </button>
                <button @click="openEditModal(pkg)" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30" title="Edit package">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
                <button @click="confirmDelete(pkg)" class="p-1.5 rounded-none text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30" title="Delete package">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            <h3 class="font-bold text-gray-900 dark:text-gray-100">{{ pkg.package_name }}</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 flex-1 whitespace-pre-line">{{ pkg.description || 'No description provided.' }}</p>

            <div class="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-baseline gap-1">
              <span class="text-xl font-black text-emerald-600 dark:text-emerald-400">₱{{ formatPrice(pkg.price_per_head) }}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500 font-medium">/ head</span>
            </div>
            <div class="mt-2 flex items-center justify-between text-xs">
              <span class="text-gray-400 dark:text-gray-500">Cost: ₱{{ formatPrice(pkg.cost_per_head) }} / head</span>
              <span
                v-if="pkg.margin_percent !== null"
                :class="pkg.margin_percent >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'"
                class="font-semibold"
              >
                {{ pkg.margin_percent >= 0 ? '+' : '' }}{{ pkg.margin_percent }}% margin
              </span>
            </div>
          </div>
        </div>

      </div>
    </main>

    <!-- ============ MANAGE INGREDIENTS MODAL ============ -->
    <div v-if="showIngredientsModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">Ingredients — {{ ingredientsPackage?.package_name }}</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1 mb-4">
          Set how much of each inventory item this package uses <span class="font-semibold">per guest</span>. Stock is auto-deducted using this once a booking is confirmed.
        </p>

        <div v-if="ingredientsError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ ingredientsError }}
        </div>

        <div v-if="isLoadingIngredients" class="text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
          Loading ingredients...
        </div>

        <div v-else class="space-y-3">
          <div v-if="inventoryItems.length === 0" class="text-sm text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-none p-4 text-center">
            No inventory items yet. Add stock items in the Inventory page first.
          </div>

          <div v-for="(row, index) in ingredientRows" :key="row.key" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              v-model.number="row.item_id"
              class="w-full sm:flex-1 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
            >
              <option :value="null" disabled>Select item...</option>
              <option v-for="item in inventoryItems" :key="item.item_id" :value="item.item_id">
                {{ item.item_name }}
              </option>
            </select>
            <div class="flex items-center gap-2">
              <input
                type="number"
                min="0"
                step="0.01"
                v-model.number="row.quantity_per_guest"
                placeholder="Qty / guest"
                class="flex-1 sm:w-32 p-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-none text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
              />
              <button type="button" @click="removeIngredientRow(index)" class="p-2.5 sm:p-2 rounded-none text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 flex-shrink-0" title="Remove">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <button
            type="button"
            @click="addIngredientRow"
            :disabled="inventoryItems.length === 0"
            class="w-full flex items-center justify-center gap-2 border border-dashed border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 py-2.5 rounded-none text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Ingredient
          </button>
        </div>

        <div class="flex gap-3 pt-6">
          <button type="button" @click="closeIngredientsModal" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
            Cancel
          </button>
          <button type="button" @click="handleSaveIngredients" :disabled="isSavingIngredients" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
            {{ isSavingIngredients ? 'Saving...' : 'Save Ingredients' }}
          </button>
        </div>
      </div>
    </div>

    <!-- ============ CREATE / EDIT PACKAGE MODAL ============ -->
    <div v-if="showFormModal" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-md p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{{ isEditing ? 'Edit Package' : 'New Package' }}</h3>

        <div v-if="modalError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-4">
          {{ modalError }}
        </div>

        <form @submit.prevent="handleSavePackage" class="space-y-4">
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Package Name</label>
            <input type="text" v-model="form.package_name" placeholder="e.g. Silver Package" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Description</label>
            <textarea v-model="form.description" rows="3" placeholder="What's included in this package..." class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-gray-900 dark:text-gray-100"></textarea>
          </div>
          <div>
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Price per Head (₱)</label>
            <input type="number" min="0" step="0.01" v-model.number="form.price_per_head" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100" required />
          </div>

          <div class="flex gap-3 pt-2">
            <button type="button" @click="closeFormModal" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
              Cancel
            </button>
            <button type="submit" :disabled="isSaving" class="flex-1 bg-emerald-600 text-white py-2.5 rounded-none font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSaving ? 'Saving...' : (isEditing ? 'Save Changes' : 'Create Package') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============ DELETE CONFIRM MODAL ============ -->
    <div v-if="packageToDelete" class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-none shadow-xl w-full max-w-sm p-6">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-2">Delete Package?</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-2">
          This will permanently remove <span class="font-semibold text-gray-700 dark:text-gray-200">{{ packageToDelete.package_name }}</span>.
        </p>
        <div v-if="deleteError" class="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium p-3 rounded-none mb-3">
          {{ deleteError }}
        </div>
        <div class="flex gap-3 mt-3">
          <button @click="packageToDelete = null" class="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-none font-semibold text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
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
  getAllPackages,
  createPackage,
  updatePackage,
  deletePackage,
  getPackageIngredients,
  setPackageIngredients,
  getAllPackageCosting
} from '../services/packageService'
import { getAllInventory } from '../services/inventoryService'

const router = useRouter()

const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const showAccountMenu = ref(false)
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

const showIngredientsModal = ref(false)
const ingredientsPackage = ref(null)
const inventoryItems = ref([])
const ingredientRows = ref([])
const isLoadingIngredients = ref(false)
const isSavingIngredients = ref(false)
const ingredientsError = ref('')
let ingredientRowKey = 0

const emptyForm = () => ({
  package_name: '',
  description: '',
  price_per_head: null
})
const form = ref(emptyForm())

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
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
    const [pkgs, costing] = await Promise.all([getAllPackages(), getAllPackageCosting()])
    const costingById = new Map(costing.map((c) => [c.package_id, c]))
    packages.value = pkgs.map((p) => ({
      ...p,
      cost_per_head: costingById.get(p.package_id)?.cost_per_head ?? 0,
      margin_per_head: costingById.get(p.package_id)?.margin_per_head ?? p.price_per_head,
      margin_percent: costingById.get(p.package_id)?.margin_percent ?? null
    }))
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

async function openIngredientsModal(pkg) {
  ingredientsPackage.value = pkg
  ingredientsError.value = ''
  showIngredientsModal.value = true
  isLoadingIngredients.value = true

  try {
    const [items, currentIngredients] = await Promise.all([
      getAllInventory(),
      getPackageIngredients(pkg.package_id)
    ])
    inventoryItems.value = items
    ingredientRows.value = currentIngredients.map((ing) => ({
      key: ingredientRowKey++,
      item_id: ing.item_id,
      quantity_per_guest: ing.quantity_per_guest
    }))
  } catch (error) {
    ingredientsError.value = 'Failed to load ingredients. Please try again.'
    console.error(error)
  } finally {
    isLoadingIngredients.value = false
  }
}

function closeIngredientsModal() {
  showIngredientsModal.value = false
  ingredientsPackage.value = null
  ingredientRows.value = []
}

function addIngredientRow() {
  ingredientRows.value.push({ key: ingredientRowKey++, item_id: null, quantity_per_guest: null })
}

function removeIngredientRow(index) {
  ingredientRows.value.splice(index, 1)
}

async function handleSaveIngredients() {
  ingredientsError.value = ''

  const incomplete = ingredientRows.value.some(
    (row) => row.item_id && (!row.quantity_per_guest || row.quantity_per_guest <= 0)
  )
  if (incomplete) {
    ingredientsError.value = 'Each selected item needs a quantity per guest greater than 0.'
    return
  }

  isSavingIngredients.value = true
  try {
    await setPackageIngredients(
      ingredientsPackage.value.package_id,
      ingredientRows.value.map((row) => ({ item_id: row.item_id, quantity_per_guest: row.quantity_per_guest }))
    )
    showIngredientsModal.value = false
  } catch (error) {
    ingredientsError.value = 'Failed to save ingredients. Please try again.'
    console.error(error)
  } finally {
    isSavingIngredients.value = false
  }
}

function goTo(item) {
  isMobileSidebarOpen.value = false
  router.push(item.path)
}

const handleLogout = () => {
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
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