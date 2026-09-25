<template>
  <div class="min-h-screen flex w-full font-sans bg-white">

    <!-- LEFT SIDE -->
    <div class="hidden lg:flex w-1/2 relative overflow-hidden bg-gray-50 border-r border-gray-200">

      <!-- System Branding Logo: flush to top-left corner -->
      <img
        :src="logoUrl"
        alt="Logo"
        class="absolute top-6 left-6 w-16 h-16 object-contain z-20"
      />

      <!-- Center Visual Mockup Area: fills the entire panel edge-to-edge -->
      <div class="absolute inset-0 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-6 2xl:p-10">
        <img
          :src="loginBgUrl"
          alt="Catering Display"
          class="w-full h-full object-contain max-w-none scale-110 xl:scale-125 2xl:scale-100"
        />
      </div>

      <!-- Bottom Section: flush to bottom-left corner -->
      <div class="absolute bottom-10 left-8 right-8 z-20">
        <h2 class="text-3xl lg:text-4xl xl:text-5xl font-black text-gray-900 leading-tight lg:leading-none tracking-tight">
          Join us <br />
          and start <br />
          <span class="text-emerald-600">booking today.</span>
        </h2>
      </div>
    </div>

    <!-- RIGHT SIDE -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
      <div class="w-full max-w-md space-y-8">

        <!-- Registration form -->
        <template v-if="!accountCreated">
          <div class="space-y-2">
            <h3 class="text-3xl font-extrabold text-gray-900 tracking-tight">Create Account</h3>
            <p class="text-sm text-gray-500 font-medium">Sign up to start booking catering services.</p>
          </div>

          <form @submit.prevent="handleRegister" class="space-y-5">

            <div v-if="errorMessage" class="text-red-600 text-sm font-medium">
              {{ errorMessage }}
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
              <input type="text" v-model="form.full_name" placeholder="Enter your full name" class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" required />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Username</label>
              <input type="text" v-model="form.username" placeholder="Choose a username" class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" required />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Contact Number</label>
              <input type="tel" v-model="form.contact_number" placeholder="e.g. 0917 123 4567" class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" required />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
              <div class="relative">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="form.password"
                  placeholder="••••••••"
                  class="w-full p-3.5 pr-12 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  required
                />
                <button type="button" @click="showPassword = !showPassword" class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-600 focus:outline-none">
                  <svg v-if="!showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 012.122-.363c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                  </svg>
                </button>
              </div>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Confirm Password</label>
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="form.confirmPassword"
                placeholder="••••••••"
                class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                required
              />
            </div>

            <button type="submit" :disabled="isLoading" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition shadow-md shadow-emerald-100 mt-2 disabled:opacity-50">
              {{ isLoading ? 'Creating account...' : 'Create Account' }}
            </button>
          </form>

          <div class="text-center pt-2">
            <p class="text-sm text-gray-500 font-medium">
              Already have an account? <router-link to="/" class="text-emerald-600 font-bold hover:underline">Sign in</router-link>
            </p>
          </div>
        </template>

        <!-- Post-signup: ask for the SMS OTP sent to their phone -->
        <template v-else-if="!phoneVerified">
          <div class="space-y-2">
            <h3 class="text-3xl font-extrabold text-gray-900 tracking-tight">Verify your number</h3>
            <p class="text-sm text-gray-500 font-medium">
              We sent a 6-digit code by SMS to <span class="font-bold text-gray-700">{{ form.contact_number }}</span>. Enter it below to activate your account.
            </p>
          </div>

          <form @submit.prevent="handleVerifyOtp" class="space-y-5">
            <div v-if="otpErrorMessage" class="text-red-600 text-sm font-medium">
              {{ otpErrorMessage }}
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">6-Digit Code</label>
              <input
                type="text"
                inputmode="numeric"
                maxlength="6"
                v-model="otpCode"
                placeholder="123456"
                class="w-full p-3.5 text-center text-2xl tracking-[0.5em] bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                required
              />
            </div>

            <button type="submit" :disabled="isVerifying" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition shadow-md shadow-emerald-100 disabled:opacity-50">
              {{ isVerifying ? 'Verifying...' : 'Verify & Activate Account' }}
            </button>
          </form>

          <div class="text-center pt-2">
            <button type="button" @click="handleResendOtp" :disabled="isResending" class="text-emerald-600 font-bold text-sm hover:underline disabled:opacity-50">
              {{ isResending ? 'Resending...' : "Didn't get a code? Resend" }}
            </button>
          </div>
        </template>

        <!-- Account created: send them to sign in -->
        <template v-else>
          <div class="space-y-2">
            <h3 class="text-3xl font-extrabold text-gray-900 tracking-tight">Account created!</h3>
            <p class="text-sm text-gray-500 font-medium">
              You can now sign in with your username and password.
            </p>
          </div>

          <div class="text-center pt-2">
            <router-link to="/" class="text-emerald-600 font-bold text-sm hover:underline">Go to Sign In</router-link>
          </div>
        </template>

        <div class="text-center pt-6 border-t border-gray-100">
          <span class="text-gray-400 text-xs font-bold tracking-widest uppercase">Caterlytics</span>
        </div>

      </div>
    </div>

  </div>
