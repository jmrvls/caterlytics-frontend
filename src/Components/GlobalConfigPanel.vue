<template>
  <!-- Super Admin: Global Configuration & Policy Control -->
  <div>
    <div class="mb-4">
      <h2 class="font-bold text-gray-900 dark:text-gray-100">Global Configuration &amp; Policy</h2>
      <p class="text-xs text-gray-400">
        System-wide rules that apply to every catering business: how far ahead clients can book, the cancellation
        policy, and the default currency, tax and service fee.
      </p>
    </div>

    <div v-if="loading" class="p-8 text-center text-gray-400 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
      Loading settings…
    </div>

    <div v-else-if="!ready" class="p-4 text-sm text-amber-800 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-300 border border-amber-200 dark:border-amber-700">
      Global settings are not set up yet. Run <span class="font-mono font-semibold">global_config.sql</span> in the Supabase SQL Editor, then reload this page.
    </div>

    <template v-else>
      <div v-if="formError" class="p-3 mb-4 text-sm text-red-600 bg-red-50 dark:bg-red-900/20">{{ formError }}</div>
      <div v-if="formSuccess" class="p-3 mb-4 text-sm text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20">{{ formSuccess }}</div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        <div class="lg:col-span-2 space-y-4 sm:space-y-6">

          <!-- BOOKING RULES -->
          <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100">Booking rules</h3>
            <p class="text-xs text-gray-400 mb-3">Enforced on client bookings by the database, not just the screen.</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label :class="labelCls">Minimum lead time (days)</label>
                <input v-model.number="form.min_lead_days" type="number" min="0" max="365" step="1" :class="inputCls" />
                <p :class="hintCls">Earliest a client can book is {{ form.min_lead_days || 0 }} day(s) from today.</p>
              </div>
              <div>
                <label :class="labelCls">Max advance booking (days)</label>
                <input v-model.number="form.max_advance_days" type="number" min="1" max="1095" step="1" :class="inputCls" />
                <p :class="hintCls">Furthest date a client can book.</p>
              </div>
              <div>
                <label :class="labelCls">Max guests per booking</label>
                <input v-model.number="form.max_guests" type="number" min="1" max="100000" step="1" :class="inputCls" />
                <p :class="hintCls">Applies to everyone, including staff.</p>
              </div>
            </div>
          </section>

          <!-- CANCELLATION -->
          <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100">Cancellation policy</h3>
            <p class="text-xs text-gray-400 mb-3">Shown to clients and applied when they cancel their own booking.</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label :class="labelCls">Online cancellation closes (days before event)</label>
                <input v-model.number="form.cancel_min_days" type="number" min="0" max="365" step="1" :class="inputCls" />
                <p :class="hintCls">0 = clients can cancel any time before the event.</p>
              </div>
              <div class="sm:col-span-2">
                <label :class="labelCls">
                  Policy text <span class="font-normal">({{ (form.cancellation_policy || '').length }}/1000)</span>
                </label>
                <textarea v-model="form.cancellation_policy" rows="3" maxlength="1000" :class="inputCls"></textarea>
              </div>
            </div>
          </section>

          <!-- MONEY -->
          <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100">Currency, tax &amp; service fee</h3>
            <p class="text-xs text-gray-400 mb-3">Platform defaults shown on client quotes.</p>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div class="sm:col-span-3">
                <label :class="labelCls">Currency</label>
                <select :value="form.currency_code" @change="pickCurrency($event.target.value)" :class="inputCls">
                  <option v-for="c in CURRENCY_OPTIONS" :key="c.code" :value="c.code">{{ c.label }}</option>
                </select>
              </div>
              <div>
                <label :class="labelCls">Tax label</label>
                <input v-model="form.tax_label" maxlength="20" type="text" placeholder="VAT" :class="inputCls" />
              </div>
              <div>
                <label :class="labelCls">Tax rate (%)</label>
                <input v-model.number="form.tax_rate_percent" type="number" min="0" max="100" step="0.01" :class="inputCls" />
                <p :class="hintCls">PH VAT is 12%. Use 0 if not applicable.</p>
              </div>
              <div></div>
              <div>
                <label :class="labelCls">Service fee type</label>
                <select v-model="form.service_fee_type" :class="inputCls">
                  <option value="percent">Percent of subtotal (%)</option>
                  <option value="fixed">Fixed amount per booking</option>
                </select>
              </div>
              <div>
                <label :class="labelCls">Service fee {{ form.service_fee_type === 'percent' ? '(%)' : `(${form.currency_symbol})` }}</label>
                <input v-model.number="form.service_fee_value" type="number" min="0" step="0.01" :class="inputCls" />
              </div>
            </div>
          </section>

          <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <p class="text-xs text-gray-400">
              <template v-if="updatedAt">Last saved {{ formatDateTime(updatedAt) }}</template>
              <template v-else>Using the starting defaults.</template>
            </p>
            <div class="flex gap-2">
              <button type="button" @click="reset" :disabled="saving || !dirty"
                class="px-4 py-2 text-sm font-semibold border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-40">
                Discard changes
              </button>
              <button type="button" @click="save" :disabled="saving || !dirty"
                class="px-5 py-2 text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40">
                {{ saving ? 'Saving…' : 'Save settings' }}
              </button>
            </div>
          </div>
        </div>

        <!-- LIVE PREVIEW -->
        <aside class="space-y-4 sm:space-y-6">
          <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100">Client quote preview</h3>
            <p class="text-xs text-gray-400 mb-3">Sample booking: {{ money(SAMPLE_SUBTOTAL) }} package total.</p>
            <dl class="text-sm space-y-1.5">
              <div class="flex justify-between"><dt class="text-gray-500 dark:text-gray-400">Subtotal</dt><dd class="text-gray-800 dark:text-gray-100">{{ money(SAMPLE_SUBTOTAL) }}</dd></div>
              <div class="flex justify-between"><dt class="text-gray-500 dark:text-gray-400">Service fee</dt><dd class="text-gray-800 dark:text-gray-100">{{ money(preview.serviceFee) }}</dd></div>
              <div class="flex justify-between"><dt class="text-gray-500 dark:text-gray-400">{{ form.tax_label || 'Tax' }} ({{ Number(form.tax_rate_percent) || 0 }}%)</dt><dd class="text-gray-800 dark:text-gray-100">{{ money(preview.tax) }}</dd></div>
              <div class="flex justify-between pt-2 mt-2 border-t border-gray-100 dark:border-gray-700 font-bold"><dt class="text-gray-800 dark:text-gray-100">Total</dt><dd class="text-emerald-600 dark:text-emerald-400">{{ money(preview.total) }}</dd></div>
            </dl>
          </section>

          <section class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <h3 class="text-sm font-bold text-gray-800 dark:text-gray-100">What clients will see</h3>
            <ul class="mt-2 text-xs text-gray-600 dark:text-gray-300 space-y-1.5 list-disc pl-4">
              <li>Event date: {{ form.min_lead_days || 0 }} to {{ form.max_advance_days || 0 }} days from today</li>
              <li>Up to {{ Number(form.max_guests || 0).toLocaleString() }} guests</li>
              <li v-if="Number(form.cancel_min_days) > 0">Cancel online until {{ form.cancel_min_days }} day(s) before</li>
              <li v-else>Cancel online any time before the event</li>
            </ul>
          </section>
        </aside>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { logActivity } from '../services/activitylogservice'
