<template>
  <!-- Super Admin only: the one feed that applies to them is "a business is
       waiting for approval". No bookings / inventory (they have no business). -->
  <div class="relative">
    <button
      @click="open = !open"
      class="relative p-2 rounded-none text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
      title="Notifications"
    >
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
          d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      <span
        v-if="totalUnread > 0"
        class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold"
      >
        {{ totalUnread > 9 ? '9+' : totalUnread }}
      </span>
    </button>

    <div v-if="open" @click="open = false" class="fixed inset-0 z-40"></div>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none shadow-lg z-50"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <span class="font-semibold text-sm text-gray-800 dark:text-gray-100">Notifications</span>
        <button
          v-if="totalUnread > 0"
          @click="markAllRead"
          class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Mark all read
        </button>
      </div>

      <div class="max-h-80 overflow-y-auto">
        <div class="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Pending Business Approvals
        </div>
        <div v-if="loading" class="px-4 pb-3 text-sm text-gray-400">Loading…</div>
        <div v-else-if="pendingBusinesses.length === 0" class="px-4 pb-3 text-sm text-gray-400">
          No businesses waiting for approval.
        </div>
        <button
          v-for="b in pendingBusinesses"
          :key="b.business_id"
          @click="goToPending"
          class="w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <svg class="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2M5 21H3m4-14h.01M7 11h.01M7 15h.01m4-8h.01M11 11h.01M11 15h.01m4-8h.01M15 11h.01M15 15h.01" />
          </svg>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{{ b.business_name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ b.owner_full_name || 'Unknown owner' }} · registered {{ formatDate(b.created_at) }}
            </p>
          </div>
        </button>
      </div>

      <div v-if="lifecycleAlerts.length" class="border-t border-gray-100 dark:border-gray-700">
        <div class="px-4 pt-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
          Subscription &amp; Activity Alerts
        </div>
        <button
          v-for="a in lifecycleAlerts"
          :key="a.key"
          @click="goToLifecycle(a)"
          class="w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <span
            class="mt-1.5 w-2 h-2 rounded-full flex-shrink-0"
            :class="a.severity === 'high' ? 'bg-red-500' : a.severity === 'medium' ? 'bg-amber-500' : 'bg-gray-400'"
          ></span>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{{ a.business_name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ a.text }}</p>
          </div>
        </button>
      </div>

      <div class="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700">
        <button @click="goToPending" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
          View Pending Businesses →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '../composables/useNotifications'

const router = useRouter()
const open = ref(false)
const { pendingBusinesses, pendingBusinessUnreadCount, lifecycleAlerts, lifecycleUnreadCount, loading, markAllRead } = useNotifications()

const totalUnread = computed(() => pendingBusinessUnreadCount.value + lifecycleUnreadCount.value)


function formatDate(v) {
  if (!v) return '—'
  return new Date(v).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
}

function goToLifecycle(a) {
  open.value = false
  const lifecycle = a.kind === 'expiring' ? 'Expiring' : a.kind === 'expired' ? 'Expired' : 'Inactive'
  router.push({ path: '/super-admin/dashboard', query: { lifecycle } })
}

function goToPending() {
  open.value = false
  router.push({ path: '/super-admin/dashboard', query: { filter: 'Pending' } })
}
</script>