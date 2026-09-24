<template>
  <!-- Main Container: Split-screen layout -->
  <div class="min-h-screen flex w-full font-sans bg-gradient-to-br from-emerald-50 via-white to-gray-50">

    <!-- LEFT SIDE: Manuscript & Institution Details -->
    <div class="hidden lg:flex lg:flex-col w-1/2 h-screen overflow-hidden bg-gray-50 border-r border-gray-200 p-8">

      <!-- System Branding Logo -->
      <img
        :src="logoUrl"
        alt="Logo"
        class="w-14 h-14 object-contain flex-shrink-0"
      />

      <!-- Center Visual Mockup Area: shrinks to fit remaining space, never overlaps text below -->
      <div class="flex-1 min-h-0 flex items-center justify-center py-2 lg:py-1 xl:py-2 2xl:py-4 overflow-hidden">
        <img
          :src="loginBgUrl"
          alt="Catering Display"
          class="w-full h-full object-contain max-w-none scale-110 xl:scale-125 2xl:scale-100"
        />
      </div>

      <!-- Bottom Section -->
      <div class="flex-shrink-0 pb-4">
        <h2 class="text-4xl xl:text-5xl font-black text-gray-900 leading-none tracking-tight">
          Manage <br />
          the events <br />
          <span class="text-emerald-600">you love.</span>
        </h2>
      </div>
    </div>

    <!-- RIGHT SIDE: System Authentic Log In Form Section -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white lg:bg-transparent">
      <div class="w-full space-y-8 lg:bg-white lg:p-10 lg:rounded-3xl lg:shadow-xl lg:shadow-gray-100" style="max-width: clamp(360px, 32vw, 480px)">

        <!-- Email Confirmed Banner -->
        <div v-if="showConfirmedBanner" class="bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium p-3 rounded-xl">
          ✅ Your email is confirmed. You can log in now.
        </div>

        <!-- Form Heading -->
        <div>
          <h1 class="text-2xl font-black text-gray-900">Log in to Caterlytics</h1>
        </div>

        <!-- Log In Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">

          <!-- Account Identity Field -->
          <div class="space-y-1.5">
            <input type="text" v-model="form.username" placeholder="Username or Number" class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" required />
          </div>

          <!-- Account Security Field with Show/Hide Toggle -->
          <div class="space-y-1.5">
            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                placeholder="Password"
                class="w-full p-3.5 pr-12 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                required
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-emerald-600 focus:outline-none"
              >
                <!-- Eye Open Icon (Show) -->
                <svg v-if="!showPassword" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <!-- Eye Slash Icon (Hide) -->
                <svg v-else class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858-5.908a8.962 8.962 0 012.122-.363c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21l-9-9" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3l18 18" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Error Message + Forgot Password Link -->
          <div class="flex justify-between items-center">
            <span v-if="errorMessage" class="text-xs font-bold text-red-600">{{ errorMessage }}</span>
            <span v-else></span>
            <router-link to="/forgot-password" class="text-xs font-bold text-emerald-600 hover:underline">Forgot password?</router-link>
          </div>

          <!-- Form Submission Controller -->
          <button type="submit" :disabled="isLoading" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition shadow-md shadow-emerald-100 mt-2 disabled:opacity-50">
            {{ isLoading ? 'Logging in...' : 'Log In' }}
          </button>
        </form>

        <!-- Dynamic Registration Anchor Link -->
        <div class="text-center pt-2">
          <p class="text-sm text-gray-500 font-medium">
            New client? <router-link to="/register" class="text-emerald-600 font-bold hover:underline">Create Account</router-link>
          </p>
        </div>

        <!-- Copyright Footnote Section -->
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
import { ref, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { loginUser } from '../services/authService'

const router = useRouter()
const route = useRoute()
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const showConfirmedBanner = ref(false)

const form = ref({
  username: '',
  password: '',
  remember: false
})

// If the user just clicked the confirmation link in their email, Supabase
// redirects here with ?confirmed=true. Show a friendly banner instead of
// silently dropping them on a blank login form, then clean the URL so a
// page refresh doesn't keep showing it.
onMounted(() => {
  if (route.query.confirmed === 'true') {
    showConfirmedBanner.value = true
    router.replace({ path: route.path, query: {} })
  }
})

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const result = await loginUser(form.value.username, form.value.password)

    sessionStorage.setItem('token', result.token)
    sessionStorage.setItem('user', JSON.stringify(result.user))

    if (result.user.role === 'Client') {
      router.push('/client/bookings')
    } else {
      router.push('/admin/dashboard')
    }

  } catch (error) {
    errorMessage.value = 'Invalid username or password'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
</style>