<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans">

    <!-- TOP BAR (same look as the Super Admin dashboard) -->
    <header class="bg-gray-900 dark:bg-black border-b border-gray-800 sticky top-0 z-30" style="padding-top: env(safe-area-inset-top)">
      <div class="w-full px-3 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-2 sm:gap-4">
        <div class="flex items-center gap-3 min-w-0">
          <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <div class="min-w-0">
            <p class="font-bold text-white leading-tight truncate">Caterlytics</p>
            <p class="text-[10px] sm:text-[11px] text-indigo-300 leading-tight tracking-wide uppercase truncate">Super Admin<span class="hidden sm:inline"> &middot; Platform Audit Log</span></p>
          </div>
        </div>
        <div class="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          <button @click="router.push('/super-admin/dashboard')" class="flex items-center gap-2 p-2.5 sm:px-3 sm:py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg>
            <span class="hidden sm:inline">Dashboard</span>
          </button>
          <span class="hidden sm:inline text-sm text-gray-400">{{ userName }}</span>
          <button @click="handleLogout" class="flex items-center gap-2 p-2.5 sm:px-3 sm:py-2 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/10 transition" aria-label="Log Out">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            <span class="hidden sm:inline">Log Out</span>
          </button>
        </div>
      </div>
    </header>

    <main class="w-full px-3 sm:px-6 lg:px-8 py-5 sm:py-8">

      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div class="min-w-0">
          <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Platform Audit Log</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400">Everything that happens across all tenants. Read-only: records can't be edited or deleted from the app.</p>
        </div>
        <button @click="exportCsv" :disabled="!rows.length || isExporting" class="min-h-[44px] sm:min-h-0 px-4 py-2.5 bg-gray-900 dark:bg-white dark:text-gray-900 hover:bg-gray-700 disabled:opacity-50 text-white rounded-none text-sm font-semibold">
          {{ isExporting ? 'Exporting…' : 'Export CSV' }}
        </button>
      </div>

      <div v-if="pageError" class="mb-4 px-4 py-3 border border-red-200 bg-red-50 dark:bg-red-900/30 dark:border-red-800 text-sm text-red-700 dark:text-red-300 flex items-start justify-between gap-3">
        <span>{{ pageError }}</span>
        <button @click="pageError = ''" class="font-semibold">Dismiss</button>
      </div>

      <!-- Source tabs -->
      <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto no-scrollbar">
        <button v-for="t in tabs" :key="t.key" type="button" @click="switchTab(t.key)"
          :class="tab === t.key ? 'border-gray-900 dark:border-white text-gray-900 dark:text-white' : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'"
          class="px-4 py-3 sm:py-2.5 text-sm font-bold border-b-2 -mb-px transition whitespace-nowrap">{{ t.label }}</button>
      </div>

      <!-- Filters -->
      <div class="grid grid-cols-2 lg:grid-cols-6 gap-3 mb-4">
        <input v-model="filters.search" @input="onSearchInput" type="search" placeholder="Search name, record, details…" aria-label="Search"
          :class="inputCls" class="col-span-2" />
        <select v-model="filters.business" @change="applyFilters" aria-label="Tenant" :class="inputCls" class="col-span-2 lg:col-span-1">
          <option value="">All tenants</option>
          <option v-for="b in businesses" :key="b.business_id" :value="b.business_id">{{ b.business_name }}</option>
        </select>
        <select v-model="filters.action" @change="applyFilters" aria-label="Action" :class="inputCls" class="col-span-2 lg:col-span-1">
          <option value="">All actions</option>
          <option v-for="a in actionOptions" :key="a.value" :value="a.value">{{ a.label }}</option>
        </select>
        <select v-if="tab !== 'activity'" v-model="filters.table" @change="applyFilters" aria-label="Record type" :class="inputCls" class="col-span-2 lg:col-span-1">
          <option value="">All records</option>
          <option v-for="(label, key) in TABLE_LABELS" :key="key" :value="key">{{ label }}</option>
        </select>
        <input type="date" v-model="filters.from" @change="applyFilters" aria-label="From date" :class="inputCls" />
        <input type="date" v-model="filters.to" @change="applyFilters" aria-label="To date" :class="inputCls" />
        <button @click="clearFilters" class="col-span-2 lg:col-span-1 min-h-[44px] sm:min-h-0 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-none">Clear filters</button>
      </div>

      <!-- MOBILE: cards -->
      <div class="md:hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
        <p v-if="isLoading" class="px-4 py-8 text-center text-sm text-gray-400">Loading…</p>
        <p v-else-if="!rows.length" class="px-4 py-8 text-center text-sm text-gray-400">No activity found for these filters.</p>
        <div v-else v-for="r in rows" :key="rowKey(r)" class="p-4 text-gray-700 dark:text-gray-200">
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="font-semibold text-sm break-words">{{ r.actor_name || 'System' }}<span v-if="r.actor_role" class="font-normal text-xs text-gray-400"> · {{ r.actor_role }}</span></p>
              <p class="text-xs text-indigo-600 dark:text-indigo-300 mt-0.5 break-words">{{ r.business_name || 'Platform' }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatWhen(r.created_at) }}</p>
            </div>
            <span :class="badgeClass(r.action)" class="inline-block flex-shrink-0 px-2 py-0.5 text-xs font-semibold">{{ actionLabel(r.action) }}</span>
          </div>
          <p class="text-sm mt-2 break-words">{{ subjectOf(r) }}</p>
          <template v-if="changesOf(r).length">
            <button @click="toggleRow(rowKey(r))" class="mt-2 min-h-[44px] -mb-2 text-indigo-600 dark:text-indigo-300 font-semibold text-sm">{{ expanded === rowKey(r) ? 'Hide changes' : 'View changes' }}</button>
            <ul v-if="expanded === rowKey(r)" class="mt-3 space-y-2 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900/40 p-3">
              <li v-for="c in changesOf(r)" :key="c.key" class="break-words">
                <span class="font-semibold">{{ prettyKey(c.key) }}:</span>
                <template v-if="r.action === 'UPDATE'"> <span class="line-through text-gray-400">{{ show(c.from) }}</span> → <span class="font-medium">{{ show(c.to) }}</span></template>
                <template v-else> {{ show(c.to) }}</template>
              </li>
            </ul>
          </template>
        </div>
      </div>

      <!-- DESKTOP: table -->
      <div class="hidden md:block bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table class="w-full text-sm">
          <thead class="bg-gray-50 dark:bg-gray-900/40 text-left text-xs text-gray-500 dark:text-gray-400">
            <tr>
              <th class="px-4 py-3 font-semibold whitespace-nowrap">When</th>
              <th class="px-4 py-3 font-semibold">Tenant</th>
              <th class="px-4 py-3 font-semibold">Who</th>
              <th class="px-4 py-3 font-semibold">Action</th>
              <th class="px-4 py-3 font-semibold">Record / details</th>
              <th class="px-4 py-3 font-semibold text-right">Changes</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
            <tr v-if="isLoading"><td colspan="6" class="px-4 py-8 text-center text-gray-400">Loading…</td></tr>
            <tr v-else-if="!rows.length"><td colspan="6" class="px-4 py-8 text-center text-gray-400">No activity found for these filters.</td></tr>
            <template v-else v-for="r in rows" :key="rowKey(r)">
              <tr class="text-gray-700 dark:text-gray-200 align-top">
                <td class="px-4 py-3 whitespace-nowrap text-gray-500 dark:text-gray-400">{{ formatWhen(r.created_at) }}</td>
                <td class="px-4 py-3 font-medium">{{ r.business_name || 'Platform' }}</td>
                <td class="px-4 py-3">
                  <p class="font-medium">{{ r.actor_name || 'System' }}</p>
                  <p v-if="r.actor_role" class="text-xs text-gray-400">{{ r.actor_role }}</p>
                </td>
                <td class="px-4 py-3"><span :class="badgeClass(r.action)" class="inline-block px-2 py-0.5 text-xs font-semibold">{{ actionLabel(r.action) }}</span></td>
                <td class="px-4 py-3 break-words max-w-xs">{{ subjectOf(r) }}</td>
                <td class="px-4 py-3 text-right">
                  <button v-if="changesOf(r).length" @click="toggleRow(rowKey(r))" class="text-indigo-600 dark:text-indigo-300 font-semibold text-xs">{{ expanded === rowKey(r) ? 'Hide' : 'View' }}</button>
                  <span v-else class="text-gray-300">—</span>
                </td>
              </tr>
              <tr v-if="expanded === rowKey(r)" class="bg-gray-50 dark:bg-gray-900/40">
                <td colspan="6" class="px-4 py-3">
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
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mt-4 text-sm text-gray-500 dark:text-gray-400">
        <span class="text-center sm:text-left">{{ total ? `${offset + 1}–${Math.min(offset + pageSize, total)} of ${total}` : '0 results' }}</span>
        <div class="grid grid-cols-2 sm:flex gap-2">
          <button @click="prevPage" :disabled="isLoading || offset === 0" class="min-h-[44px] sm:min-h-0 px-3 py-1.5 border border-gray-300 dark:border-gray-600 disabled:opacity-40 rounded-none">Previous</button>
          <button @click="nextPage" :disabled="isLoading || offset + pageSize >= total" class="min-h-[44px] sm:min-h-0 px-3 py-1.5 border border-gray-300 dark:border-gray-600 disabled:opacity-40 rounded-none">Next</button>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import logoUrl from '../Assets/logofinal.png'