import {
  getPlatformSettings, savePlatformSettings, computeFees, CURRENCY_OPTIONS, SETTINGS_DEFAULTS,
} from '../services/platformSettingsService'

const SAMPLE_SUBTOTAL = 50000

const labelCls = 'block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1'
const hintCls = 'text-[11px] text-gray-400 mt-1'
const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 rounded-none focus:outline-none focus:ring-2 focus:ring-emerald-500'

const loading = ref(true)
const ready = ref(false)
const saving = ref(false)
const formError = ref('')
const formSuccess = ref('')
const updatedAt = ref(null)

const form = ref({ ...SETTINGS_DEFAULTS })
const saved = ref({ ...SETTINGS_DEFAULTS })

const dirty = computed(() => JSON.stringify(form.value) !== JSON.stringify(saved.value))
const preview = computed(() => computeFees(form.value, SAMPLE_SUBTOTAL))

function money(n) {
  return `${form.value.currency_symbol || ''}${Number(n || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function formatDateTime(v) {
  return new Date(v).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

function pickCurrency(code) {
  const c = CURRENCY_OPTIONS.find((o) => o.code === code)
  if (!c) return
  form.value.currency_code = c.code
  form.value.currency_symbol = c.symbol
}

async function load() {
  loading.value = true
  const res = await getPlatformSettings({ force: true })
  ready.value = res.ready
  form.value = { ...res.settings }
  saved.value = { ...res.settings }
  updatedAt.value = res.updated_at || null
  loading.value = false
}

function reset() {
  form.value = { ...saved.value }
  formError.value = ''
  formSuccess.value = ''
}

function changedSummary() {
  return Object.keys(form.value)
    .filter((k) => form.value[k] !== saved.value[k])
    .map((k) => `${k}: ${saved.value[k]} → ${form.value[k]}`)
    .join('; ')
}

async function save() {
  formError.value = ''
  formSuccess.value = ''
  saving.value = true
  try {
    const summary = changedSummary()
    const result = await savePlatformSettings(form.value)
    form.value = { ...result }
    saved.value = { ...result }
    updatedAt.value = new Date().toISOString()
    formSuccess.value = 'Settings saved. They now apply to every catering business.'
    logActivity('UPDATE', 'Global Config', `Changed platform settings (${summary})`.slice(0, 500))
  } catch (e) {
    formError.value = e?.message || 'Failed to save settings.'
  } finally {
    saving.value = false
  }
}

onMounted(load)
</script>