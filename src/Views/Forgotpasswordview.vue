<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-6">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

      <div class="flex items-center gap-2 mb-6">
        <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain" />
        <span class="font-bold text-gray-800">Caterlytics</span>
      </div>

      <h3 class="text-2xl font-extrabold text-gray-900 tracking-tight">Forgot Password</h3>
      <p class="text-sm text-gray-500 font-medium mt-1 mb-6">
        Enter the email you used to sign up, and we'll send you a link to reset your password.
      </p>

      <div v-if="errorMessage" class="text-red-600 text-sm font-medium mb-4">
        {{ errorMessage }}
      </div>

      <div v-if="successMessage" class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium p-3 rounded-xl mb-4">
        {{ successMessage }}
      </div>

      <form v-if="!successMessage" @submit.prevent="handleSubmit" class="space-y-5">
        <div class="space-y-1.5">
          <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Email</label>
          <input
            type="email"
            v-model="email"
            placeholder="you@example.com"
            required
            class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
          />
        </div>

        <button type="submit" :disabled="isLoading" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition disabled:opacity-50">
          {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
        </button>
      </form>

      <div class="text-center pt-6">
        <router-link to="/" class="text-emerald-600 font-bold text-sm hover:underline">Back to Sign In</router-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import logoUrl from '../Assets/logofinal.png'
import { ref } from 'vue'
import { requestPasswordReset } from '../services/authService'

const email = ref('')
const isLoading = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

async function handleSubmit() {
  errorMessage.value = ''
  successMessage.value = ''
  isLoading.value = true
  try {
    await requestPasswordReset(email.value)
    successMessage.value = "If an account exists for that email, we've sent a reset link. Please check your inbox."
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>