import { logoutUser } from '../services/authService'
import { resetNotifications } from '../composables/useNotifications'
import { getPlatformAuditLog, getPlatformBusinesses } from '../services/superAdminService'
import { logActivity, TABLE_LABELS, ACTION_LABELS, describeChange } from '../services/activitylogservice'

const router = useRouter()
const userName = ref('')

const inputCls = 'w-full min-h-[44px] sm:min-h-0 px-3 py-2 text-base sm:text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-none'

// ---------- state ----------
const tabs = [
  { key: 'all', label: 'All activity' },
  { key: 'changes', label: 'Data changes' },
  { key: 'activity', label: 'Sign-ins & exports' },
]
const SOURCE_BY_TAB = { all: null, changes: 'changes', activity: 'activity' }
const tab = ref('all')
const rows = ref([])
const total = ref(0)
const businesses = ref([])
const isLoading = ref(true)
const pageError = ref('')
const expanded = ref(null)
const pageSize = 25
const offset = ref(0)
const blankFilters = () => ({ search: '', business: '', action: '', table: '', from: '', to: '' })
const filters = ref(blankFilters())

const actionOptions = computed(() => {
  const changes = [{ value: 'INSERT', label: 'Created' }, { value: 'UPDATE', label: 'Updated' }, { value: 'DELETE', label: 'Deleted' }]
  const activity = [{ value: 'LOGIN', label: 'Sign-in' }, { value: 'LOGOUT', label: 'Sign-out' }, { value: 'EXPORT', label: 'Export' }]
  if (tab.value === 'changes') return changes
  if (tab.value === 'activity') return activity
  return [...changes, ...activity]
})

