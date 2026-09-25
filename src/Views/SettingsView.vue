<template>
  <div class="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors">

    <!-- TOP NAV -->
    <header class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10 transition-colors">
      <div class="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
        <button @click="goBack" class="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="font-bold text-gray-800 dark:text-gray-100">Settings</span>
      </div>
    </header>

    <main class="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">

      <div v-if="successMessage" class="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-medium p-3 rounded-xl">
        {{ successMessage }}
      </div>
      <div v-if="pageError" class="text-red-600 dark:text-red-300 text-sm font-medium">
        {{ pageError }}
      </div>

      <div v-if="isLoading" class="text-center text-sm text-gray-400 py-10">Loading...</div>

      <template v-else>
        <!-- MY PROFILE (Account Info + Profile Picture, Shopee-style two-column card) -->
        <section class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 transition-colors">
          <h3 class="font-bold text-gray-800 dark:text-gray-100">Account Information</h3>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Manage and protect your account</p>
          <hr class="border-gray-100 dark:border-gray-700 my-5" />

          <div class="flex flex-col-reverse md:flex-row gap-8">
            <!-- LEFT: form rows -->
            <form @submit.prevent="handleSaveProfile" class="flex-1 space-y-5">
              <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <label class="w-40 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Username</label>
                <input :value="profile.username" disabled class="flex-1 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 dark:text-gray-500" />
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <label class="w-40 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Full Name</label>
                <input v-model="profileForm.full_name" type="text" required class="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100" />
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <label class="w-40 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact Number</label>
                <input v-model="profileForm.contact_number" type="text" class="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100" />
              </div>
              <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
                <label class="w-40 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Role</label>
                <input :value="profile.role" disabled class="flex-1 p-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-400 dark:text-gray-500" />
              </div>
              <button type="submit" :disabled="isSavingProfile" class="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
                {{ isSavingProfile ? 'Saving...' : 'Save Changes' }}
              </button>
            </form>

            <!-- divider -->
            <div class="hidden md:block w-px bg-gray-100 dark:bg-gray-700"></div>
            <div class="md:hidden h-px bg-gray-100 dark:bg-gray-700"></div>

            <!-- RIGHT: profile picture -->
            <div class="md:w-48 flex flex-row md:flex-col items-center md:items-center gap-4 md:gap-3 md:text-center">
              <div class="w-20 h-20 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shrink-0">
                <img v-if="profile.avatar_url" :src="profile.avatar_url" alt="Profile picture" class="w-full h-full object-cover" />
                <span v-else>{{ userInitial }}</span>
              </div>
              <div>
                <input ref="fileInput" type="file" accept="image/png, image/jpeg, image/webp" class="hidden text-gray-900 dark:text-gray-100" @change="handleAvatarChange" />
                <button @click="fileInput.click()" :disabled="isUploadingAvatar" class="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
                  {{ isUploadingAvatar ? 'Uploading...' : 'Change Picture' }}
                </button>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">JPG, PNG, or WEBP. Max 2MB.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- BUSINESS INFO: only shown to accounts that belong to a business
             (Admin / Staff / Owner-Manager). A plain Client has no
             business_id and won't see this at all. -->
        <section v-if="business" class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 sm:p-8 transition-colors">
          <h3 class="font-bold text-gray-800 dark:text-gray-100">Business Information</h3>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
            {{ isBusinessOwner ? 'Manage your business details' : 'Only the business owner can edit these details' }}
          </p>
          <hr class="border-gray-100 dark:border-gray-700 my-5" />

          <div v-if="businessSuccess" class="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-sm font-medium p-3 rounded-xl mb-4">
            {{ businessSuccess }}
          </div>
          <div v-if="businessError" class="text-red-600 dark:text-red-300 text-sm font-medium mb-4">
            {{ businessError }}
          </div>

          <div class="flex flex-row items-center gap-4 mb-6">
            <div class="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-2xl overflow-hidden shrink-0">
              <img v-if="business.logo_url" :src="business.logo_url" alt="Business logo" class="w-full h-full object-cover" />
              <span v-else>{{ (business.business_name || '?').charAt(0).toUpperCase() }}</span>
            </div>
            <div v-if="isBusinessOwner">
              <input ref="logoInput" type="file" accept="image/png, image/jpeg, image/webp" class="hidden" @change="handleLogoChange" />
              <button type="button" @click="logoInput.click()" :disabled="isUploadingLogo" class="bg-emerald-600 text-white px-4 py-2 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
                {{ isUploadingLogo ? 'Uploading...' : 'Change Logo' }}
              </button>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-2">JPG, PNG, or WEBP. Max 2MB.</p>
            </div>
          </div>

          <form @submit.prevent="handleSaveBusiness" class="space-y-5">
            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <label class="w-40 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Business Name</label>
              <input v-model="businessForm.business_name" :disabled="!isBusinessOwner" type="text" required
                class="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400" />
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <label class="w-40 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact Email</label>
              <input v-model="businessForm.contact_email" :disabled="!isBusinessOwner" type="email"
                class="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400" />
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <label class="w-40 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contact Number</label>
              <input v-model="businessForm.contact_number" :disabled="!isBusinessOwner" type="text"
                class="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400" />
            </div>
            <div class="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4">
              <label class="w-40 shrink-0 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Address</label>
              <input v-model="businessForm.address" :disabled="!isBusinessOwner" type="text"
                class="flex-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100 disabled:bg-gray-100 dark:disabled:bg-gray-800 disabled:text-gray-400" />
            </div>
            <button v-if="isBusinessOwner" type="submit" :disabled="isSavingBusiness" class="bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-emerald-700 disabled:opacity-50">
              {{ isSavingBusiness ? 'Saving...' : 'Save Changes' }}
            </button>
          </form>
        </section>

        <!-- APPEARANCE -->
        <section class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 transition-colors">
          <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4">Appearance</h3>
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">Dark Mode</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">Switch between light and dark display.</p>
            </div>
            <button
              @click="toggleDarkMode"
              :class="isDark ? 'bg-emerald-600' : 'bg-gray-300'"
              class="relative inline-flex h-7 w-12 items-center rounded-full transition-colors shrink-0"
            >
              <span :class="isDark ? 'translate-x-6' : 'translate-x-1'" class="inline-block h-5 w-5 transform rounded-full bg-white transition-transform" />
            </button>
          </div>
        </section>

        <!-- PASSWORD -->
        <section class="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-6 transition-colors">
          <h3 class="font-bold text-gray-800 dark:text-gray-100 mb-4">Change Password</h3>
          <form @submit.prevent="handleChangePassword" class="space-y-4">
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">New Password</label>
              <input v-model="newPassword" type="password" required minlength="6" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100" />
            </div>
            <div>
              <label class="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Confirm New Password</label>
              <input v-model="confirmPassword" type="password" required minlength="6" class="w-full mt-1 p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-800 dark:text-gray-100" />
            </div>
            <button type="submit" :disabled="isChangingPassword" class="bg-gray-800 dark:bg-gray-700 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-900 dark:hover:bg-gray-600 disabled:opacity-50">
              {{ isChangingPassword ? 'Updating...' : 'Update Password' }}
            </button>
          </form>
        </section>
      </template>

    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getMyProfile, updateMyProfile, uploadMyAvatar, changeMyPassword } from '../services/profileService'
