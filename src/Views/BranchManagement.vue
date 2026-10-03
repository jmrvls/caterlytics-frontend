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
      <div class="flex items-center justify-between gap-2 p-4">
        <!-- COLLAPSED: logo itself is the toggle -->
        <div
          v-if="!sidebarExpanded"
          class="relative flex items-center justify-center w-8 h-8 cursor-pointer select-none rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @mouseenter="isLogoHovered = true"
          @mouseleave="isLogoHovered = false"
          @click="toggleSidebar"
        >
          <img v-if="!isLogoHovered" :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <svg v-else class="w-6 h-6 flex-shrink-0 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke-width="1.5" />
            <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" stroke-width="1.5" />
          </svg>

          <div v-if="isLogoHovered" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg z-[60] pointer-events-none">
            Open sidebar
          </div>
        </div>

        <!-- EXPANDED: static logo + name on the left -->
        <div v-else class="flex items-center gap-2 overflow-hidden">
          <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <span class="font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Caterlytics</span>
        </div>

        <!-- EXPANDED: dedicated toggle button on the right, like Gemini's collapse icon -->
        <div v-if="sidebarExpanded" class="relative flex-shrink-0">
          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-none text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            @mouseenter="isLogoHovered = true"
            @mouseleave="isLogoHovered = false"
            @click="toggleSidebar"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke-width="1.5" />
              <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" stroke-width="1.5" />
            </svg>
          </button>

          <div v-if="isLogoHovered" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg z-[60] pointer-events-none">
            Close sidebar
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Branches' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          class="relative flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          <span v-if="sidebarExpanded" class="whitespace-nowrap">{{ item.name }}</span>
          <span
            v-if="item.name === 'Support Chat' && chatUnread"
            :class="sidebarExpanded ? 'ml-auto min-w-[20px] h-5 px-1.5' : 'absolute top-1 right-1 min-w-[16px] h-4 px-1'"
            class="rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow"
          >{{ chatUnread > 99 ? '99+' : chatUnread }}</span>
          <span
            v-if="item.name === 'Feedback & Ratings' && reviewPending"
            :class="sidebarExpanded ? 'ml-auto min-w-[20px] h-5 px-1.5' : 'absolute top-1 right-1 min-w-[16px] h-4 px-1'"
            class="rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow"
          >{{ reviewPending > 99 ? '99+' : reviewPending }}</span>
        </a>
      </nav>

      <div class="border-t border-gray-200 dark:border-gray-700 p-3 relative">
        <!-- Click-outside backdrop -->
        <div v-if="showAccountMenu" @click="showAccountMenu = false" class="fixed inset-0 z-40"></div>

        <!-- Account menu (Log Out) -->
        <div v-if="showAccountMenu" class="absolute bottom-full left-2 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none shadow-lg overflow-hidden z-50">
          <button v-if="userRole === 'Admin' || userRole === 'Owner/Manager'" @click="showAccountMenu = false; router.push('/settings')" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
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
            <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="Profile picture" class="w-full h-full object-cover" />
            <span v-else>{{ userInitial }}</span>
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

        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Branches</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Manage every catering outlet under your business. New bookings go to the main branch unless a branch is chosen.</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <button @click="openCreate" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-sm font-semibold transition">Add branch</button>
            <div class="hidden lg:block"><NotificationBell /></div>
          </div>
        </div>

        <div v-if="successMessage" class="mb-4 px-4 py-3 border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/30 dark:border-emerald-800 text-sm text-emerald-700 dark:text-emerald-300">{{ successMessage }}</div>
        <div v-if="pageError" class="mb-4 px-4 py-3 border border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-start justify-between gap-3">
          <span>{{ pageError }}</span>
          <button @click="pageError = ''" class="font-semibold">Dismiss</button>
        </div>

        <!-- Totals across all branches -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-px bg-gray-200 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 mb-6">
          <div v-for="t in totals" :key="t.label" class="bg-white dark:bg-gray-800 px-4 py-3">
            <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ t.value }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ t.label }}</p>
          </div>
        </div>

        <div v-if="isLoading" class="text-sm text-gray-500 dark:text-gray-400 py-10 text-center">Loading branches...</div>

        <div v-else-if="!branches.length" class="border border-dashed border-gray-300 dark:border-gray-600 py-12 text-center">
          <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">No branches found for this business.</p>
          <button @click="openCreate" class="px-4 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-none">Add your first branch</button>
        </div>

        <div v-else class="space-y-3">
          <div v-for="b in branches" :key="b.branch_id"
            :class="b.is_active ? '' : 'opacity-70'"
            class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <div class="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div class="min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">{{ b.branch_name }}</h2>
                  <span v-if="b.is_main" class="px-2 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300">Main branch</span>
                  <span v-if="!b.is_active" class="px-2 py-0.5 text-xs font-semibold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300">Inactive</span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">{{ b.address || 'No address yet' }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ [b.contact_number, b.contact_email].filter(Boolean).join('  |  ') || 'No contact details' }}
                </p>
              </div>

              <div class="flex items-center gap-2 flex-wrap lg:justify-end">
                <button @click="openEdit(b)" class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none">Edit</button>
                <button v-if="!b.is_main && b.is_active" :disabled="busyId === b.branch_id" @click="makeMain(b)" class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none disabled:opacity-40">Make main</button>
                <button v-if="!b.is_main" :disabled="busyId === b.branch_id" @click="toggleActive(b)" class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none disabled:opacity-40">{{ b.is_active ? 'Deactivate' : 'Activate' }}</button>
                <button v-if="!b.is_main" :disabled="busyId === b.branch_id" @click="confirmDelete = b" class="px-3 py-2 border border-red-200 dark:border-red-800 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-none disabled:opacity-40">Delete</button>
              </div>
            </div>

            <dl class="grid grid-cols-3 sm:grid-cols-6 gap-3 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <div v-for="s in stats(b)" :key="s.label">
                <dt class="text-xs text-gray-500 dark:text-gray-400">{{ s.label }}</dt>
                <dd class="text-lg font-semibold text-gray-800 dark:text-gray-100">{{ s.value }}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </main>

    <!-- ADD / EDIT MODAL -->
    <div v-if="showForm" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" @click="closeForm"></div>
      <form @submit.prevent="saveBranch" class="relative w-full max-w-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ editingId ? 'Edit branch' : 'Add branch' }}</h2>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="b-name">Branch name</label>
          <input id="b-name" v-model="form.branch_name" required maxlength="100" placeholder="e.g. Quezon City Kitchen" class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="b-addr">Address</label>
          <textarea id="b-addr" v-model="form.address" rows="2" class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
        </div>
        <div class="grid sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="b-phone">Contact number</label>
            <input id="b-phone" v-model="form.contact_number" inputmode="tel" class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="b-mail">Contact email</label>
            <input id="b-mail" v-model="form.contact_email" type="email" class="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-800 dark:text-gray-100 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          </div>
        </div>
        <p v-if="formError" class="text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
        <div class="flex justify-end gap-2 pt-2">
          <button type="button" @click="closeForm" class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-none">Cancel</button>
          <button type="submit" :disabled="isSaving" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold rounded-none">{{ isSaving ? 'Saving...' : 'Save branch' }}</button>
        </div>
      </form>
    </div>

    <!-- DELETE CONFIRM -->
    <div v-if="confirmDelete" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" @click="confirmDelete = null"></div>
      <div class="relative w-full max-w-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <h2 class="text-lg font-bold text-gray-800 dark:text-gray-100">Delete {{ confirmDelete.branch_name }}?</h2>
        <p class="text-sm text-gray-600 dark:text-gray-300">This cannot be undone. A branch that already has bookings, staff, inventory or expenses can only be deactivated.</p>
        <div class="flex justify-end gap-2">
          <button @click="confirmDelete = null" class="px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 rounded-none">Cancel</button>
          <button @click="removeBranch" class="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-none">Delete branch</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { logoutUser } from '../services/authService'