// ---------- helpers ----------
const ACTIVITY_LABELS = { LOGIN: 'Sign-in', LOGOUT: 'Sign-out', EXPORT: 'Export' }
const actionLabel = (a) => ACTION_LABELS[a] || ACTIVITY_LABELS[a] || a
function badgeClass(a) {
  if (a === 'INSERT' || a === 'LOGIN') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
  if (a === 'DELETE') return 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300'
  if (a === 'UPDATE') return 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
  return 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
}
const rowKey = (r) => `${r.source}:${r.log_id}`
const formatWhen = (iso) => new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
const prettyKey = (k) => k.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase())
const ISO_TS = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/
const show = (v) => {
  if (v === undefined || v === null || v === '') return '—'
  if (typeof v === 'boolean') return v ? 'Yes' : 'No'
  if (typeof v === 'object') return JSON.stringify(v)
  if (typeof v === 'string' && ISO_TS.test(v) && !isNaN(new Date(v))) return formatWhen(v)
  return String(v)
}
const subjectOf = (r) => r.source === 'changes'
  ? `${TABLE_LABELS[r.table_name] || r.table_name}${r.record_id ? ' #' + r.record_id : ''}`
  : (r.summary || '—')
const changesOf = (r) => (r.source === 'changes' ? describeChange(r) : [])
const toggleRow = (id) => { expanded.value = expanded.value === id ? null : id }

function dateRange() {
  const f = filters.value
  return {
    from: f.from ? new Date(f.from + 'T00:00:00').toISOString() : null,
    to: f.to ? new Date(f.to + 'T23:59:59.999').toISOString() : null,
  }
}
const queryFor = (limit, off) => {
  const f = filters.value
  const { from, to } = dateRange()
  return {
    limit, offset: off, source: SOURCE_BY_TAB[tab.value], business: f.business,
    action: f.action, table: tab.value === 'activity' ? null : f.table, search: f.search, from, to,
  }
}

