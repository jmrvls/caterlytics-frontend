<template>
  <!-- Main Container: Split-screen layout -->
  <div class="min-h-screen flex w-full font-sans bg-gradient-to-br from-emerald-50 via-white to-gray-50">

    <!-- LEFT SIDE: Manuscript & Institution Details -->
    <div class="hidden lg:flex lg:flex-col w-1/2 h-screen overflow-hidden bg-gray-50 border-r border-gray-200 p-8">

      <!-- System Branding Logo -->
      <img
        src="/src/assets/logofinal.png"
        alt="Logo"
        class="w-14 h-14 object-contain flex-shrink-0"
      />

      <!-- Center Visual Mockup Area: shrinks to fit remaining space, never overlaps text below -->
      <div class="flex-1 min-h-0 flex items-center justify-center py-4">
        <img
          src="/src/assets/login-bg.png"
          alt="Catering Display"
          class="w-full h-full object-contain"
        />
      </div>

      <!-- Bottom Section -->
      <div class="flex-shrink-0 pb-4">
        <h2 class="text-4xl xl:text-5xl font-black text-gray-900 leading-none tracking-tight">
          Manage <br />
          the events <br />
          <span class="text-emerald-600">you love.</span>
        </h2>

        <p class="text-xs font-bold text-gray-400 uppercase tracking-widest pt-4 leading-relaxed">
          Presented to the Faculty of the Computer Science Department of <br />
          Hercor College Inc., Lawaan, Roxas City, Capiz, Philippines
        </p>
      </div>
    </div>

    <!-- RIGHT SIDE: System Authentic Log In Form Section -->
    <div class="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white lg:bg-transparent">
      <div class="w-full space-y-8 lg:bg-white lg:p-10 lg:rounded-3xl lg:shadow-xl lg:shadow-gray-100" style="max-width: clamp(360px, 32vw, 480px)">

        <!-- Form Header Messaging -->
        <div class="space-y-2">
          <h3 class="text-3xl font-extrabold text-gray-900 tracking-tight">Welcome Back</h3>
          <p class="text-sm text-gray-500 font-medium">Please enter your account details to log in.</p>
        </div>

        <!-- Error Banner -->
        <div v-if="errorMessage" class="bg-red-50 border border-red-200 text-red-600 text-sm font-medium p-3 rounded-xl">
          {{ errorMessage }}
        </div>

        <!-- Log In Form -->
        <form @submit.prevent="handleLogin" class="space-y-5">

          <!-- Account Identity Field -->
          <div class="space-y-1.5">
            <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Username or Email</label>
            <input type="text" v-model="form.username" placeholder="Enter your username or email" class="w-full p-3.5 bg-gray-50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition" required />
          </div>

          <!-- Account Security Field with Show/Hide Toggle -->
          <div class="space-y-1.5">
            <div class="flex justify-between items-center">
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500">Password</label>
              <router-link to="/forgot-password" class="text-xs font-bold text-emerald-600 hover:underline">Forgot password?</router-link>
            </div>

            <div class="relative">
              <input
                :type="showPassword ? 'text' : 'password'"
                v-model="form.password"
                placeholder=""
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

          <!-- Persistence State Mechanism -->
          <div class="flex items-center">
            <input id="remember-me" type="checkbox" v-model="form.remember" class="h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-gray-300 rounded" />
            <label id="remember-me-label" for="remember-me" class="ml-2 block text-sm text-gray-600 font-medium cursor-pointer select-none">Remember this device</label>
          </div>

          <!-- Form Submission Controller -->
          <button type="submit" :disabled="isLoading" class="w-full bg-emerald-600 text-white p-3.5 rounded-xl font-bold text-base hover:bg-emerald-700 transition shadow-md shadow-emerald-100 mt-2 disabled:opacity-50">
            {{ isLoading ? 'Signing in...' : 'Sign In to System' }}
          </button>
        </form>

        <!-- Dynamic Registration Anchor Link -->
        <div class="text-center pt-2">
          <p class="text-sm text-gray-500 font-medium">
            New client? <router-link to="/register" class="text-emerald-600 font-bold hover:underline">Create an online booking account</router-link>
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginUser } from '../services/authService'

const router = useRouter()
const showPassword = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

const form = ref({
  username: '',
  password: '',
  remember: false
})

const handleLogin = async () => {
  errorMessage.value = ''
  isLoading.value = true

  try {
    const result = await loginUser(form.value.username, form.value.password)

    localStorage.setItem('token', result.token)
    localStorage.setItem('user', JSON.stringify(result.user))

    if (result.user.role === 'Client') {
      router.push('/client/bookings')
    } else {
      router.push('/admin/dashboard')
    }

  } catch (error) {
    errorMessage.value = error.message || 'Something went wrong. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
</style>