import { resetNotifications } from '../composables/useNotifications'
import logoUrl from '../Assets/logofinal.png'
import { ref, computed, onMounted } from 'vue'
import NotificationBell from '../Components/NotificationBell.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { useChatUnread } from '../composables/useChatUnread'
import { useReviewAlerts } from '../composables/useReviewAlerts'
import { useRouter } from 'vue-router'
import {
  getBranchOverview, createBranch, updateBranch, setBranchActive, setMainBranch, deleteBranch
} from '../services/branchservice'

const router = useRouter()

const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const { chatUnread } = useChatUnread()
const { reviewPending } = useReviewAlerts()
const isLogoHovered = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
  isLogoHovered.value = false
}
const showAccountMenu = ref(false)
const userName = ref('User')
const userRole = ref('Admin')
const userInitial = ref('U')
const userAvatarUrl = ref('')
const businessId = ref(null)

// ---------- state ----------
const branches = ref([])
const isLoading = ref(false)
const isSaving = ref(false)
const pageError = ref('')
const successMessage = ref('')
const busyId = ref(null)

const showForm = ref(false)
const editingId = ref(null)
const formError = ref('')
const form = ref({ branch_name: '', address: '', contact_number: '', contact_email: '' })
const confirmDelete = ref(null)

let msgTimer = null
function flash(msg) {
  successMessage.value = msg
  clearTimeout(msgTimer)
  msgTimer = setTimeout(() => { successMessage.value = '' }, 4000)
}

