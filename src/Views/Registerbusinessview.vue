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

      <form @submit.prevent="handleRegister" class="space-y-5">
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
import { registerBusiness } from '../services/businessService'

const router = useRouter()
const isLoading = ref(false)
const errorMessage = ref('')

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
    const businessId = await registerBusiness(form.value)

    // Keep the cached session user in sync so the rest of the app (route
    // guard in main.js, sidebars, etc.) immediately sees the new role
    // without requiring a fresh login.
    const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}')
    sessionStorage.setItem('user', JSON.stringify({
      ...storedUser,
      role: 'Owner/Manager',
      business_id: businessId,
    }))

    router.push('/admin/dashboard')
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
</style>