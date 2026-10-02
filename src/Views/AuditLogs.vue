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
          :class="item.name === 'Audit Logs' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
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
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Audit Logs &amp; Activity</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">Who did what, and when, across your business. Records can't be edited or deleted from the app.</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <button @click="exportCsv" :disabled="!rows.length" class="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-none text-sm font-semibold transition">Export CSV</button>
            <div class="hidden lg:block"><NotificationBell /></div>
          </div>
        </div>

        <div v-if="pageError" class="mb-4 px-4 py-3 border border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-start justify-between gap-3">
          <span>{{ pageError }}</span>
          <button @click="pageError = ''" class="font-semibold">Dismiss</button>
        </div>

        <!-- Tabs -->
        <div class="flex border-b border-gray-200 dark:border-gray-700 mb-4">
          <button v-for="t in tabs" :key="t.key" @click="switchTab(t.key)"
            :class="tab === t.key ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
            class="px-4 py-2.5 text-sm border-b-2 -mb-px transition">{{ t.label }}</button>
        </div>

        <!-- Filters -->
        <div class="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
          <select v-if="tab === 'changes'" v-model="filters.table" @change="applyFilters" class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-none">
            <option value="">All records</option>
            <option v-for="(label, key) in TABLE_LABELS" :key="key" :value="key">{{ label }}</option>
          </select>
          <select v-model="filters.action" @change="applyFilters" class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-none">
            <option value="">All actions</option>
            <option v-for="a in actionOptions" :key="a.value" :value="a.value">{{ a.label }}</option>
          </select>
          <select v-model="filters.actor" @change="applyFilters" class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-none">
            <option value="">Everyone</option>
            <option v-for="a in actors" :key="a.actor_id" :value="a.actor_id">{{ a.actor_name }}{{ a.actor_role ? ' (' + a.actor_role + ')' : '' }}</option>
          </select>
          <input type="date" v-model="filters.from" @change="applyFilters" aria-label="From date" class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-none" />
          <input type="date" v-model="filters.to" @change="applyFilters" aria-label="To date" class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-none" />
          <button @click="clearFilters" class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none">Clear filters</button>
        </div>

        <!-- Table -->
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900/40 text-left text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <tr>
                <th class="px-4 py-3 font-semibold whitespace-nowrap">When</th>
                <th class="px-4 py-3 font-semibold">Who</th>
                <th class="px-4 py-3 font-semibold">Action</th>
                <th class="px-4 py-3 font-semibold">{{ tab === 'changes' ? 'Record' : 'Details' }}</th>
                <th v-if="tab === 'changes'" class="px-4 py-3 font-semibold text-right">Changes</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="isLoading"><td :colspan="5" class="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
              <tr v-else-if="!rows.length"><td :colspan="5" class="px-4 py-8 text-center text-gray-400">No activity found for these filters.</td></tr>
              <template v-else v-for="r in rows" :key="rowKey(r)">
                <tr class="text-gray-700 dark:text-gray-200 align-top">
                  <td class="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">{{ formatWhen(r.created_at) }}</td>
                  <td class="px-4 py-3">
                    <p class="font-medium">{{ r.actor_name || 'System' }}</p>
                    <p v-if="r.actor_role" class="text-xs text-gray-400">{{ r.actor_role }}</p>
                  </td>
                  <td class="px-4 py-3">
                    <span :class="badgeClass(r.action)" class="inline-block px-2 py-0.5 text-xs font-semibold">{{ actionLabel(r.action) }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <template v-if="tab === 'changes'">{{ TABLE_LABELS[r.table_name] || r.table_name }}<span v-if="r.record_id" class="text-gray-400"> #{{ r.record_id }}</span></template>
                    <template v-else>{{ r.summary || r.entity }}</template>
                  </td>
                  <td v-if="tab === 'changes'" class="px-4 py-3 text-right">
                    <button v-if="changesOf(r).length" @click="toggleRow(r.audit_id)" class="text-emerald-700 dark:text-emerald-300 font-semibold text-xs">{{ expanded === r.audit_id ? 'Hide' : 'View' }}</button>
                    <span v-else class="text-gray-300">—</span>
                  </td>
                </tr>
                <tr v-if="tab === 'changes' && expanded === r.audit_id" class="bg-gray-50 dark:bg-gray-900/40">
                  <td :colspan="5" class="px-4 py-3">
                    <ul class="space-y-1 text-xs text-gray-600 dark:text-gray-300">
                      <li v-for="c in changesOf(r)" :key="c.key">
                        <span class="font-semibold">{{ prettyKey(c.key) }}:</span>
                        <template v-if="r.action === 'UPDATE'"> <span class="line-through text-gray-400">{{ show(c.from) }}</span> → <span class="font-medium">{{ show(c.to) }}</span></template>
                        <template v-else> {{ show(c.to) }}</template>
                      </li>
                    </ul>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between mt-4 text-sm text-gray-500 dark:text-gray-400">
          <span>{{ total ? `${offset + 1}–${Math.min(offset + pageSize, total)} of ${total}` : '0 results' }}</span>
          <div class="flex gap-2">
            <button @click="prevPage" :disabled="offset === 0" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 disabled:opacity-40 rounded-none">Previous</button>
            <button @click="nextPage" :disabled="offset + pageSize >= total" class="px-3 py-1.5 border border-gray-300 dark:border-gray-600 disabled:opacity-40 rounded-none">Next</button>
          </div>
        </div>

      </div>
    </main>
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
import { useRouter } from 'vue-router'
import {
  getAuditLog, getActivityLog, getAuditActors, logActivity,
  TABLE_LABELS, ACTION_LABELS, describeChange
} from '../services/activitylogservice'

const router = useRouter()

const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const { chatUnread } = useChatUnread()
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

// ---------- state ----------
const tabs = [
  { key: 'changes', label: 'Data changes' },
  { key: 'activity', label: 'Sign-ins & exports' },
]
const tab = ref('changes')
const rows = ref([])
const total = ref(0)
const actors = ref([])
const isLoading = ref(false)
const pageError = ref('')
const expanded = ref(null)
const pageSize = 25
const offset = ref(0)
const filters = ref({ table: '', action: '', actor: '', from: '', to: '' })

const actionOptions = computed(() =>
  tab.value === 'changes'
    ? [{ value: 'INSERT', label: 'Created' }, { value: 'UPDATE', label: 'Updated' }, { value: 'DELETE', label: 'Deleted' }]
    : [{ value: 'LOGIN', label: 'Sign-in' }, { value: 'LOGOUT', label: 'Sign-out' }, { value: 'EXPORT', label: 'Export' }]
)

// ---------- helpers ----------
const ACTIVITY_LABELS = { LOGIN: 'Sign-in', LOGOUT: 'Sign-out', EXPORT: 'Export' }
const actionLabel = (a) => ACTION_LABELS[a] || ACTIVITY_LABELS[a] || a
function badgeClass(a) {
  if (a === 'INSERT' || a === 'LOGIN') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  if (a === 'DELETE') return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (a === 'UPDATE') return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}
const rowKey = (r) => (tab.value === 'changes' ? 'c' + r.audit_id : 'a' + r.log_id)
const formatWhen = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const prettyKey = (k) => k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
const show = (v) => (v === undefined || v === null || v === '' ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v))
const changesOf = (r) => describeChange(r)
const toggleRow = (id) => { expanded.value = expanded.value === id ? null : id }

