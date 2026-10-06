<template>
  <!-- Super Admin: Communication Hub -> broadcast announcements to every tenant -->
  <div>
    <div class="mb-4">
      <h2 class="font-bold text-gray-900 dark:text-gray-100">Communication Hub</h2>
      <p class="text-xs text-gray-400">
        Broadcast a message to every catering business (Owners, Admins and Staff). It appears as a banner on their
        dashboard and in their notification bell.
      </p>
    </div>

    <!-- COMPOSE -->
    <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5 mb-6">
      <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">New announcement</h3>

      <div v-if="formError" class="p-3 mb-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20">{{ formError }}</div>
      <div v-if="formSuccess" class="p-3 mb-3 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20">{{ formSuccess }}</div>

      <div class="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Title</label>
          <input
            v-model="form.title"
            maxlength="120"
            type="text"
            placeholder="e.g. Scheduled maintenance this Saturday"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Type</label>
          <select
            v-model="form.severity"
            class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="info">Info (new feature, tips)</option>
            <option value="warning">Warning (maintenance)</option>
            <option value="critical">Critical (urgent)</option>
          </select>
        </div>
      </div>

      <div class="mb-3">
        <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">
          Message <span class="font-normal">({{ form.message.length }}/1000)</span>
        </label>
        <textarea
          v-model="form.message"
          maxlength="1000"
          rows="4"
          placeholder="Write the announcement for all tenants…"
          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
        ></textarea>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Hide automatically after (optional)</label>
          <input
            v-model="form.expiresOn"
            type="date"
            :min="today"
            class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          type="button"
          @click="publish"
          :disabled="publishing"
          class="px-5 py-2.5 text-sm font-bold bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90 disabled:opacity-50 transition rounded-none"
        >
          {{ publishing ? 'Publishing…' : 'Publish to all tenants' }}
        </button>
      </div>
    </div>

    <!-- HISTORY -->
    <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">Published announcements</h3>

    <div v-if="listError" class="p-4 mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20">
      {{ listError }}
      <span class="block text-xs mt-1 text-red-500">If this says the table doesn't exist, run announcements.sql in the Supabase SQL Editor.</span>
    </div>
    <div v-else-if="loading" class="p-8 text-center text-gray-400 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">Loading…</div>
    <div v-else-if="!items.length" class="p-8 text-center text-gray-400 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      No announcements yet.
    </div>

    <div v-else class="space-y-3">
      <div
        v-for="a in items"
        :key="a.announcement_id"
        class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 border-l-4 p-4"
        :class="borderClass(a.severity)"
      >
        <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div class="min-w-0">
            <div class="flex flex-wrap items-center gap-2 mb-1">
              <p class="font-bold text-sm text-gray-900 dark:text-gray-100 break-words">{{ a.title }}</p>
              <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" :class="badgeClass(a.severity)">{{ a.severity }}</span>
              <span class="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide" :class="statusClass(a)">{{ statusLabel(a) }}</span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-line break-words">{{ a.message }}</p>
            <p class="text-[11px] text-gray-400 mt-2">
              Posted {{ formatDateTime(a.created_at) }}
              <template v-if="a.expires_at"> &middot; hides {{ formatDateTime(a.expires_at) }}</template>
            </p>
          </div>
          <div class="flex gap-2 shrink-0">
            <button
              type="button"
              @click="toggle(a)"
              :disabled="busyId === a.announcement_id"
              class="text-xs font-semibold px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition"
            >{{ a.is_active ? 'Hide' : 'Show again' }}</button>
            <button
              type="button"
              @click="remove(a)"
              :disabled="busyId === a.announcement_id"
              class="text-xs font-semibold px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50 transition"
            >Delete</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import {
  getAllAnnouncements, createAnnouncement, setAnnouncementActive, deleteAnnouncement,
} from '../services/announcementService'

const items = ref([])
const loading = ref(true)
const listError = ref('')
const formError = ref('')
const formSuccess = ref('')
const publishing = ref(false)
const busyId = ref(null)

const form = reactive({ title: '', message: '', severity: 'info', expiresOn: '' })

// local YYYY-MM-DD (not UTC) so the date picker's minimum matches the user's day
const today = (() => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
})()

async function load() {
  loading.value = true
  listError.value = ''
  try {
    items.value = await getAllAnnouncements()
  } catch (err) {
    listError.value = err.message
  } finally {
    loading.value = false
  }
}

async function publish() {
  formError.value = ''
  formSuccess.value = ''
  publishing.value = true
  try {
    // expire at the END of the chosen day (local time)
    const expiresAt = form.expiresOn ? new Date(`${form.expiresOn}T23:59:59`).toISOString() : null
    const created = await createAnnouncement({
      title: form.title,
      message: form.message,
      severity: form.severity,
      expiresAt,
    })
    items.value = [created, ...items.value]
    form.title = ''
    form.message = ''
    form.severity = 'info'
    form.expiresOn = ''
    formSuccess.value = 'Announcement published. Tenants will see it within about a minute.'
  } catch (err) {
    formError.value = err.message
  } finally {
    publishing.value = false
  }
}

async function toggle(a) {
  busyId.value = a.announcement_id
  listError.value = ''
  try {
    await setAnnouncementActive(a.announcement_id, !a.is_active)
    a.is_active = !a.is_active
  } catch (err) {
    listError.value = err.message
  } finally {
    busyId.value = null
  }
}

async function remove(a) {
  if (!window.confirm(`Delete "${a.title}"? Tenants will no longer see it.`)) return
  busyId.value = a.announcement_id
  listError.value = ''
  try {
    await deleteAnnouncement(a.announcement_id)
    items.value = items.value.filter((x) => x.announcement_id !== a.announcement_id)
  } catch (err) {
    listError.value = err.message
  } finally {
    busyId.value = null
  }
}

const isExpired = (a) => !!a.expires_at && new Date(a.expires_at) <= new Date()
const statusLabel = (a) => (!a.is_active ? 'Hidden' : isExpired(a) ? 'Expired' : 'Live')
const statusClass = (a) => (!a.is_active
  ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
  : isExpired(a)
    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
    : 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400')
const borderClass = (s) => ({ info: 'border-l-blue-500', warning: 'border-l-amber-500', critical: 'border-l-red-500' }[s] || 'border-l-blue-500')
const badgeClass = (s) => ({
  info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
  warning: 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300',
  critical: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300',
}[s] || '')

function formatDateTime(v) {
  if (!v) return '—'
  return new Date(v).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

onMounted(load)
</script>