// ---------- data ----------
let loadSeq = 0          // only the newest request may touch the page
let lastGoodOffset = 0

async function load() {
  const seq = ++loadSeq
  const { from, to } = dateRange()
  if (from && to && from > to) {
    pageError.value = 'The "From" date is later than the "To" date.'
    rows.value = []; total.value = 0; isLoading.value = false
    return
  }
  isLoading.value = true
  pageError.value = ''
  expanded.value = null
  try {
    const res = await getPlatformAuditLog(queryFor(pageSize, offset.value))
    if (seq !== loadSeq) return
    rows.value = res.rows
    total.value = res.total
    lastGoodOffset = offset.value
  } catch (e) {
    if (seq !== loadSeq) return
    rows.value = []; total.value = 0
    offset.value = lastGoodOffset
    pageError.value = e.message
  } finally {
    if (seq === loadSeq) isLoading.value = false
  }
}

function applyFilters() { offset.value = 0; load() }
let searchTimer = null
function onSearchInput() { clearTimeout(searchTimer); searchTimer = setTimeout(applyFilters, 350) }
function clearFilters() { filters.value = blankFilters(); applyFilters() }
function switchTab(key) {
  if (tab.value === key) return
  tab.value = key
  rows.value = []; total.value = 0; lastGoodOffset = 0
  // keep tenant/search/dates; drop filters that don't apply to the new tab
  filters.value.action = ''
  filters.value.table = ''
  applyFilters()
}
function prevPage() { if (isLoading.value) return; offset.value = Math.max(0, offset.value - pageSize); load() }
function nextPage() { if (isLoading.value) return; offset.value += pageSize; load() }

// ---------- export ----------
const isExporting = ref(false)
const EXPORT_CHUNK = 200
const EXPORT_MAX = 5000

async function exportCsv() {
  if (isExporting.value) return
  isExporting.value = true
  try {
    const all = []
    let off = 0
    let grand = Infinity
    while (all.length < Math.min(grand, EXPORT_MAX)) {
      const res = await getPlatformAuditLog(queryFor(EXPORT_CHUNK, off))
      if (!res.rows.length) break
      all.push(...res.rows)
      off += res.rows.length
      grand = res.total
    }
    const data = all.slice(0, EXPORT_MAX)
    // Quote everything and stop Excel from running cells that start with = + - @ as formulas.
    const esc = (v) => {
      let t = String(v ?? '')
      if (/^[=+\-@\t\r]/.test(t)) t = "'" + t
      return `"${t.replace(/"/g, '""')}"`
    }
    const header = ['When', 'Tenant', 'Who', 'Role', 'Action', 'Record / details', 'Changes']
    const lines = data.map((r) => [
      formatWhen(r.created_at), r.business_name || 'Platform', r.actor_name, r.actor_role, actionLabel(r.action), subjectOf(r),
      changesOf(r).map((c) => r.action === 'UPDATE' ? `${c.key}: ${show(c.from)} -> ${show(c.to)}` : `${c.key}: ${show(c.to)}`).join('; '),
    ])
    const csv = '\uFEFF' + [header, ...lines].map((l) => l.map(esc).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `platform-audit-log-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
    logActivity('EXPORT', 'Platform Audit Log', `Exported ${data.length} platform audit rows`)
  } catch (e) {
    pageError.value = e.message || 'Export failed.'
  } finally {
    isExporting.value = false
  }
}

// ---------- session ----------
let isLoggingOut = false
const handleLogout = async () => {
  if (isLoggingOut) return
  isLoggingOut = true
  try { await logoutUser() } catch (error) { console.error('Sign-out failed:', error) }
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  resetNotifications()
  router.push('/')
}

onMounted(async () => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) { router.push('/'); return }
  let user = {}
  try { user = JSON.parse(storedUser) || {} } catch { router.push('/'); return }
  if (user.role !== 'Super Admin') { router.push('/'); return }
  userName.value = user.full_name || user.username || 'Super Admin'

  load()
  try { businesses.value = await getPlatformBusinesses() } catch { /* dropdown just stays empty */ }
})

onUnmounted(() => clearTimeout(searchTimer))
</script>