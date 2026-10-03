<template>
  <div class="min-h-screen flex bg-gray-50 dark:bg-gray-900 font-sans">

    <!-- MOBILE TOP BAR -->
    <div class="lg:hidden fixed top-0 inset-x-0 z-30 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3 px-4 py-3 print:hidden">
      <button @click="isMobileSidebarOpen = true" class="p-2 -ml-2 rounded-none text-gray-600 dark:text-gray-300">
        <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div class="flex items-center gap-2 flex-1 min-w-0">
        <span class="font-bold text-gray-800 dark:text-gray-100 truncate">Caterlytics</span>
      </div>
      <NotificationBell />
    </div>

    <!-- MOBILE BACKDROP -->
    <div v-if="isMobileSidebarOpen" @click="isMobileSidebarOpen = false" class="fixed inset-0 bg-black/40 z-40 lg:hidden"></div>

    <!-- SIDEBAR -->
    <aside
      :class="[sidebarExpanded ? 'w-64' : 'w-20', isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0']"
      class="bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-transform duration-300 h-screen fixed lg:sticky top-0 left-0 z-50 lg:z-auto"
    >
      <div class="flex items-center justify-between gap-2 p-4">
        <!-- COLLAPSED: logo itself is the toggle -->
        <div
          v-if="!sidebarExpanded"
          class="relative flex items-center justify-center w-8 h-8 cursor-pointer select-none rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          @mouseenter="isLogoHovered = true"
          @mouseleave="isLogoHovered = false"
          @click="toggleSidebar"
        >
          <img v-if="!isLogoHovered" :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <svg v-else class="w-6 h-6 flex-shrink-0 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke-width="1.5" />
            <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" stroke-width="1.5" />
          </svg>

          <div v-if="isLogoHovered" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg z-[60] pointer-events-none">
            Open sidebar
          </div>
        </div>

        <!-- EXPANDED: static logo + name on the left -->
        <div v-else class="flex items-center gap-2 overflow-hidden">
          <img :src="logoUrl" alt="Logo" class="w-8 h-8 object-contain flex-shrink-0" />
          <span class="font-bold text-gray-800 dark:text-gray-100 whitespace-nowrap">Caterlytics</span>
        </div>

        <!-- EXPANDED: dedicated toggle button on the right, like Gemini's collapse icon -->
        <div v-if="sidebarExpanded" class="relative flex-shrink-0">
          <button
            type="button"
            class="w-8 h-8 flex items-center justify-center rounded-none text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            @mouseenter="isLogoHovered = true"
            @mouseleave="isLogoHovered = false"
            @click="toggleSidebar"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <rect x="3.5" y="4.5" width="17" height="15" rx="2" stroke-width="1.5" />
              <line x1="9.5" y1="4.5" x2="9.5" y2="19.5" stroke-width="1.5" />
            </svg>
          </button>

          <div v-if="isLogoHovered" class="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-full whitespace-nowrap shadow-lg z-[60] pointer-events-none">
            Close sidebar
          </div>
        </div>
      </div>

      <nav class="flex-1 px-3 mt-6 space-y-1 overflow-y-auto">

        <a v-for="item in navItems" :key="item.name"
          href="#"
          @click.prevent="goTo(item)"
          :class="item.name === 'Feedback & Ratings' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-semibold' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'"
          class="relative flex items-center gap-3 px-3 py-2.5 rounded-none text-sm transition"
        >
          <svg class="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" :d="item.iconPath" />
          </svg>
          <span v-if="sidebarExpanded" class="whitespace-nowrap">{{ item.name }}</span>
          <span
            v-if="item.name === 'Support Chat' && chatUnread"
            :class="sidebarExpanded ? 'ml-auto min-w-[20px] h-5 px-1.5' : 'absolute top-1 right-1 min-w-[16px] h-4 px-1'"
            class="rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center shadow"
          >{{ chatUnread > 99 ? '99+' : chatUnread }}</span>
        </a>
      </nav>

      <div class="border-t border-gray-200 dark:border-gray-700 p-3 relative">
        <!-- Click-outside backdrop -->
        <div v-if="showAccountMenu" @click="showAccountMenu = false" class="fixed inset-0 z-40"></div>

        <!-- Account menu (Log Out) -->
        <div v-if="showAccountMenu" class="absolute bottom-full left-2 mb-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none shadow-lg overflow-hidden z-50">
          <button v-if="userRole === 'Admin' || userRole === 'Owner/Manager'" @click="showAccountMenu = false; router.push('/settings')" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          <button @click="handleLogout" class="w-full flex items-center gap-2.5 text-left px-4 py-2.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Log Out
          </button>
        </div>

        <!-- Profile: click toggles the account menu -->
        <div @click="showAccountMenu = !showAccountMenu" class="flex items-center gap-3 px-2 py-2 rounded-none hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
          <div class="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 overflow-hidden">
            <img v-if="userAvatarUrl" :src="userAvatarUrl" alt="Profile picture" class="w-full h-full object-cover" />
            <span v-else>{{ userInitial }}</span>
          </div>
          <div v-if="sidebarExpanded" class="overflow-hidden">
            <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{{ userName }}</p>
            <p class="text-xs text-gray-400 dark:text-gray-500 truncate">{{ userRole }}</p>
          </div>
        </div>
      </div>
    </aside>

    <!-- MAIN CONTENT -->
    <main class="flex-1 p-4 sm:p-8 pt-20 lg:pt-8 overflow-x-hidden w-full min-w-0">
      <div class="max-w-none 2xl:max-w-[1920px] mx-auto">

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h1 class="text-xl font-bold text-gray-800 dark:text-gray-100">Feedback &amp; Ratings</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400">See what clients say about your services and reply to their reviews.</p>
          </div>
          <div class="flex items-center gap-2 sm:gap-3">
            <button @click="loadAll" :disabled="isLoading" class="px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-none text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
              {{ isLoading ? 'Refreshing...' : 'Refresh' }}
            </button>
            <div class="hidden lg:block"><NotificationBell /></div>
          </div>
        </div>

        <div v-if="pageError" class="text-red-600 dark:text-red-400 text-sm font-medium mb-4">{{ pageError }}</div>
        <div v-if="successMessage" class="text-emerald-700 dark:text-emerald-300 text-sm font-medium mb-4">{{ successMessage }}</div>

        <div v-if="isLoading && !reviews.length" class="text-center py-16 text-gray-400 dark:text-gray-500 text-sm">Loading reviews...</div>

        <div v-else-if="!reviews.length && !pageError" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center py-14 px-4 text-gray-400 dark:text-gray-500 text-sm">
          No reviews yet. Clients can rate you once a booking is marked <span class="font-semibold">Completed</span>, so make sure finished events are updated in Event Bookings.
        </div>

        <template v-else-if="reviews.length">
          <!-- Summary cards -->
          <div class="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Average rating</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{{ stats.average.toFixed(1) }} <span class="text-sm font-medium text-gray-400">/ 5</span></p>
              <div class="mt-1"><StarRating :model-value="stats.average" /></div>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Total reviews</p>
              <p class="text-xl sm:text-2xl font-bold text-gray-800 dark:text-gray-100">{{ stats.total }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ stats.positivePct }}% rated 4–5 stars</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Awaiting your reply</p>
              <p :class="stats.awaitingReply ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'" class="text-xl sm:text-2xl font-bold">{{ stats.awaitingReply }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ stats.replied }} replied</p>
            </div>
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Needs attention</p>
              <p :class="lowCount ? 'text-red-600 dark:text-red-400' : 'text-gray-800 dark:text-gray-100'" class="text-xl sm:text-2xl font-bold">{{ lowCount }}</p>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">reviews with 1–2 stars</p>
            </div>
          </div>

          <!-- Rating breakdown + per-package -->
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
              <h2 class="font-semibold text-gray-800 dark:text-gray-100 mb-3">Rating breakdown</h2>
              <div class="space-y-2">
                <button
                  v-for="n in [5, 4, 3, 2, 1]" :key="n" type="button"
                  @click="ratingFilter = ratingFilter === n ? '' : n"
                  :class="ratingFilter === n ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'"
                  class="w-full flex items-center gap-3 text-sm px-1 py-1 transition"
                >
                  <span class="w-10 text-gray-600 dark:text-gray-300 text-left">{{ n }} ★</span>
                  <span class="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <span class="block h-full bg-amber-400" :style="{ width: (stats.total ? (stats.counts[n] / stats.total) * 100 : 0) + '%' }"></span>
                  </span>
                  <span class="w-8 text-right text-gray-500 dark:text-gray-400">{{ stats.counts[n] }}</span>
                </button>
              </div>
              <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">Tap a row to filter the list below.</p>
            </div>

            <div class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
              <h2 class="font-semibold text-gray-800 dark:text-gray-100 mb-3">By package</h2>
              <ul v-if="packageStats.length" class="divide-y divide-gray-100 dark:divide-gray-700 max-h-56 overflow-y-auto">
                <li v-for="p in packageStats" :key="p.name" class="flex items-center justify-between gap-3 py-2 text-sm">
                  <span class="truncate text-gray-700 dark:text-gray-200">{{ p.name }}</span>
                  <span class="flex items-center gap-2 flex-shrink-0">
                    <StarRating :model-value="p.average" />
                    <span class="text-xs text-gray-500 dark:text-gray-400 w-16 text-right">{{ p.average.toFixed(1) }} ({{ p.count }})</span>
                  </span>
                </li>
              </ul>
              <p v-else class="text-sm text-gray-400 dark:text-gray-500">No package-specific reviews yet.</p>
            </div>
          </div>

          <!-- Filters -->
          <div class="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4">
            <input v-model="searchQuery" type="text" placeholder="Search comments or client name..." class="flex-1 min-w-0 px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
            <select v-model="ratingFilter" class="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">All ratings</option>
              <option v-for="n in [5, 4, 3, 2, 1]" :key="n" :value="n">{{ n }} star{{ n === 1 ? '' : 's' }}</option>
            </select>
            <select v-model="packageFilter" class="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">All packages</option>
              <option v-for="p in packageOptions" :key="p" :value="p">{{ p }}</option>
            </select>
            <select v-model="statusFilter" class="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="">All reviews</option>
              <option value="needs">Needs reply</option>
              <option value="replied">Replied</option>
            </select>
            <select v-model="sortBy" class="px-3 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500">
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="lowest">Lowest rating</option>
              <option value="highest">Highest rating</option>
            </select>
          </div>

          <!-- Review list -->
          <div v-if="!filteredReviews.length" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center py-10 text-gray-400 dark:text-gray-500 text-sm">
            No reviews match these filters.
          </div>
          <ul v-else class="space-y-3">
            <li v-for="r in filteredReviews" :key="r.review_id" class="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 p-4 sm:p-5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-3 min-w-0">
                  <div class="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center font-bold text-sm flex-shrink-0">
                    {{ (r.reviewer || 'C').charAt(0).toUpperCase() }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{{ r.reviewer }}</p>
                    <p class="text-xs text-gray-400 dark:text-gray-500">{{ formatReviewDate(r.created_at) }}</p>
                  </div>
                </div>
                <div class="flex items-center gap-2">
                  <span v-if="r.rating <= 2" class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">Needs attention</span>
                  <StarRating :model-value="r.rating" size="md" />
                </div>
              </div>

              <p v-if="r.package_name" class="mt-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Package: <span class="text-gray-700 dark:text-gray-200">{{ r.package_name }}</span></p>
              <p v-if="r.comment" class="mt-2 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line break-words">{{ r.comment }}</p>
              <p v-else class="mt-2 text-sm italic text-gray-400 dark:text-gray-500">No written comment.</p>

              <!-- Existing reply -->
              <div v-if="r.owner_reply && replyingId !== r.review_id" class="mt-3 border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 p-3">
                <p class="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">Your reply <span class="font-normal text-gray-400 dark:text-gray-500">· {{ formatReviewDate(r.replied_at) }}</span></p>
                <p class="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line break-words">{{ r.owner_reply }}</p>
              </div>

              <!-- Reply editor -->
              <div v-if="replyingId === r.review_id" class="mt-3">
                <textarea
                  v-model="replyDraft" rows="3" maxlength="1000"
                  placeholder="Write a public reply. Clients will see it on your business profile."
                  class="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-none text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                ></textarea>
                <div class="flex items-center justify-between mt-2 gap-2">
                  <span class="text-xs text-gray-400 dark:text-gray-500">{{ replyDraft.length }}/1000</span>
                  <div class="flex gap-2">
                    <button type="button" @click="cancelReply" :disabled="isSavingReply" class="px-3 py-2 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
                    <button type="button" @click="saveReply(r)" :disabled="isSavingReply || !replyDraft.trim()" class="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50">
                      {{ isSavingReply ? 'Saving...' : 'Post reply' }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Actions -->
              <div v-else class="mt-3 flex items-center gap-4">
                <button type="button" @click="startReply(r)" class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                  {{ r.owner_reply ? 'Edit reply' : 'Reply' }}
                </button>
                <button v-if="r.owner_reply" type="button" @click="removeReply(r)" :disabled="isSavingReply" class="text-sm font-semibold text-red-500 dark:text-red-400 hover:underline disabled:opacity-50">
                  Delete reply
                </button>
              </div>
            </li>
          </ul>
        </template>

      </div>
    </main>
  </div>
</template>

<script setup>
import { logoutUser } from '../services/authService'
import { resetNotifications } from '../composables/useNotifications'
import logoUrl from '../Assets/logofinal.png'
import { ref, computed, onMounted } from 'vue'
import NotificationBell from '../Components/NotificationBell.vue'
import StarRating from '../Components/StarRating.vue'
import { useSidebarState } from '../composables/useSidebarState'
import { useChatUnread } from '../composables/useChatUnread'
import { useRouter } from 'vue-router'
import { getOwnerReviews, replyToReview, summarizeReviews, formatReviewDate } from '../services/reviewService'

const router = useRouter()

const { isSidebarOpen, isMobileSidebarOpen, sidebarExpanded } = useSidebarState()
const { chatUnread } = useChatUnread()
const isLogoHovered = ref(false)

function toggleSidebar() {
  isSidebarOpen.value = !isSidebarOpen.value
  isLogoHovered.value = false
}
const showAccountMenu = ref(false)
const userName = ref('User')
const userRole = ref('Admin')
const userInitial = ref('U')
const userAvatarUrl = ref('')

const reviews = ref([])
const isLoading = ref(false)
const pageError = ref('')
const successMessage = ref('')

// filters
const searchQuery = ref('')
const ratingFilter = ref('')
const packageFilter = ref('')
const statusFilter = ref('')
const sortBy = ref('newest')

// reply editor
const replyingId = ref(null)
const replyDraft = ref('')
const isSavingReply = ref(false)

const stats = computed(() => summarizeReviews(reviews.value))
const lowCount = computed(() => stats.value.counts[1] + stats.value.counts[2])

const packageOptions = computed(() =>
  [...new Set(reviews.value.map((r) => r.package_name).filter(Boolean))].sort((a, b) => a.localeCompare(b))
)

const packageStats = computed(() => {
  const map = new Map()
  for (const r of reviews.value) {
    if (!r.package_name) continue
    const e = map.get(r.package_name) || { name: r.package_name, sum: 0, count: 0 }
    e.sum += r.rating
    e.count += 1
    map.set(r.package_name, e)
  }
  return [...map.values()]
    .map((e) => ({ name: e.name, count: e.count, average: e.sum / e.count }))
    .sort((a, b) => b.average - a.average || b.count - a.count)
})

const filteredReviews = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  const list = reviews.value.filter((r) => {
    if (ratingFilter.value && r.rating !== Number(ratingFilter.value)) return false
    if (packageFilter.value && r.package_name !== packageFilter.value) return false
    if (statusFilter.value === 'needs' && r.owner_reply) return false
    if (statusFilter.value === 'replied' && !r.owner_reply) return false
    if (!q) return true
    return (r.comment || '').toLowerCase().includes(q) || (r.reviewer || '').toLowerCase().includes(q)
  })
  const byDate = (a, b) => new Date(b.created_at) - new Date(a.created_at)
  const sorters = {
    newest: byDate,
    oldest: (a, b) => -byDate(a, b),
    lowest: (a, b) => a.rating - b.rating || byDate(a, b),
    highest: (a, b) => b.rating - a.rating || byDate(a, b)
  }
  return [...list].sort(sorters[sortBy.value] || byDate)
})