</template>

<script setup>
import logoUrl from '../Assets/logofinal.png'
import loginBgUrl from '../Assets/login-bg.png'
import { ref } from 'vue'
import { registerUser, verifyRegistrationOtp, resendRegistrationOtp } from '../services/authService'

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Once true, we show the OTP-entry screen instead of the form.
const accountCreated = ref(false)

// Once true (after a correct OTP), we show the "go sign in" screen
// instead of the OTP-entry screen.
const phoneVerified = ref(false)

const otpCode = ref('')
const otpErrorMessage = ref('')
const isVerifying = ref(false)
const isResending = ref(false)

const form = ref({
  full_name: '',
  username: '',
  contact_number: '',
  password: '',
  confirmPassword: ''
})

const handleRegister = async () => {
  errorMessage.value = ''

  if (!form.value.contact_number || !form.value.contact_number.trim()) {
    errorMessage.value = 'Contact number is required.'
    return
  }

  if (!/^[+]?[\d\s-]{7,}$/.test(form.value.contact_number.trim())) {
    errorMessage.value = 'Please enter a valid contact number.'
    return
  }

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  if (form.value.password.length < 8) {
    errorMessage.value = 'Password must be at least 8 characters long.'
    return
  }

  if (!/[A-Za-z]/.test(form.value.password) || !/[0-9]/.test(form.value.password)) {
    errorMessage.value = 'Password must contain at least one letter and one number.'
    return
  }

  isLoading.value = true

  try {
    await registerUser(form.value.username, form.value.password, form.value.full_name, form.value.contact_number)
    phoneVerified.value = true
    accountCreated.value = true
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      errorMessage.value = error.response.data.error
    } else {
      errorMessage.value = error.message || 'Something went wrong. Please try again.'
    }
  } finally {
    isLoading.value = false
  }
}

const handleVerifyOtp = async () => {
  otpErrorMessage.value = ''
  isVerifying.value = true

  try {
    await verifyRegistrationOtp(form.value.contact_number, otpCode.value)
    phoneVerified.value = true
  } catch (error) {
    otpErrorMessage.value = error.message || 'Invalid or expired code. Please try again.'
  } finally {
    isVerifying.value = false
  }
}

const handleResendOtp = async () => {
  otpErrorMessage.value = ''
  isResending.value = true

  try {
    await resendRegistrationOtp(form.value.contact_number)
  } catch (error) {
    otpErrorMessage.value = error.message || 'Could not resend code. Please try again.'
  } finally {
    isResending.value = false
  }
}
</script>

<style scoped>
</style>