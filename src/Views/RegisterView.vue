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

          <!-- Honeypot: hidden from humans, bots tend to fill it -->
          <div aria-hidden="true" style="position:absolute;left:-9999px;width:1px;height:1px;overflow:hidden;">
            <label>Website</label>
            <input type="text" name="website" v-model="honeypot" tabindex="-1" autocomplete="off" />
          </div>

            <div v-if="errorMessage" role="alert" class="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <svg class="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              <span>{{ errorMessage }}</span>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Full Name</label>
              <input type="text" v-model="form.full_name" placeholder="Enter your full name" maxlength="100" autocomplete="name" class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" required />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Username</label>
              <input type="text" v-model="form.username" placeholder="Choose a username" maxlength="30" autocomplete="username" class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" required />
              <p class="text-xs text-gray-400">3-30 characters. Letters, numbers, dot (.), dash (-) or underscore (_). No spaces; a dot can't be first, last or doubled.</p>
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Contact Number</label>
              <input type="tel" v-model="form.contact_number" placeholder="e.g. 0917 123 4567" autocomplete="tel" class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" required />
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
              <div class="relative">
                <input
                  :type="showPassword ? 'text' : 'password'"
                  v-model="form.password"
                  autocomplete="new-password"
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
                autocomplete="new-password"
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
            <div v-if="otpErrorMessage" role="alert" class="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <svg class="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>
              <span>{{ otpErrorMessage }}</span>
            </div>

            <div v-if="otpInfoMessage" role="status" class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {{ otpInfoMessage }}
            </div>

            <div class="space-y-1.5">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">6-Digit Code</label>
              <input
                type="text"
                inputmode="numeric"
                autocomplete="one-time-code"
                maxlength="6"
                :value="otpCode"
                @input="otpCode = $event.target.value.replace(/\D/g, '')"
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
          <div class="text-center">
            <button type="button" @click="backToForm" class="text-gray-500 font-semibold text-sm hover:underline">
              Wrong number or details? Go back and edit
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
import { validatePassword } from '../utils/validators'
import {
  looksLikeBot,
  lockoutSecondsLeft,
  recordFailure,
  resetFailures,
  rateLimitSecondsLeft,
  recordHit,
  formatWait
} from '../utils/antibot'
import { requestRegistrationOtp, verifyRegistrationOtp, resendRegistrationOtp } from '../services/authService'

const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const honeypot = ref('')
const mountedAt = Date.now()

// Rate limits (client-side deterrent; the real limits are server-side).
// Every OTP text costs SMS credits, so cap sends and OTP guesses.
const SEND_KEY = 'register-otp-send'      // first send + resends share one budget
const SEND_MAX = 5                        // max texts...
const SEND_WINDOW = 10 * 60               // ...per 10 minutes
const RESEND_COOLDOWN = 60                // min gap between texts
const VERIFY_KEY = 'register-otp-verify'  // wrong-code lockout

// Once true, we show the OTP-entry screen instead of the form.
const accountCreated = ref(false)

// Once true (after a correct OTP), we show the "go sign in" screen
// instead of the OTP-entry screen.
const phoneVerified = ref(false)

const otpCode = ref('')
const otpErrorMessage = ref('')
const otpInfoMessage = ref('')
const isVerifying = ref(false)
const isResending = ref(false)

const form = ref({
  full_name: '',
  username: '',
  contact_number: '',
  password: '',
  confirmPassword: ''
})

// Server answers 400/409/429 BEFORE any SMS goes out (bad input, taken
// username/number, cooldown), so those must not use up the user's SMS budget.
const noSmsSent = (error) => [400, 409, 429].includes(error?.status)

// Same rule as the server: no leading, trailing or doubled dot. The username
// becomes the local part of the internal login email, and those forms are
// rejected by Supabase Auth -- which used to happen AFTER the OTP was used up.
const USERNAME_RE = /^[A-Za-z0-9._-]{3,30}$/
const isValidUsername = (u) => USERNAME_RE.test(u) && !/^\.|\.$|\.\./.test(u)

