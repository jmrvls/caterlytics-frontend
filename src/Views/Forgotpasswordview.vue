<template>
  <div class="min-h-screen flex items-center justify-center bg-gray-50 font-sans p-6">
    <div class="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">

      <div class="flex items-center gap-2 mb-6">
        <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain" />
        <span class="font-bold text-gray-800">Caterlytics</span>
      </div>

      <!-- STEP 1: ask for phone number -->
      <template v-if="step === 'phone'">
        <h3 class="text-2xl font-extrabold text-gray-900 tracking-tight">Forgot Password</h3>
        <p class="text-sm text-gray-500 font-medium mt-1 mb-6">
          Enter the contact number on your account, and we'll text you a 6-digit code.
        </p>

        <div v-if="errorMessage" class="text-red-600 text-sm font-medium mb-4">{{ errorMessage }}</div>

        <form @submit.prevent="handleSendOtp" class="space-y-5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Contact Number</label>
            <input
              type="tel"
              v-model="contact_number"
              placeholder="e.g. 0917 123 4567"
              required
              class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <button type="submit" :disabled="isLoading" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition disabled:opacity-50">
            {{ isLoading ? 'Sending...' : 'Send Code' }}
          </button>
        </form>
      </template>

      <!-- STEP 2: enter the OTP -->
      <template v-else-if="step === 'otp'">
        <h3 class="text-2xl font-extrabold text-gray-900 tracking-tight">Enter Code</h3>
        <p class="text-sm text-gray-500 font-medium mt-1 mb-6">
          We sent a 6-digit code to <span class="font-bold text-gray-700">{{ contact_number }}</span>.
        </p>

        <div v-if="errorMessage" class="text-red-600 text-sm font-medium mb-4">{{ errorMessage }}</div>

        <form @submit.prevent="handleVerifyOtp" class="space-y-5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">6-Digit Code</label>
            <input
              type="text"
              inputmode="numeric"
              maxlength="6"
              v-model="otpCode"
              placeholder="123456"
              required
              class="w-full p-3.5 text-center text-2xl tracking-[0.5em] bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
            />
          </div>

          <button type="submit" :disabled="isLoading" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition disabled:opacity-50">
            {{ isLoading ? 'Verifying...' : 'Verify Code' }}
          </button>
        </form>

        <div class="text-center pt-4">
          <button type="button" @click="handleResendOtp" :disabled="isLoading" class="text-emerald-600 font-bold text-sm hover:underline disabled:opacity-50">
            Didn't get a code? Resend
          </button>
        </div>
      </template>

      <!-- STEP 3: set new password -->
      <template v-else-if="step === 'newPassword'">
        <h3 class="text-2xl font-extrabold text-gray-900 tracking-tight">Set New Password</h3>
        <p class="text-sm text-gray-500 font-medium mt-1 mb-6">
          Your code is verified. Choose a new password below.
        </p>

        <div v-if="errorMessage" class="text-red-600 text-sm font-medium mb-4">{{ errorMessage }}</div>

        <form @submit.prevent="handleSetNewPassword" class="space-y-5">
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">New Password</label>
            <input
              type="password"
              v-model="newPassword"
              placeholder="••••••••"
              required
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
      </template>

      <!-- DONE -->
      <template v-else>
        <h3 class="text-2xl font-extrabold text-gray-900 tracking-tight">Password Updated!</h3>
        <p class="text-sm text-gray-500 font-medium mt-1 mb-6">
          You can now sign in with your new password.
        </p>
      </template>

      <div class="text-center pt-6">
        <router-link to="/" class="text-emerald-600 font-bold text-sm hover:underline">Back to Sign In</router-link>
      </div>

    </div>
  </div>
</template>

<script setup>
import logoUrl from '../Assets/logofinal.png'
import { ref } from 'vue'
import { requestPasswordReset, verifyPasswordResetOtp, resendPasswordResetOtp, setNewPasswordAfterReset } from '../services/authService'

// 'phone' -> 'otp' -> 'newPassword' -> 'done'
const step = ref('phone')

const contact_number = ref('')
const otpCode = ref('')
const newPassword = ref('')
const confirmPassword = ref('')

const isLoading = ref(false)
const errorMessage = ref('')

async function handleSendOtp() {
  errorMessage.value = ''
  isLoading.value = true
  try {
    await requestPasswordReset(contact_number.value)
    step.value = 'otp'
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleVerifyOtp() {
  errorMessage.value = ''
  isLoading.value = true
  try {
    await verifyPasswordResetOtp(contact_number.value, otpCode.value)
    step.value = 'newPassword'
  } catch (error) {
    errorMessage.value = error.message || 'Invalid or expired code. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleResendOtp() {
  errorMessage.value = ''
  isLoading.value = true
  try {
    await resendPasswordResetOtp(contact_number.value)
  } catch (error) {
    errorMessage.value = error.message || 'Could not resend code. Please try again.'
  } finally {
    isLoading.value = false
  }
}

async function handleSetNewPassword() {
  errorMessage.value = ''

  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = 'Passwords do not match.'
    return
  }
  if (newPassword.value.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long.'
    return
  }
  if (!/[A-Za-z]/.test(newPassword.value) || !/[0-9]/.test(newPassword.value)) {
    errorMessage.value = 'Password must contain at least one letter and one number.'
    return
  }

  isLoading.value = true
  try {
    await setNewPasswordAfterReset(newPassword.value)
    step.value = 'done'
  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>