onMounted(() => {
  const storedUser = sessionStorage.getItem('user')
  if (!storedUser) {
    router.push('/')
    return
  }
  const user = JSON.parse(storedUser)
  // Same access as the route guard in main.js (get_owner_reviews also enforces this server-side).
  if (!['Admin', 'Owner/Manager'].includes(user.role)) {
    router.push('/')
    return
  }
  const displayName = user.full_name || user.username || 'User'
  userName.value = displayName
  userRole.value = user.role
  userInitial.value = displayName.charAt(0).toUpperCase()
  userAvatarUrl.value = user.avatar_url || ''

  loadAll()
})

async function loadAll() {
  isLoading.value = true
  pageError.value = ''
  try {
    reviews.value = await getOwnerReviews()
  } catch (e) {
    pageError.value = e.message || 'Failed to load reviews.'
  } finally {
    isLoading.value = false
  }
}

function flash(msg) {
  successMessage.value = msg
  setTimeout(() => { if (successMessage.value === msg) successMessage.value = '' }, 3000)
}

function startReply(r) {
  replyingId.value = r.review_id
  replyDraft.value = r.owner_reply || ''
  pageError.value = ''
}

function cancelReply() {
  replyingId.value = null
  replyDraft.value = ''
}

async function persistReply(r, text, message) {
  isSavingReply.value = true
  pageError.value = ''
  try {
    await replyToReview(r.review_id, text)
    const clean = text.trim()
    r.owner_reply = clean || null
    r.replied_at = clean ? new Date().toISOString() : null
    cancelReply()
    flash(message)
  } catch (e) {
    pageError.value = e.message || 'Failed to save reply.'
  } finally {
    isSavingReply.value = false
  }
}

