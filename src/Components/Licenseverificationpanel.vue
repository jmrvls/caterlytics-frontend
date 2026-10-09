<template>
  <!-- Super Admin: Compliance checks (license verification) -->
  <div>
    <div class="mb-4">
      <h2 class="font-bold text-gray-900 dark:text-gray-100">Compliance &amp; License Verification</h2>
      <p class="text-xs text-gray-400">
        Review the permits and licenses that businesses submit. A business is compliant once all
        {{ REQUIRED_LICENSES.length }} required licenses are verified and not expired.
      </p>
    </div>

    <div v-if="loading" class="p-8 text-center text-gray-400 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      Loading licenses…
    </div>

    <div v-else-if="!ready" class="p-4 text-sm text-amber-800 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
      License verification is not set up yet. Run <span class="font-mono font-semibold">license_verification.sql</span> in the Supabase SQL Editor, then reload this page.
    </div>

    <template v-else>
      <div v-if="errorMessage" class="p-3 mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20">{{ errorMessage }}</div>
      <div v-if="successMessage" class="p-3 mb-4 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20">{{ successMessage }}</div>

      <!-- Summary -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <button type="button" @click="view = 'queue'; statusFilter = 'Pending'" class="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40">
          <p class="text-xs text-gray-400 mb-1">Waiting for review</p>
          <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ counts.Pending }}</p>
        </button>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4">
          <p class="text-xs text-gray-400 mb-1">Verified licenses</p>
          <p class="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{{ counts.Verified }}</p>
        </div>
        <button type="button" @click="view = 'businesses'; onlyNonCompliant = false" class="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40">
          <p class="text-xs text-gray-400 mb-1">Compliant businesses</p>
          <p class="text-2xl font-bold text-gray-800 dark:text-gray-100">{{ compliantCount }} <span class="text-sm font-medium text-gray-400">/ {{ businessRows.length }}</span></p>
        </button>
        <button type="button" @click="view = 'businesses'; onlyNonCompliant = true" class="text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40">
          <p class="text-xs text-gray-400 mb-1">Expired licenses</p>
          <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ expiredCount }}</p>
        </button>
      </div>

      <!-- View switch -->
      <div class="flex gap-1 mb-4">
        <button v-for="v in VIEWS" :key="v.key" type="button" @click="view = v.key"
          :class="view === v.key ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700'"
          class="px-4 py-2 text-sm font-semibold transition">{{ v.label }}</button>
      </div>

      <!-- ===== REVIEW QUEUE ===== -->
      <template v-if="view === 'queue'">
        <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
          <input v-model="search" type="text" placeholder="Search business, license or number" class="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
          <select v-model="statusFilter" class="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="">All</option>
            <option value="Pending">Pending review</option>
            <option value="Rejected">Rejected</option>
            <option value="Verified">Verified</option>
            <option value="Unverified">Not submitted</option>
          </select>
        </div>

        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th class="px-4 py-3 font-medium">Business</th>
                <th class="px-4 py-3 font-medium">License</th>
                <th class="px-4 py-3 font-medium hidden md:table-cell">Number</th>
                <th class="px-4 py-3 font-medium hidden lg:table-cell">Expires</th>
                <th class="px-4 py-3 font-medium">Status</th>
                <th class="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="!filteredQueue.length"><td colspan="6" class="text-center py-10 text-gray-400">{{ queue.length ? 'No licenses match.' : 'No licenses have been uploaded yet.' }}</td></tr>
              <tr v-for="d in filteredQueue" :key="d.document_id" class="text-gray-700 dark:text-gray-300 align-top">
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ d.business_name }}</p>
                  <p v-if="d.verification_submitted_at && d.verification_status === 'Pending'" class="text-xs text-gray-400">Submitted {{ formatDate(d.verification_submitted_at) }}</p>
                </td>
                <td class="px-4 py-3 max-w-xs">
                  <p class="break-words">{{ d.doc_type }}</p>
                  <p class="text-xs text-gray-400 truncate" :title="d.title">{{ d.title }}</p>
                </td>
                <td class="px-4 py-3 hidden md:table-cell">{{ d.reference_no || '—' }}</td>
                <td class="px-4 py-3 hidden lg:table-cell whitespace-nowrap">
                  {{ formatDate(d.expiry_date) }}
                  <p v-if="docStatus(d) === 'expired'" class="text-xs text-red-600 dark:text-red-400">Expired</p>
                  <p v-else-if="docStatus(d) === 'expiring'" class="text-xs text-amber-600 dark:text-amber-400">Expiring soon</p>
                </td>
                <td class="px-4 py-3">
                  <span :class="VERIFICATION_UI[d.verification_status].cls" class="inline-block px-2 py-0.5 text-xs font-semibold whitespace-nowrap">{{ VERIFICATION_UI[d.verification_status].label }}</span>
                  <p v-if="d.verification_status === 'Verified' && d.verified_at" class="text-xs text-gray-400 mt-1">{{ formatDate(d.verified_at) }}<span v-if="d.verified_by_name"> · {{ d.verified_by_name }}</span></p>
                  <p v-if="d.verification_status === 'Rejected' && d.verification_note" class="text-xs text-red-600 dark:text-red-400 mt-1 break-words max-w-[14rem]">{{ d.verification_note }}</p>
                </td>
                <td class="px-4 py-3 text-right whitespace-nowrap">
                  <button @click="openFile(d)" class="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline mr-3">View file</button>
                  <template v-if="d.verification_status !== 'Unverified'">
                    <button v-if="d.verification_status !== 'Verified'" @click="openReview(d, 'Verified')" class="text-emerald-700 dark:text-emerald-400 font-semibold hover:underline mr-3">Verify</button>
                    <button v-if="d.verification_status !== 'Rejected'" @click="openReview(d, 'Rejected')" class="text-red-600 dark:text-red-400 font-semibold hover:underline">{{ d.verification_status === 'Verified' ? 'Revoke' : 'Reject' }}</button>
                  </template>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>

      <!-- ===== BUSINESS COMPLIANCE ===== -->
      <template v-else>
        <label class="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-4">
          <input type="checkbox" v-model="onlyNonCompliant" class="accent-emerald-600" />
          Show only businesses that are not fully compliant
        </label>
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table class="w-full text-sm">
            <thead>
              <tr class="text-left text-xs text-gray-400 border-b border-gray-100 dark:border-gray-700">
                <th class="px-4 py-3 font-medium">Business</th>
                <th v-for="t in REQUIRED_LICENSES" :key="t" class="px-4 py-3 font-medium hidden lg:table-cell">{{ SHORT[t] || t }}</th>
                <th class="px-4 py-3 font-medium">Compliance</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              <tr v-if="!visibleBusinessRows.length"><td :colspan="REQUIRED_LICENSES.length + 2" class="text-center py-10 text-gray-400">No businesses to show.</td></tr>
              <tr v-for="b in visibleBusinessRows" :key="b.business_id" class="text-gray-700 dark:text-gray-300">
                <td class="px-4 py-3">
                  <p class="font-medium text-gray-900 dark:text-gray-100">{{ b.business_name }}</p>
                  <p class="text-xs text-gray-400">{{ b.status }}</p>
                </td>
                <td v-for="item in b.report.items" :key="item.type" class="px-4 py-3 hidden lg:table-cell">
                  <span :class="LICENSE_STATE_UI[item.state].cls" class="inline-block px-2 py-0.5 text-xs font-semibold whitespace-nowrap">{{ LICENSE_STATE_UI[item.state].label }}</span>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
                  <span :class="b.report.compliant ? LICENSE_STATE_UI.verified.cls : 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'" class="inline-block px-2 py-0.5 text-xs font-semibold">
                    {{ b.report.compliant ? 'Compliant' : `${b.report.verified} of ${b.report.total} verified` }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
    </template>

    <!-- REVIEW MODAL -->
    <div v-if="reviewing" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/50" @click="closeReview"></div>
      <div class="relative bg-white dark:bg-gray-800 w-full max-w-md p-5 sm:p-6 shadow-xl">
        <h3 class="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
          {{ reviewing.decision === 'Verified' ? 'Verify license' : (reviewing.doc.verification_status === 'Verified' ? 'Revoke verification' : 'Reject license') }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {{ reviewing.doc.business_name }} — {{ reviewing.doc.doc_type }}<span v-if="reviewing.doc.reference_no"> ({{ reviewing.doc.reference_no }})</span>
        </p>
        <div v-if="reviewError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-3">{{ reviewError }}</div>
        <p v-if="reviewing.decision === 'Verified'" class="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Confirm you checked the uploaded file and that the number and dates match. The business will be notified.
        </p>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {{ reviewing.decision === 'Rejected' ? 'Reason (shown to the business)' : 'Note (optional)' }}
        </label>
        <textarea v-model="reviewNote" rows="3" maxlength="500" :placeholder="reviewing.decision === 'Rejected' ? 'e.g. The scan is blurry, please upload a clearer copy.' : ''" class="mb-4 w-full px-3 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"></textarea>
        <div class="flex gap-3">
          <button @click="closeReview" :disabled="reviewSaving" class="flex-1 py-2.5 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition">Cancel</button>
          <button @click="submitReview" :disabled="reviewSaving" :class="reviewing.decision === 'Verified' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'" class="flex-1 py-2.5 text-white text-sm font-semibold disabled:opacity-60 transition">
            {{ reviewSaving ? 'Saving…' : (reviewing.decision === 'Verified' ? 'Verify' : (reviewing.doc.verification_status === 'Verified' ? 'Revoke' : 'Reject')) }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { getLicenseQueue, getPlatformBusinesses, reviewLicense, getLicenseFileUrl } from '../services/superAdminService'
import {
  REQUIRED_LICENSES, VERIFICATION_UI, LICENSE_STATE_UI,
  complianceReport, docStatus, formatDate
} from '../utils/legaldocs'

// Tells the parent how many licenses are waiting, for the tab badge.
const emit = defineEmits(['pending-count'])

const VIEWS = [
  { key: 'queue', label: 'Review queue' },
  { key: 'businesses', label: 'Business compliance' },
]
const SHORT = {
  "Mayor's / Business Permit": "Mayor's Permit",
  'Sanitary Permit': 'Sanitary',
  'DTI / SEC Registration': 'DTI / SEC',
  'BIR Certificate of Registration': 'BIR COR',
}

const loading = ref(true)
const ready = ref(true)
const errorMessage = ref('')
const successMessage = ref('')
const queue = ref([])
const businesses = ref([])
const view = ref('queue')
const statusFilter = ref('Pending')
const search = ref('')
const onlyNonCompliant = ref(false)

const counts = computed(() => {
  const c = { Pending: 0, Verified: 0, Rejected: 0, Unverified: 0 }
  for (const d of queue.value) c[d.verification_status] = (c[d.verification_status] || 0) + 1
  return c
})

const filteredQueue = computed(() => {
  const q = search.value.trim().toLowerCase()
  return queue.value.filter((d) => {
    if (statusFilter.value && d.verification_status !== statusFilter.value) return false
    if (!q) return true
    return [d.business_name, d.doc_type, d.title, d.reference_no].some((v) => (v || '').toLowerCase().includes(q))
  })
})

// Businesses that are still operating (rejected / closed ones don't need licenses).
const businessRows = computed(() => {
  const byBusiness = new Map()
  for (const d of queue.value) {
    if (!byBusiness.has(d.business_id)) byBusiness.set(d.business_id, [])
    byBusiness.get(d.business_id).push(d)
  }
  return businesses.value
    .filter((b) => ['Active', 'Pending', 'Suspended'].includes(b.status))
    .map((b) => ({ ...b, report: complianceReport(byBusiness.get(b.business_id) || []) }))
    .sort((a, b) => Number(a.report.compliant) - Number(b.report.compliant) || a.business_name.localeCompare(b.business_name))
})
const visibleBusinessRows = computed(() => (onlyNonCompliant.value ? businessRows.value.filter((b) => !b.report.compliant) : businessRows.value))
const compliantCount = computed(() => businessRows.value.filter((b) => b.report.compliant).length)
const expiredCount = computed(() => queue.value.filter((d) => docStatus(d) === 'expired').length)

function flash(msg) {
  successMessage.value = msg
  setTimeout(() => { if (successMessage.value === msg) successMessage.value = '' }, 4000)
}

async function load() {
  errorMessage.value = ''
  try {
    const [rows, biz] = await Promise.all([getLicenseQueue(), getPlatformBusinesses()])
    if (rows === null) { ready.value = false; return }
    queue.value = rows
    businesses.value = biz
    emit('pending-count', counts.value.Pending)
  } catch (e) {
    errorMessage.value = e?.message || 'Failed to load licenses.'
  } finally {
    loading.value = false
  }
}
onMounted(load)

// Open the tab inside the click so browsers don't treat it as a popup.
async function openFile(d) {
  errorMessage.value = ''
  const tab = window.open('', '_blank')
  try {
    const url = await getLicenseFileUrl(d.file_path, d.file_name)
    if (tab) { tab.opener = null; tab.location.href = url } else window.location.href = url
  } catch (e) {
    if (tab) tab.close()
    errorMessage.value = e?.message || 'Could not open the file.'
  }
}

// ---- review modal ----
const reviewing = ref(null) // { doc, decision }
const reviewNote = ref('')
const reviewError = ref('')
const reviewSaving = ref(false)

function openReview(doc, decision) {
  reviewing.value = { doc, decision }
  reviewNote.value = ''
  reviewError.value = ''
}
function closeReview() {
  if (!reviewSaving.value) reviewing.value = null
}

async function submitReview() {
  const { doc, decision } = reviewing.value
  if (decision === 'Rejected' && !reviewNote.value.trim()) {
    reviewError.value = 'Please give a reason so the business knows what to fix.'
    return
  }
  reviewSaving.value = true
  reviewError.value = ''
  try {
    await reviewLicense(doc.document_id, decision, reviewNote.value.trim() || null)
    reviewing.value = null
    flash(decision === 'Verified' ? 'License verified.' : 'License rejected. The business was notified.')
    await load()
  } catch (e) {
    reviewError.value = e?.message || 'Failed to save the review.'
  } finally {
    reviewSaving.value = false
  }
}
</script>