import { getMyBusiness, updateMyBusiness, uploadBusinessLogo } from '../services/businessservice'
import { getStoredTheme, setTheme } from '../theme'

const router = useRouter()

const isLoading = ref(true)
const pageError = ref('')
const successMessage = ref('')

const profile = ref({})
const profileForm = ref({ full_name: '', contact_number: '' })
const isSavingProfile = ref(false)

const fileInput = ref(null)
const isUploadingAvatar = ref(false)

const isDark = ref(getStoredTheme() === 'dark')

const newPassword = ref('')
const confirmPassword = ref('')
const isChangingPassword = ref(false)

const currentUser = JSON.parse(sessionStorage.getItem('user') || '{}')
const userInitial = computed(() => (profile.value.full_name || currentUser.full_name || '?').charAt(0).toUpperCase())

// ---------- Business Info (Admin / Staff / Owner-Manager only; a plain
// Client has no business_id, so `business` stays null and the whole
// section is hidden via v-if in the template).
const business = ref(null)
const businessForm = ref({ business_name: '', contact_email: '', contact_number: '', address: '' })
const businessError = ref('')
const businessSuccess = ref('')
const isSavingBusiness = ref(false)
const logoInput = ref(null)
const isUploadingLogo = ref(false)

// Editing is restricted to the original registrant (tbl_business.owner_id)
// per RLS ("owner update own business") — other Admins in the same
// business can view but not edit here.
const isBusinessOwner = computed(() => business.value && business.value.owner_id === currentUser.user_id)

