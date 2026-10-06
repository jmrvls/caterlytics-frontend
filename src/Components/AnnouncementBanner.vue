<template>
  <!-- Shows the newest unread Super Admin announcement at the top of a tenant page. -->
  <div
    v-if="current"
    class="mb-4 sm:mb-6 border-l-4 p-4 flex items-start gap-3"
    :class="styles.box"
    role="status"
  >
    <svg class="w-5 h-5 mt-0.5 flex-shrink-0" :class="styles.icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
        d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
    </svg>
    <div class="min-w-0 flex-1">
      <p class="text-xs font-semibold uppercase tracking-wide" :class="styles.label">
        Platform announcement
        <span v-if="unseen.length > 1" class="normal-case font-medium opacity-80">&middot; +{{ unseen.length - 1 }} more in the bell</span>
      </p>
      <p class="text-sm font-bold text-gray-900 dark:text-gray-100 mt-0.5 break-words">{{ current.title }}</p>
      <p class="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-line break-words">{{ current.message }}</p>
      <p class="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">{{ formatDate(current.created_at) }}</p>
    </div>
    <button
      type="button"
      @click="markSeen(current.announcement_id)"
      class="shrink-0 text-xs font-semibold px-3 py-1.5 bg-white/70 dark:bg-black/20 hover:bg-white dark:hover:bg-black/40 text-gray-700 dark:text-gray-200 transition"
    >
      Dismiss
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useAnnouncements } from '../composables/useAnnouncements'

const { unseen, markSeen } = useAnnouncements()

const current = computed(() => unseen.value[0] || null)

const STYLE_MAP = {
  info: {
    box: 'bg-blue-50 dark:bg-blue-900/20 border-blue-500',
    icon: 'text-blue-600 dark:text-blue-400',
    label: 'text-blue-700 dark:text-blue-300',
  },
  warning: {
    box: 'bg-amber-50 dark:bg-amber-900/20 border-amber-500',
    icon: 'text-amber-600 dark:text-amber-400',
    label: 'text-amber-700 dark:text-amber-300',
  },
  critical: {
    box: 'bg-red-50 dark:bg-red-900/20 border-red-500',
    icon: 'text-red-600 dark:text-red-400',
    label: 'text-red-700 dark:text-red-300',
  },
}
const styles = computed(() => STYLE_MAP[current.value?.severity] || STYLE_MAP.info)

function formatDate(v) {
  if (!v) return ''
  return new Date(v).toLocaleString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}
</script>