function dateRange() {
  const f = filters.value
  return {
    from: f.from ? new Date(f.from + 'T00:00:00').toISOString() : null,
    to: f.to ? new Date(f.to + 'T23:59:59.999').toISOString() : null,
  }
}

// ---------- data ----------
async function load() {
  isLoading.value = true
  pageError.value = ''
  expanded.value = null
  try {
    const { from, to } = dateRange()
    const f = filters.value
    const res = tab.value === 'changes'
      ? await getAuditLog({ limit: pageSize, offset: offset.value, table: f.table, action: f.action, actor: f.actor, from, to })
      : await getActivityLog({ limit: pageSize, offset: offset.value, action: f.action, actor: f.actor, from, to })
    rows.value = res.rows
    total.value = res.total
  } catch (e) {
    rows.value = []
    total.value = 0
    pageError.value = e.message
  } finally {
    isLoading.value = false
  }
}

function applyFilters() { offset.value = 0; load() }
function clearFilters() { filters.value = { table: '', action: '', actor: '', from: '', to: '' }; applyFilters() }
function switchTab(key) { if (tab.value !== key) { tab.value = key; clearFilters() } }
function prevPage() { offset.value = Math.max(0, offset.value - pageSize); load() }
function nextPage() { offset.value += pageSize; load() }

// ---------- export ----------
function exportCsv() {
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
  const header = tab.value === 'changes'
    ? ['When', 'Who', 'Role', 'Action', 'Record', 'Record ID', 'Changes']
    : ['When', 'Who', 'Role', 'Action', 'Details']
  const lines = rows.value.map((r) => tab.value === 'changes'
    ? [formatWhen(r.created_at), r.actor_name, r.actor_role, actionLabel(r.action), TABLE_LABELS[r.table_name] || r.table_name, r.record_id,
       changesOf(r).map((c) => r.action === 'UPDATE' ? `${c.key}: ${show(c.from)} -> ${show(c.to)}` : `${c.key}: ${show(c.to)}`).join('; ')]
    : [formatWhen(r.created_at), r.actor_name, r.actor_role, actionLabel(r.action), r.summary || r.entity])
  const csv = [header, ...lines].map((l) => l.map(esc).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `audit-log-${tab.value}-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
  logActivity('EXPORT', 'Audit Logs', `Exported ${rows.value.length} ${tab.value === 'changes' ? 'data-change' : 'activity'} rows`)
}

onMounted(async () => {
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
  try { actors.value = await getAuditActors() } catch { /* filter just stays empty */ }
  load()
})

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
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Suppliers', path: '/admin/suppliers', iconPath: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
  { name: 'Waste Tracking', path: '/admin/waste', iconPath: wasteIcon },
  { name: 'Delivery & Fleet', path: '/admin/fleet', iconPath: fleetIcon },
  { name: 'Payment Records', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Branches', path: '/admin/branches', iconPath: branchIcon },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Audit Logs', path: '/admin/audit-logs', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Feedback & Ratings', path: '/admin/feedback', iconPath: 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z' },
  { name: 'Support Chat', path: '/admin/support', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' }
]

// Admin / Owner-Manager only (route + onMounted enforce this).
const navItems = computed(() => allNavItems)
</script>