async function fetchBusiness() {
  try {
    const data = await getMyBusiness()
    if (data) {
      business.value = data
      businessForm.value = {
        business_name: data.business_name || '',
        contact_email: data.contact_email || '',
        contact_number: data.contact_number || '',
        address: data.address || '',
      }
    }
  } catch (error) {
    // Non-fatal: a Client account (or any load hiccup) just won't see
    // the Business Info section rather than blocking the whole page.
    console.error('Failed to load business info:', error)
  }
}

async function handleSaveBusiness() {
  if (!business.value) return
  isSavingBusiness.value = true
  businessError.value = ''
  businessSuccess.value = ''
  try {
    const updated = await updateMyBusiness(business.value.business_id, businessForm.value)
    business.value = { ...business.value, ...updated }
    flash(businessSuccess, 'Business info updated.')
  } catch (error) {
    businessError.value = error.message || 'Failed to update business info.'
  } finally {
    isSavingBusiness.value = false
  }
}

function goBack() {
  router.back()
}

function flash(setter, message, ms = 3000) {
  setter.value = message
  setTimeout(() => { setter.value = '' }, ms)
}

async function fetchProfile() {
  isLoading.value = true
  try {
    const data = await getMyProfile(currentUser.user_id)
    profile.value = data
    profileForm.value = { full_name: data.full_name || '', contact_number: data.contact_number || '' }
  } catch (error) {
    pageError.value = error.message || 'Failed to load your profile.'
  } finally {
    isLoading.value = false
  }
}

async function handleSaveProfile() {
  isSavingProfile.value = true
  pageError.value = ''
  try {
    const updated = await updateMyProfile(currentUser.user_id, profileForm.value)
    profile.value = { ...profile.value, ...updated }
    // Keep the cached user (used across the whole app) in sync too.
    const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}')
    sessionStorage.setItem('user', JSON.stringify({ ...storedUser, full_name: updated.full_name }))
    flash(successMessage, 'Profile updated.')
  } catch (error) {
    pageError.value = error.message || 'Failed to update profile.'
  } finally {
    isSavingProfile.value = false
  }
}

async function handleAvatarChange(event) {
  const file = event.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    pageError.value = 'Picture is too large. Max size is 2MB.'
    return
  }
  isUploadingAvatar.value = true
  pageError.value = ''
  try {
    const updated = await uploadMyAvatar(currentUser.user_id, file)
    profile.value = { ...profile.value, avatar_url: updated.avatar_url }
    const storedUser = JSON.parse(sessionStorage.getItem('user') || '{}')
    sessionStorage.setItem('user', JSON.stringify({ ...storedUser, avatar_url: updated.avatar_url }))
    flash(successMessage, 'Profile picture updated.')
  } catch (error) {
    pageError.value = error.message || 'Failed to upload picture.'
  } finally {
    isUploadingAvatar.value = false
    event.target.value = ''
  }
}

async function handleLogoChange(event) {
  const file = event.target.files[0]
  if (!file) return
  if (file.size > 2 * 1024 * 1024) {
    businessError.value = 'Logo is too large. Max size is 2MB.'
    return
  }
  isUploadingLogo.value = true
  businessError.value = ''
  businessSuccess.value = ''
  try {
    const updated = await uploadBusinessLogo(currentUser.user_id, business.value.business_id, file)
    business.value = { ...business.value, logo_url: updated.logo_url }
    flash(businessSuccess, 'Business logo updated.')
  } catch (error) {
    businessError.value = error.message || 'Failed to upload logo.'
  } finally {
    isUploadingLogo.value = false
    event.target.value = ''
  }
}

function toggleDarkMode() {
  isDark.value = !isDark.value
  setTheme(isDark.value ? 'dark' : 'light')
}

async function handleChangePassword() {
  pageError.value = ''
  if (newPassword.value !== confirmPassword.value) {
    pageError.value = 'Passwords do not match.'
    return
  }
  isChangingPassword.value = true
  try {
    await changeMyPassword(newPassword.value)
    newPassword.value = ''
    confirmPassword.value = ''
    flash(successMessage, 'Password updated.')
  } catch (error) {
    pageError.value = error.message || 'Failed to update password.'
  } finally {
    isChangingPassword.value = false
  }
}

onMounted(() => {
  fetchProfile()
  fetchBusiness()
})
</script>