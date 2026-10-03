<template>
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" @click.self="$emit('close')">
    <div class="bg-white dark:bg-gray-800 w-full sm:max-w-4xl h-[92vh] sm:h-[88vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col overflow-hidden">

      <!-- Header -->
      <div class="flex items-start justify-between gap-3 px-5 pt-5 pb-3 border-b border-gray-100 dark:border-gray-700">
        <div class="min-w-0">
          <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100">Plan Your Event</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 truncate">
            {{ formatDateOnly(booking.event_date) }}<span v-if="booking.event_location"> · <span class="capitalize">{{ booking.event_location }}</span></span>
            · {{ booking.guest_count }} guests booked
          </p>
        </div>
        <button @click="$emit('close')" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700" aria-label="Close">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
        </button>
      </div>

      <!-- Summary + tabs -->
      <div class="px-5 pt-4">
        <div class="grid grid-cols-3 gap-2 sm:gap-3 mb-3">
          <div class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
            <p class="text-[11px] text-gray-500 dark:text-gray-400">Attending</p>
            <p class="text-lg font-bold text-emerald-600 dark:text-emerald-400">{{ rsvp.Attending }}</p>
          </div>
          <div class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
            <p class="text-[11px] text-gray-500 dark:text-gray-400">Pending / Declined</p>
            <p class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ rsvp.Pending }} / {{ rsvp.Declined }}</p>
          </div>
          <div class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
            <p class="text-[11px] text-gray-500 dark:text-gray-400">Seated</p>
            <p class="text-lg font-bold text-gray-800 dark:text-gray-100">{{ seatedCount }} / {{ activeGuests.length }}</p>
          </div>
        </div>

        <p v-if="overBooked" class="mb-3 text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg px-3 py-2">
          Your guest list ({{ activeGuests.length }}) is more than the {{ booking.guest_count }} guests you booked. Edit your booking or message your caterer so the headcount matches.
        </p>

        <div class="flex gap-1 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button v-for="t in tabs" :key="t" @click="activeTab = t"
            :class="activeTab === t ? 'border-emerald-600 text-emerald-700 dark:text-emerald-300 font-semibold' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'"
            class="px-4 py-2 text-sm border-b-2 -mb-px whitespace-nowrap transition">{{ t }}</button>
        </div>
      </div>

      <!-- Body -->
      <div class="flex-1 overflow-y-auto px-5 py-4">
        <p v-if="pageError" class="mb-3 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">{{ pageError }}</p>
        <div v-if="isLoading" class="text-sm text-gray-500 dark:text-gray-400 py-8 text-center">Loading…</div>

        <!-- ============ GUEST LIST ============ -->
        <section v-else-if="activeTab === 'Guest List'">
          <div class="flex flex-col sm:flex-row gap-2 sm:items-center justify-between mb-3">
            <div class="flex gap-2 flex-1">
              <input v-model="guestSearch" type="text" placeholder="Search guest…" :class="inputCls + ' flex-1 max-w-xs'" />
              <select v-model="rsvpFilter" :class="inputCls">
                <option value="All">All RSVP</option>
                <option v-for="r in RSVP_OPTIONS" :key="r" :value="r">{{ r }}</option>
              </select>
            </div>
            <div class="flex gap-2 flex-wrap">
              <button @click="exportCsv" :disabled="!guests.length" class="px-3 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl disabled:opacity-40">Export CSV</button>
              <button @click="showImport = true; formError = ''" class="px-3 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl">Paste list</button>
              <button @click="openGuestForm()" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">Add guest</button>
            </div>
          </div>

          <!-- Mobile cards -->
          <div class="md:hidden space-y-2">
            <p v-if="!filteredGuests.length" class="text-center text-sm text-gray-500 dark:text-gray-400 py-6">{{ guests.length ? 'No guests match.' : 'No guests yet. Add your first guest or paste your list.' }}</p>
            <div v-for="g in filteredGuests" :key="g.guest_id" class="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
              <div class="flex items-start justify-between gap-2">
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900 dark:text-gray-100 break-words">{{ g.full_name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ g.contact_number || g.email || 'No contact' }} · {{ tableLabel(g.table_id) === '—' ? 'No table' : tableLabel(g.table_id) }}</p>
                </div>
                <select :value="g.rsvp_status" @change="changeRsvp(g, $event.target.value)" class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs rounded-lg">
                  <option v-for="r in RSVP_OPTIONS" :key="r" :value="r">{{ r }}</option>
                </select>
              </div>
              <div v-if="g.dietary_preferences.length || g.allergies" class="flex flex-wrap gap-1 mt-2">
                <span v-for="d in g.dietary_preferences" :key="d" class="text-[11px] px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{{ d }}</span>
                <span v-if="g.allergies" class="text-[11px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">Allergy: {{ g.allergies }}</span>
              </div>
              <div class="flex gap-4 mt-2 text-xs font-semibold">
                <button @click="openGuestForm(g)" class="text-emerald-600 dark:text-emerald-400">Edit</button>
                <button @click="removeGuest(g)" class="text-red-500 dark:text-red-400">Remove</button>
              </div>
            </div>
          </div>

          <!-- Desktop table -->
          <div class="hidden md:block rounded-xl border border-gray-100 dark:border-gray-700 overflow-x-auto">
            <table class="min-w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900/40 text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th class="px-3 py-2">Name</th>
                  <th class="px-3 py-2">Contact</th>
                  <th class="px-3 py-2">RSVP</th>
                  <th class="px-3 py-2">Table</th>
                  <th class="px-3 py-2">Dietary</th>
                  <th class="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                <tr v-if="!filteredGuests.length">
                  <td colspan="6" class="px-3 py-6 text-center text-gray-500 dark:text-gray-400">{{ guests.length ? 'No guests match.' : 'No guests yet. Add your first guest or paste your list.' }}</td>
                </tr>
                <tr v-for="g in filteredGuests" :key="g.guest_id" class="text-gray-800 dark:text-gray-200">
                  <td class="px-3 py-2 font-medium">{{ g.full_name }}</td>
                  <td class="px-3 py-2 text-gray-500 dark:text-gray-400">{{ g.contact_number || g.email || '—' }}</td>
                  <td class="px-3 py-2">
                    <select :value="g.rsvp_status" @change="changeRsvp(g, $event.target.value)" class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs rounded-lg">
                      <option v-for="r in RSVP_OPTIONS" :key="r" :value="r">{{ r }}</option>
                    </select>
                  </td>
                  <td class="px-3 py-2">{{ tableLabel(g.table_id) }}</td>
                  <td class="px-3 py-2">
                    <div class="flex flex-wrap gap-1">
                      <span v-for="d in g.dietary_preferences" :key="d" class="text-xs px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300">{{ d }}</span>
                      <span v-if="g.allergies" class="text-xs px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300">Allergy: {{ g.allergies }}</span>
                      <span v-if="!g.dietary_preferences.length && !g.allergies" class="text-gray-400">—</span>
                    </div>
                  </td>
                  <td class="px-3 py-2 whitespace-nowrap text-right">
                    <button @click="openGuestForm(g)" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline mr-3">Edit</button>
                    <button @click="removeGuest(g)" class="text-xs font-semibold text-red-500 dark:text-red-400 hover:underline">Remove</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- ============ SEATING ============ -->
        <section v-else-if="activeTab === 'Seating'">
          <div class="flex flex-wrap gap-2 items-end mb-4">
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Table name</label>
              <input v-model="newTableLabel" type="text" placeholder="e.g. Table 1 / Head Table" :class="inputCls" />
            </div>
            <div>
              <label class="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Seats</label>
              <input v-model.number="newTableCapacity" type="number" min="1" max="50" :class="inputCls + ' w-24'" />
            </div>
            <button @click="createTable" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl">Add table</button>
            <button @click="autoFillTables" :disabled="tables.length === 0 || unseatedGuests.length === 0 || isAutoSeating" class="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-xl disabled:opacity-40">{{ isAutoSeating ? 'Seating…' : 'Auto-seat guests' }}</button>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div class="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 content-start">
              <p v-if="tables.length === 0" class="text-sm text-gray-500 dark:text-gray-400 sm:col-span-2">No tables yet. Add one above.</p>
              <div v-for="t in tables" :key="t.table_id" class="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
                <template v-if="editingTable && editingTable.table_id === t.table_id">
                  <input v-model="editingTable.label" type="text" :class="inputCls + ' w-full mb-2'" />
                  <input v-model.number="editingTable.capacity" type="number" min="1" max="50" :class="inputCls + ' w-24 mb-2'" />
                  <div class="flex gap-3 text-xs font-semibold">
                    <button @click="saveTableEdit" class="text-emerald-600 dark:text-emerald-400">Save</button>
                    <button @click="editingTable = null" class="text-gray-500 dark:text-gray-400">Cancel</button>
                  </div>
                </template>
                <template v-else>
                  <div class="flex items-center justify-between gap-2 mb-1">
                    <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">{{ t.label }}</p>
                    <div class="flex gap-3 text-xs font-semibold">
                      <button @click="editingTable = { table_id: t.table_id, label: t.label, capacity: t.capacity }" class="text-emerald-600 dark:text-emerald-400 hover:underline">Edit</button>
                      <button @click="removeTable(t)" class="text-red-500 dark:text-red-400 hover:underline">Delete</button>
                    </div>
                  </div>
                  <p class="text-xs mb-2" :class="seatedAt(t.table_id).length >= t.capacity ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'">
                    {{ seatedAt(t.table_id).length }} / {{ t.capacity }} seats
                  </p>
                  <div class="h-1.5 rounded bg-gray-100 dark:bg-gray-700 mb-2 overflow-hidden">
                    <div class="h-full bg-emerald-600" :style="{ width: Math.min(100, (seatedAt(t.table_id).length / t.capacity) * 100) + '%' }"></div>
                  </div>
                  <ul class="space-y-1">
                    <li v-for="g in seatedAt(t.table_id)" :key="g.guest_id" class="flex items-center justify-between text-sm text-gray-800 dark:text-gray-200">
                      <span class="truncate">{{ g.full_name }}
                        <span v-if="g.dietary_preferences.length || g.allergies" class="text-xs text-amber-600 dark:text-amber-400" title="Has dietary needs">•</span>
                      </span>
                      <button @click="moveGuest(g, null)" class="text-xs text-gray-400 hover:text-red-500">Unseat</button>
                    </li>
                    <li v-if="seatedAt(t.table_id).length === 0" class="text-xs text-gray-400">Empty</li>
                  </ul>
                </template>
              </div>
            </div>

            <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-3 h-fit">
              <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Not yet seated ({{ unseatedGuests.length }})</p>
              <ul class="space-y-2">
                <li v-for="g in unseatedGuests" :key="g.guest_id" class="flex items-center justify-between gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <span class="truncate">{{ g.full_name }}</span>
                  <select @change="moveGuest(g, $event.target.value || null); $event.target.value = ''" class="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-2 py-1 text-xs rounded-lg max-w-[9rem]">
                    <option value="">Seat at…</option>
                    <option v-for="t in tables" :key="t.table_id" :value="t.table_id" :disabled="seatedAt(t.table_id).length >= t.capacity">{{ t.label }}</option>
                  </select>
                </li>
                <li v-if="unseatedGuests.length === 0" class="text-xs text-gray-400">{{ activeGuests.length ? 'Everyone attending is seated.' : 'Add guests in the Guest List tab first.' }}</li>
              </ul>
              <p class="text-xs text-gray-400 mt-3">Declined guests are not counted for seats.</p>
            </div>
          </div>
        </section>

        <!-- ============ DIETARY ============ -->
        <section v-else-if="activeTab === 'Dietary'">
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">Your caterer uses this to prepare for your guests' needs. Counts exclude guests who declined. Set each guest's needs from the Guest List tab.</p>

          <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <div class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
              <p class="text-xs text-gray-500 dark:text-gray-400">Guests to serve</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ dietary.total }}</p>
            </div>
            <div class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
              <p class="text-xs text-gray-500 dark:text-gray-400">With restrictions / allergies</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ dietary.withRestrictions }}</p>
            </div>
            <div v-for="tag in topTags" :key="tag" class="rounded-xl bg-gray-50 dark:bg-gray-900/50 p-3">
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ tag }}</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-gray-100">{{ dietary.counts[tag] }}</p>
            </div>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
              <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">All dietary tags</p>
              <ul class="divide-y divide-gray-100 dark:divide-gray-700 text-sm">
                <li v-for="tag in DIETARY_OPTIONS" :key="tag" class="flex justify-between py-1.5 text-gray-800 dark:text-gray-200">
                  <span>{{ tag }}</span><span class="font-semibold">{{ dietary.counts[tag] }}</span>
                </li>
              </ul>
            </div>
            <div class="rounded-xl border border-gray-100 dark:border-gray-700 p-3">
              <p class="font-semibold text-gray-900 dark:text-gray-100 mb-2">Allergies</p>
              <ul class="space-y-2 text-sm">
                <li v-for="g in dietary.withAllergies" :key="g.guest_id" class="text-gray-800 dark:text-gray-200">
                  <span class="font-medium">{{ g.full_name }}</span>
                  <span class="text-gray-500 dark:text-gray-400"> · {{ tableLabel(g.table_id) === '—' ? 'No table yet' : tableLabel(g.table_id) }}</span>
                  <div class="text-red-600 dark:text-red-400">{{ g.allergies }}</div>
                </li>
                <li v-if="dietary.withAllergies.length === 0" class="text-gray-400">No allergies recorded.</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- GUEST FORM -->
    <div v-if="showGuestForm" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" @click.self="showGuestForm = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-5">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">{{ editingGuestId ? 'Edit guest' : 'Add guest' }}</h3>
        <p v-if="formError" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
        <div class="space-y-3">
          <input v-model="guestForm.full_name" type="text" placeholder="Full name *" :class="inputCls + ' w-full'" />
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input v-model="guestForm.contact_number" type="text" placeholder="Mobile (09…)" :class="inputCls" />
            <input v-model="guestForm.email" type="email" placeholder="Email" :class="inputCls" />
          </div>
          <select v-model="guestForm.rsvp_status" :class="inputCls + ' w-full'">
            <option v-for="r in RSVP_OPTIONS" :key="r" :value="r">{{ r }}</option>
          </select>
          <div>
            <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">Dietary preferences</p>
            <div class="flex flex-wrap gap-x-4 gap-y-2">
              <label v-for="d in DIETARY_OPTIONS" :key="d" class="flex items-center gap-1.5 text-sm text-gray-700 dark:text-gray-200">
                <input type="checkbox" :value="d" v-model="guestForm.dietary_preferences" class="accent-emerald-600" /> {{ d }}
              </label>
            </div>
          </div>
          <input v-model="guestForm.allergies" type="text" placeholder="Allergies (e.g. shrimp, peanuts)" :class="inputCls + ' w-full'" />
          <textarea v-model="guestForm.notes" rows="2" placeholder="Notes" :class="inputCls + ' w-full'"></textarea>
        </div>
        <div class="flex justify-end gap-2 mt-4">
          <button @click="showGuestForm = false" class="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">Cancel</button>
          <button @click="saveGuest" :disabled="isSaving" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50">{{ isSaving ? 'Saving…' : 'Save' }}</button>
        </div>
      </div>
    </div>

    <!-- IMPORT -->
    <div v-if="showImport" class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4" @click.self="showImport = false">
      <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-5">
        <h3 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Paste guest list</h3>
        <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">One guest per line. Optional mobile after a comma: <span class="font-mono">Juan Dela Cruz, 09171234567</span></p>
        <p v-if="formError" class="mb-3 text-sm text-red-600 dark:text-red-400">{{ formError }}</p>
        <textarea v-model="importText" rows="8" :class="inputCls + ' w-full'"></textarea>
        <div class="flex justify-end gap-2 mt-4">
          <button @click="showImport = false; importText = ''; formError = ''" class="px-4 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl">Cancel</button>
          <button @click="runImport" :disabled="isSaving" class="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl disabled:opacity-50">{{ isSaving ? 'Importing…' : 'Import' }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Customer-side Event Planning Tools: guest list + RSVP, seating arrangement and
// dietary preferences for ONE of the client's own bookings. Uses the same
// planningservice / tables as the admin Event Planning page, so whatever the
// client enters is what the caterer (and the kitchen) sees. The database already
// restricts a Client to their own bookings (can_edit_event_plan).
import { ref, computed, onMounted } from 'vue'
import { formatDateOnly } from '../utils/date'
import {
  DIETARY_OPTIONS, RSVP_OPTIONS,
  getGuests, addGuest, updateGuest, deleteGuest, importGuests,
  getTables, addTable, updateTable, deleteTable, seatGuest,
  summarizeDietary, rsvpSummary
} from '../services/planningservice'

const props = defineProps({
  // { booking_id, event_date, event_location, guest_count, ... }
  booking: { type: Object, required: true }
})
defineEmits(['close'])

const inputCls = 'border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 px-3 py-2 text-sm rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500'

const tabs = ['Guest List', 'Seating', 'Dietary']
const activeTab = ref('Guest List')
const guests = ref([])
const tables = ref([])
const isLoading = ref(true)
const isSaving = ref(false)
const isAutoSeating = ref(false)
const pageError = ref('')
const formError = ref('')

const guestSearch = ref('')
const rsvpFilter = ref('All')
const showGuestForm = ref(false)
const editingGuestId = ref(null)
const showImport = ref(false)
const importText = ref('')
const newTableLabel = ref('')
const newTableCapacity = ref(8)
const editingTable = ref(null)

const blankGuest = () => ({
  full_name: '', contact_number: '', email: '', rsvp_status: 'Pending',
  table_id: null, dietary_preferences: [], allergies: '', notes: ''
})
const guestForm = ref(blankGuest())

const activeGuests = computed(() => guests.value.filter((g) => g.rsvp_status !== 'Declined'))
const unseatedGuests = computed(() => activeGuests.value.filter((g) => !g.table_id))
const seatedCount = computed(() => activeGuests.value.filter((g) => g.table_id).length)
const rsvp = computed(() => rsvpSummary(guests.value))
const dietary = computed(() => summarizeDietary(guests.value))
const overBooked = computed(() => activeGuests.value.length > Number(props.booking.guest_count || 0))
const topTags = computed(() =>
  DIETARY_OPTIONS.filter((t) => dietary.value.counts[t] > 0)
    .sort((a, b) => dietary.value.counts[b] - dietary.value.counts[a])
    .slice(0, 4)
)
const filteredGuests = computed(() => {
  const q = guestSearch.value.trim().toLowerCase()
  return guests.value.filter((g) => {
    if (rsvpFilter.value !== 'All' && g.rsvp_status !== rsvpFilter.value) return false
    return !q || g.full_name.toLowerCase().includes(q)
  })
})

function tableLabel(tableId) {
  return tables.value.find((t) => t.table_id === tableId)?.label || '—'
}
function seatedAt(tableId) {
  return activeGuests.value.filter((g) => g.table_id === tableId)
}

onMounted(loadPlan)

async function loadPlan() {
  isLoading.value = true
  pageError.value = ''
  try {
    const [t, g] = await Promise.all([getTables(props.booking.booking_id), getGuests(props.booking.booking_id)])
    tables.value = t
    guests.value = g
  } catch (e) {
    pageError.value = e.message
  } finally {
    isLoading.value = false
  }
}

// ---------- Guests ----------
function openGuestForm(guest = null) {
  formError.value = ''
  editingGuestId.value = guest?.guest_id || null
  guestForm.value = guest
    ? { ...guest, dietary_preferences: [...(guest.dietary_preferences || [])] }
    : blankGuest()
  showGuestForm.value = true
}

async function saveGuest() {
  formError.value = ''
  isSaving.value = true
  try {
    if (editingGuestId.value) {
      const saved = await updateGuest(editingGuestId.value, guestForm.value)
      guests.value = guests.value.map((g) => (g.guest_id === saved.guest_id ? saved : g))
    } else {
      const saved = await addGuest(props.booking.booking_id, guestForm.value)
      guests.value = [...guests.value, saved].sort((a, b) => a.full_name.localeCompare(b.full_name))
    }
    showGuestForm.value = false
  } catch (e) {
    formError.value = e.message
  } finally {
    isSaving.value = false
  }
}

async function runImport() {
  formError.value = ''
  isSaving.value = true
  try {
    const added = await importGuests(props.booking.booking_id, importText.value)
    guests.value = [...guests.value, ...added].sort((a, b) => a.full_name.localeCompare(b.full_name))
    importText.value = ''
    showImport.value = false
  } catch (e) {
    formError.value = e.message
  } finally {
    isSaving.value = false
  }
}

async function removeGuest(g) {
  if (!window.confirm(`Remove ${g.full_name} from the guest list?`)) return
  pageError.value = ''
  try {
    await deleteGuest(g.guest_id)
    guests.value = guests.value.filter((x) => x.guest_id !== g.guest_id)
  } catch (e) {
    pageError.value = e.message
  }
}

async function changeRsvp(g, status) {
  pageError.value = ''
  try {
    // A declined guest frees their seat.
    const saved = await updateGuest(g.guest_id, {
      ...g,
      rsvp_status: status,
      table_id: status === 'Declined' ? null : g.table_id
    })
    guests.value = guests.value.map((x) => (x.guest_id === saved.guest_id ? saved : x))
  } catch (e) {
    pageError.value = e.message
    await loadPlan()
  }
}

// ---------- Tables ----------
async function createTable() {
  pageError.value = ''
  try {
    const t = await addTable(props.booking.booking_id, newTableLabel.value, newTableCapacity.value)
    tables.value = [...tables.value, t]
    newTableLabel.value = ''
  } catch (e) {
    pageError.value = e.message
  }
}

async function saveTableEdit() {
  const t = editingTable.value
  if (!t) return
  pageError.value = ''
  if (Number(t.capacity) < seatedAt(t.table_id).length) {
    pageError.value = `${t.label} already has ${seatedAt(t.table_id).length} guests seated. Unseat some first.`
    return
  }
  try {
    await updateTable(t.table_id, t.label, t.capacity)
    tables.value = tables.value.map((x) =>
      x.table_id === t.table_id ? { ...x, label: String(t.label).trim(), capacity: Number(t.capacity) } : x
    )
    editingTable.value = null
  } catch (e) {
    pageError.value = e.message
  }
}

async function removeTable(t) {
  const n = seatedAt(t.table_id).length
  const msg = n ? `Delete ${t.label}? ${n} guest(s) will become unseated.` : `Delete ${t.label}?`
  if (!window.confirm(msg)) return
  pageError.value = ''
  try {
    await deleteTable(t.table_id)
    tables.value = tables.value.filter((x) => x.table_id !== t.table_id)
    guests.value = guests.value.map((g) => (g.table_id === t.table_id ? { ...g, table_id: null } : g))
  } catch (e) {
    pageError.value = e.message
  }
}

async function moveGuest(g, tableId) {
  pageError.value = ''
  try {
    await seatGuest(g.guest_id, tableId)
    guests.value = guests.value.map((x) => (x.guest_id === g.guest_id ? { ...x, table_id: tableId } : x))
  } catch (e) {
    pageError.value = e.message
  }
}

// Fills tables in order with everyone not yet seated.
async function autoFillTables() {
  pageError.value = ''
  isAutoSeating.value = true
  try {
    for (const g of [...unseatedGuests.value]) {
      const target = tables.value.find((t) => seatedAt(t.table_id).length < t.capacity)
      if (!target) {
        pageError.value = 'Not enough seats for everyone. Add another table.'
        break
      }
      await moveGuest(g, target.table_id)
      if (pageError.value) break
    }
  } finally {
    isAutoSeating.value = false
  }
}

// ---------- Export ----------
// Guest names are typed by users, so neutralise cells a spreadsheet could read as a formula.
function csvCell(value) {
  let s = String(value ?? '')
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`
  return `"${s.replace(/"/g, '""')}"`
}

function exportCsv() {
  const header = ['Name', 'Mobile', 'Email', 'RSVP', 'Table', 'Dietary', 'Allergies', 'Notes']
  const rows = guests.value.map((g) => [
    g.full_name, g.contact_number, g.email, g.rsvp_status,
    tableLabel(g.table_id) === '—' ? '' : tableLabel(g.table_id),
    (g.dietary_preferences || []).join('; '), g.allergies, g.notes
  ])
  const csv = '\uFEFF' + [header, ...rows].map((r) => r.map(csvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `guest-list-${String(props.booking.event_date).slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
</script>