// ---------- derived ----------
const totals = computed(() => {
  const list = branches.value
  const sum = (k) => list.reduce((n, b) => n + Number(b[k] || 0), 0)
  return [
    { label: 'Branches', value: list.length },
    { label: 'Active branches', value: list.filter((b) => b.is_active).length },
    { label: 'Upcoming bookings', value: sum('upcoming_count') },
    { label: 'Staff across branches', value: sum('staff_count') },
  ]
})

function stats(b) {
  return [
    { label: 'Staff', value: b.staff_count },
    { label: 'Bookings', value: b.booking_count },
    { label: 'Upcoming', value: b.upcoming_count },
    { label: 'Inventory items', value: b.inventory_count },
    { label: 'Expenses', value: b.expense_count },
    { label: 'Waste logs', value: b.waste_count },
  ]
}

// ---------- data ----------
async function loadBranches() {
  isLoading.value = true
  try {
    branches.value = await getBranchOverview()
  } catch (e) {
    pageError.value = e.message
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  if (!['Admin', 'Owner/Manager'].includes(user.role)) {
    router.push('/')
    return
  }
  const displayName = user.full_name || user.username || 'User'
  userName.value = displayName
  userRole.value = user.role
  userInitial.value = displayName.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || ''
  businessId.value = user.business_id || null
  loadBranches()
})

// ---------- form ----------
function openCreate() {
  editingId.value = null
  form.value = { branch_name: '', address: '', contact_number: '', contact_email: '' }
  formError.value = ''
  showForm.value = true
}

function openEdit(b) {
  editingId.value = b.branch_id
  form.value = {
    branch_name: b.branch_name || '',
    address: b.address || '',
    contact_number: b.contact_number || '',
    contact_email: b.contact_email || '',
  }
  formError.value = ''
  showForm.value = true
}

function closeForm() {
  showForm.value = false
}

async function saveBranch() {
  formError.value = ''
  if (!form.value.branch_name.trim()) {
    formError.value = 'Enter a branch name.'
    return
  }
  isSaving.value = true
  try {
    if (editingId.value) {
      await updateBranch(editingId.value, form.value)
      flash('Branch updated.')
    } else {
      await createBranch(businessId.value, form.value)
      flash('Branch added.')
    }
    showForm.value = false
    await loadBranches()
  } catch (e) {
    formError.value = e.message
  } finally {
    isSaving.value = false
  }
}

// ---------- row actions ----------
async function runAction(b, fn, okMsg) {
  busyId.value = b.branch_id
  pageError.value = ''
  try {
    await fn()
    flash(okMsg)
    await loadBranches()
  } catch (e) {
    pageError.value = e.message
  } finally {
    busyId.value = null
  }
}

function makeMain(b) {
  return runAction(b, () => setMainBranch(b.branch_id), `${b.branch_name} is now the main branch.`)
}

function toggleActive(b) {
  const next = !b.is_active
  return runAction(b, () => setBranchActive(b.branch_id, next), next ? 'Branch activated.' : 'Branch deactivated.')
}

async function removeBranch() {
  const b = confirmDelete.value
  confirmDelete.value = null
  if (b) await runAction(b, () => deleteBranch(b.branch_id), 'Branch deleted.')
}

// ---------- sidebar ----------
function goTo(item) {
  isMobileSidebarOpen.value = false
  router.push(item.path)
}

const handleLogout = async () => {
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

const wasteIcon = 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
const fleetIcon = 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'

const branchIcon = 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01'

const allNavItems = [
  { name: 'Dashboard', path: '/admin/dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', path: '/admin/bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Event Planning', path: '/admin/planning', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { name: 'Catering Packages', path: '/admin/packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Pricing & Discounts', path: '/admin/pricing', iconPath: 'M9.568 3H5.25A2.25 2.25 0 003 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 005.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 009.568 3zM6 6h.008v.008H6V6z' },
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Suppliers', path: '/admin/suppliers', iconPath: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
  { name: 'Waste Tracking', path: '/admin/waste', iconPath: wasteIcon },
  { name: 'Delivery & Fleet', path: '/admin/fleet', iconPath: fleetIcon },
  { name: 'Payment Records', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Branches', path: '/admin/branches', iconPath: branchIcon },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Legal Documents', path: '/admin/legal-documents', iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { name: 'Audit Logs', path: '/admin/audit-logs', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Feedback & Ratings', path: '/admin/feedback', iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'Support Chat', path: '/admin/support', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]

// Admin / Owner-Manager only (route + onMounted enforce this).
const navItems = computed(() => allNavItems)
</script>