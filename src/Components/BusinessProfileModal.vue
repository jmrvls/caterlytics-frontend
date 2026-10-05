<template>
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" @click.self="emit('close')">
    <div class="bg-white dark:bg-gray-800 w-full sm:max-w-2xl max-h-[92dvh] overflow-y-auto rounded-t-2xl sm:rounded-2xl shadow-xl">
      <!-- Header -->
      <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-5 py-4 flex items-start justify-between gap-3 z-10">
        <div class="flex items-center gap-3 min-w-0">
          <img v-if="profile?.logo_url" :src="profile.logo_url" :alt="profile.business_name" class="w-14 h-14 rounded-full object-cover border border-gray-200 dark:border-gray-700 flex-shrink-0" />
          <div v-else class="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xl font-bold flex-shrink-0">
            {{ (profile?.business_name || '?').charAt(0).toUpperCase() }}
          </div>
          <div class="min-w-0">
            <p class="font-bold text-lg text-gray-900 dark:text-gray-100 truncate">{{ profile?.business_name || 'Catering Business' }}</p>
            <div class="flex items-center gap-1.5 mt-0.5">
              <StarRating :model-value="stats?.avg_rating || 0" />
              <span class="text-xs text-gray-500 dark:text-gray-400">
                <template v-if="stats?.review_count">{{ stats.avg_rating?.toFixed(1) }} · {{ stats.review_count }} review{{ stats.review_count === 1 ? '' : 's' }}</template>
                <template v-else>No reviews yet</template>
              </span>
            </div>
          </div>
        </div>
        <div class="flex items-center gap-2 flex-shrink-0">
          <HeartButton :active="isFavorite" @toggle="emit('toggle-favorite')" />
          <button type="button" @click="emit('close')" class="w-9 h-9 rounded-full text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center" aria-label="Close">✕</button>
        </div>
      </div>

      <div v-if="isLoading" class="text-sm text-gray-400 dark:text-gray-500 text-center py-16">Loading profile…</div>

      <div v-else class="p-5 space-y-6">
        <!-- About -->
        <section>
          <p class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">About</p>
          <p v-if="profile?.about" class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ profile.about }}</p>
          <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">This business hasn't added a description yet.</p>
        </section>

        <!-- Contact / hours -->
        <section class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Contact</p>
            <p v-if="profile?.address" class="text-sm text-gray-700 dark:text-gray-300">📍 {{ profile.address }}</p>
            <p v-if="profile?.contact_number" class="text-sm text-gray-700 dark:text-gray-300 mt-1">📞 {{ profile.contact_number }}</p>
            <p v-if="profile?.contact_email" class="text-sm text-gray-700 dark:text-gray-300 mt-1 break-all">✉️ {{ profile.contact_email }}</p>
            <p v-if="!profile?.address && !profile?.contact_number && !profile?.contact_email" class="text-sm text-gray-400 dark:text-gray-500 italic">No contact details yet.</p>
          </div>
          <div class="bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-xl p-4">
            <p class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Business Hours</p>
            <p v-if="profile?.opening_hours" class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ profile.opening_hours }}</p>
            <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">Not specified.</p>
          </div>
        </section>

        <!-- Policies -->
        <section>
          <p class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2">Policies</p>
          <p v-if="profile?.policies" class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-line">{{ profile.policies }}</p>
          <p v-else class="text-sm text-gray-400 dark:text-gray-500 italic">No policies posted. Please ask the business directly before booking.</p>
        </section>

        <!-- Reviews -->
        <section>
          <p class="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">Reviews from past clients</p>
          <p v-if="!reviews.length" class="text-sm text-gray-400 dark:text-gray-500 italic">No reviews yet. Only clients with a completed booking can leave one.</p>
          <ul v-else class="space-y-3">
            <li v-for="r in reviews" :key="r.review_id" class="border border-gray-100 dark:border-gray-700 rounded-xl p-4">
              <div class="flex items-center justify-between gap-2">
                <p class="text-sm font-semibold text-gray-800 dark:text-gray-100">{{ r.reviewer }}</p>
                <span class="text-xs text-gray-400 dark:text-gray-500">{{ formatReviewDate(r.created_at) }}</span>
              </div>
              <div class="flex items-center gap-2 mt-1">
                <StarRating :model-value="r.rating" />
                <span v-if="r.package_name" class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ r.package_name }}</span>
              </div>
              <p v-if="r.comment" class="text-sm text-gray-700 dark:text-gray-300 mt-2 whitespace-pre-line">{{ r.comment }}</p>
              <div v-if="r.owner_reply" class="mt-3 border-l-4 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 rounded-r-lg p-3">
                <p class="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-1">Reply from the caterer <span v-if="r.replied_at" class="font-normal text-gray-400 dark:text-gray-500">· {{ formatReviewDate(r.replied_at) }}</span></p>
                <p class="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line break-words">{{ r.owner_reply }}</p>
              </div>
            </li>
          </ul>
        </section>
      </div>

      <div v-if="showBookButton || showMessageButton" class="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 p-4 flex gap-3">
        <button v-if="showMessageButton" type="button" @click="emit('message')" class="flex-1 border border-emerald-600 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 py-3 rounded-xl text-sm font-bold transition">
          Message
        </button>
        <button v-if="showBookButton" type="button" @click="emit('book')" class="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-3 rounded-xl text-sm font-bold transition">
          Book with this caterer
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import StarRating from './StarRating.vue'
import HeartButton from './HeartButton.vue'

defineProps({
  profile: { type: Object, default: null },
  stats: { type: Object, default: null },
  reviews: { type: Array, default: () => [] },
  isLoading: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  showBookButton: { type: Boolean, default: true },
  showMessageButton: { type: Boolean, default: true }
})
const emit = defineEmits(['close', 'toggle-favorite', 'book', 'message'])

function formatReviewDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}
</script>