function saveReply(r) {
  if (!replyDraft.value.trim()) return
  return persistReply(r, replyDraft.value, 'Reply posted.')
}

function removeReply(r) {
  if (!window.confirm('Delete your reply to this review?')) return
  return persistReply(r, '', 'Reply deleted.')
}

function goTo(item) {
  isMobileSidebarOpen.value = false
  router.push(item.path)
}

const handleLogout = async () => {
  try {
    await logoutUser()
  } catch (error) {
    console.error('Sign out failed:', error)
  }
  sessionStorage.removeItem('token')
  sessionStorage.removeItem('user')
  resetNotifications()
  router.push('/')
}

// Admin / Owner-Manager only (route + onMounted already enforce this).
const wasteIcon = 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
const fleetIcon = 'M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12'
const feedbackIcon = 'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z'

const navItems = [
  { name: 'Dashboard', path: '/admin/dashboard', iconPath: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { name: 'Event Bookings', path: '/admin/bookings', iconPath: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
  { name: 'Event Planning', path: '/admin/planning', iconPath: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { name: 'Catering Packages', path: '/admin/packages', iconPath: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
  { name: 'Inventory', path: '/admin/inventory', iconPath: 'M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0H4' },
  { name: 'Suppliers', path: '/admin/suppliers', iconPath: 'M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21' },
  { name: 'Waste Tracking', path: '/admin/waste', iconPath: wasteIcon },
  { name: 'Delivery & Fleet', path: '/admin/fleet', iconPath: fleetIcon },
  { name: 'Payment Records', path: '/admin/payments', iconPath: 'M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0018.75 4.5H5.25A2.25 2.25 0 003 6.75v10.5A2.25 2.25 0 005.25 19.5z' },
  { name: 'Branches', path: '/admin/branches', iconPath: 'M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 10h.01M15 10h.01' },
  { name: 'Staff Management', path: '/admin/staff', iconPath: 'M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m6-2.13a4 4 0 10-4-4 4 4 0 004 4z' },
  { name: 'Reports', path: '/admin/reports', iconPath: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { name: 'Legal Documents', path: '/admin/legal-documents', iconPath: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
  { name: 'Audit Logs', path: '/admin/audit-logs', iconPath: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
  { name: 'Feedback & Ratings', path: '/admin/feedback', iconPath: feedbackIcon },
  { name: 'Support Chat', path: '/admin/support', iconPath: 'M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.86 9.86 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' },
]
</script>