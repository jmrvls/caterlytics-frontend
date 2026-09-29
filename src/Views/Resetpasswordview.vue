<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-6">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

      <div class="flex items-center gap-2 mb-6">
        <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain" />
        <span class="font-bold text-gray-800">Caterlytics</span>
      </div>

      <h3 class="text-2xl font-extrabold text-gray-900 tracking-tight">Set a New Password</h3>
      <p class="text-sm text-gray-500 font-medium mt-1 mb-6">
        Choose a new password for your account.
      </p>

      <div v-if="!sessionReady && !checkingSession" class="text-red-600 text-sm font-medium mb-4">
        This reset link is invalid or has expired. Please request a new one.
      </div>

      <div v-if="errorMessage" class="text-red-600 text-sm font-medium mb-4">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium p-3 rounded-xl mb-4">
        {{ successMessage }}
      </div>

      <form v-if="sessionReady && !successMessage" @submit.prevent="handleSubmit" class="space-y-5">
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500">New Password</label>
          <input
            type="password"
            v-model="password"
            placeholder="••••••••"
            required
            minlength="6"
            class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Confirm New Password</label>
          <input
            type="password"
            v-model="confirmPassword"
            placeholder="••••••••"
            required
            class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        <button type="submit" :disabled="isLoading" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition disabled:opacity-50">
          {{ isLoading ? 'Saving...' : 'Save New Password' }}
        </button>
      </form>

      <div v-if="successMessage" class="text-center pt-2">
        <router-link to="/" class="text-emerald-600 font-bold text-sm hover:underline">Go to Sign In</router-link>
      </div>

      <div v-if="!sessionReady && !checkingSession" class="text-center pt-6">
        <router-link to="/forgot-password" class="text-emerald-600 font-bold text-sm hover:underline">Request a new link</router-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import logoUrl from '../Assets/logofinal.png'
import { ref, onMounted } from 'vue'
import { supabase } from '../supabaseClient'
import { updatePassword } from '../services/authService'

const password = ref('')
const confirmPassword = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const checkingSession = ref(true)
const sessionReady = ref(false)

// Clicking the emailed link redirects here with a token that Supabase
// exchanges for a temporary session automatically. We just confirm one exists.
onMounted(async () => {
  const { data } = await supabase.auth.getSession()
  sessionReady.value = !!data.session
  checkingSession.value = false
})

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''

  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  isLoading.value = true
  try {
    await updatePassword(password.value)
    successMessage.value = 'Your password has been updated. You can now sign in.'
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>