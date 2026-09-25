<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 font-sans px-4 py-10">
    <div class="w-full max-w-md bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-8 space-y-6">

      <div class="space-y-2">
        <h3 class="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Register your business</h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Set up your catering business on Caterlytics. You'll become the owner/manager
          of your own bookings, inventory, and packages — separate from every other
          business on the platform.
        </p>
      </div>

      <div v-if="errorMessage" class="text-red-600 dark:text-red-300 text-sm font-medium">
        {{ errorMessage }}
      </div>

      <div v-if="submitted" class="text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4 text-sm font-medium space-y-3">
        <p>Business submitted! It's now pending approval by the platform admin — you'll be able to log in as its owner once it's approved.</p>
        <router-link to="/" class="inline-block font-bold underline">Back to login</router-link>
      </div>

      <form v-else @submit.prevent="handleRegister" class="space-y-5">
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Business Name</label>
          <input
            type="text"
            v-model="form.business_name"
            placeholder="e.g. Dorado Catering Services"
            class="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            required
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact Email</label>
          <input
            type="email"
            v-model="form.contact_email"
            placeholder="business@example.com"
            class="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact Number</label>
          <input
            type="tel"
            v-model="form.contact_number"
            placeholder="e.g. 0917 123 4567"
            class="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Business Address</label>
          <input
            type="text"
            v-model="form.address"
            placeholder="e.g. Roxas City, Capiz"
            class="w-full p-3.5 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition shadow-md shadow-emerald-100 disabled:opacity-50"
        >
          {{ isLoading ? 'Setting up your business...' : 'Register My Business' }}
        </button>
      </form>

      <div class="text-center pt-2">
        <button type="button" @click="router.back()" class="text-sm text-gray-400 dark:text-gray-500 font-medium hover:underline">
          Cancel and go back
        </button>
      </div>

    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { registerBusiness } from '../services/businessservice'
import { logoutUser } from '../services/authService'

const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')
const submitted = ref(false)

const form = ref({
  business_name: '',
  contact_email: '',
  contact_number: '',
  address: '',
})

const handleRegister = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    await registerBusiness(form.value)

    // A brand-new business starts as 'Pending' and can't be used until the
    // platform Super Admin approves it (see set_business_status()) -- so
    // unlike the old behavior, we deliberately do NOT drop the new owner
    // straight into /admin/dashboard here. That would let them use the
    // dashboard immediately, bypassing the approval gate entirely (the gate
    // only runs at login). Sign them out and send them back to login,
    // same as the normal Client sign-up flow already does.
    await logoutUser()
    sessionStorage.removeItem('token')
    sessionStorage.removeItem('user')
    submitted.value = true
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
</style>