const handleRegister = async () => {
  errorMessage.value = ''

  // Bot check: silently reject (no hint about the honeypot).
  if (looksLikeBot(honeypot.value, mountedAt, 3000)) {
    errorMessage.value = 'Something went wrong. Please try again.'
    return
  }

  form.value.full_name = form.value.full_name.trim().replace(/\s+/g, ' ')
  if (!form.value.full_name) {
    errorMessage.value = 'Please enter your full name.'
    return
  }

  form.value.username = form.value.username.trim()
  if (!isValidUsername(form.value.username)) {
    errorMessage.value = 'Username must be 3-30 characters using letters, numbers, dot, dash or underscore only (no spaces; a dot cannot be first, last or doubled).'
    return
  }

  form.value.contact_number = form.value.contact_number.trim()
  if (!form.value.contact_number) {
    errorMessage.value = 'Contact number is required.'
    return
  }

  if (!/^(09\d{9}|\+?639\d{9})$/.test(form.value.contact_number.replace(/[\s-]/g, ''))) {
    errorMessage.value = 'Enter a valid Philippine mobile number, e.g. 0917 123 4567.'
    return
  }

  // Login and the server both trim the password, so trim here BEFORE checking
  // length/match -- otherwise "abcdef1 " passes here but is rejected by the
  // server after the SMS was already sent.
  form.value.password = form.value.password.trim()
  form.value.confirmPassword = form.value.confirmPassword.trim()

  if (form.value.password !== form.value.confirmPassword) {
    errorMessage.value = 'Passwords do not match.'
    return
  }

  const passwordError = validatePassword(form.value.password)
  if (passwordError) {
    errorMessage.value = passwordError
    return
  }

  const sendWait = rateLimitSecondsLeft(SEND_KEY, SEND_MAX, SEND_WINDOW, RESEND_COOLDOWN)
  if (sendWait > 0) {
    errorMessage.value = `Too many code requests. Please try again in ${formatWait(sendWait)}.`
    return
  }

  isLoading.value = true

  try {
    // Texts the OTP. The account is only created after the code is verified.
    await requestRegistrationOtp(form.value.username, form.value.contact_number)
    recordHit(SEND_KEY, SEND_WINDOW)
    otpCode.value = ''
    otpErrorMessage.value = ''
    otpInfoMessage.value = ''
    accountCreated.value = true  // switch to the OTP screen
  } catch (error) {
    if (!noSmsSent(error)) recordHit(SEND_KEY, SEND_WINDOW)
    errorMessage.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}

const handleVerifyOtp = async () => {
  otpErrorMessage.value = ''
  otpInfoMessage.value = ''

  const locked = lockoutSecondsLeft(VERIFY_KEY)
  if (locked > 0) {
    otpErrorMessage.value = `Too many wrong codes. Try again in ${formatWait(locked)}.`
    return
  }

  otpCode.value = otpCode.value.trim()
  if (!/^\d{6}$/.test(otpCode.value)) {
    otpErrorMessage.value = 'Enter the 6-digit code from the SMS.'
    return
  }

  isVerifying.value = true

  try {
    await verifyRegistrationOtp(form.value, otpCode.value)
    resetFailures(VERIFY_KEY)
    phoneVerified.value = true
  } catch (error) {
    // Only a rejected code (400) counts as a wrong guess. A taken username
    // (409), a server error (5xx) or a dropped connection are not the user's
    // fault and must not lock them out.
    const wrongGuess = error.status === 400
    const wait = wrongGuess ? recordFailure(VERIFY_KEY, 5, 60) : 0
    otpErrorMessage.value = wait > 0
      ? `Too many wrong codes. Try again in ${formatWait(wait)}.`
      : (error.message || 'Invalid or expired code. Please try again.')
  } finally {
    isVerifying.value = false
  }
}

const handleResendOtp = async () => {
  otpErrorMessage.value = ''
  otpInfoMessage.value = ''

  const wait = rateLimitSecondsLeft(SEND_KEY, SEND_MAX, SEND_WINDOW, RESEND_COOLDOWN)
  if (wait > 0) {
    otpErrorMessage.value = `Please wait ${formatWait(wait)} before requesting another code.`
    return
  }

  isResending.value = true

  try {
    await resendRegistrationOtp(form.value.contact_number, form.value.username)
    recordHit(SEND_KEY, SEND_WINDOW)
    otpCode.value = ''
    otpInfoMessage.value = 'A new code was sent. Older codes no longer work.'
  } catch (error) {
    if (!noSmsSent(error)) recordHit(SEND_KEY, SEND_WINDOW)
    otpErrorMessage.value = error.message || 'Could not resend code. Please try again.'
  } finally {
    isResending.value = false
  }
}

// Typed the wrong number/username? Without this the user was stuck on the
// OTP screen until they refreshed the page.
const backToForm = () => {
  otpCode.value = ''
  otpErrorMessage.value = ''
  otpInfoMessage.value = ''
  errorMessage.value = ''
  accountCreated.value = false
}
</script>

<style scoped>
</style>