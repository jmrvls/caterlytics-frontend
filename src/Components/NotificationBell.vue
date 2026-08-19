<template>
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
        v-if="unreadCount > 0"
        class="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold"
      >
        {{ unreadCount > 9 ? '9+' : unreadCount }}
      </span>
    </button>

    <!-- backdrop -->
    <div v-if="open" @click="open = false" class="fixed inset-0 z-40"></div>

    <div
      v-if="open"
      class="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-none shadow-lg z-50"
    >
      <div class="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <span class="font-semibold text-sm text-gray-800 dark:text-gray-100">Low Stock Alerts</span>
        <button
          v-if="unreadCount > 0"
          @click="markAllRead"
          class="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
        >
          Mark all read
        </button>
      </div>

      <div class="max-h-72 overflow-y-auto">
        <div v-if="loading" class="px-4 py-6 text-center text-sm text-gray-400">Loading…</div>

        <div v-else-if="lowStockItems.length === 0" class="px-4 py-6 text-center text-sm text-gray-400">
          All stock levels are healthy.
        </div>

        <button
          v-for="item in lowStockItems"
          :key="item.item_id"
          @click="goToInventory"
          class="w-full flex items-start gap-3 px-4 py-3 text-left border-b border-gray-50 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <svg class="w-4 h-4 mt-0.5 text-amber-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div class="min-w-0">
            <p class="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{{ item.item_name }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              {{ item.quantity }} left · threshold {{ item.low_stock_threshold }}
            </p>
          </div>
        </button>
      </div>

      <div class="px-4 py-2.5 border-t border-gray-100 dark:border-gray-700">
        <button @click="goToInventory" class="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
          View Inventory →
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNotifications } from '../composables/useNotifications'

const router = useRouter()
const open = ref(false)
const { lowStockItems, unreadCount, loading, markAllRead } = useNotifications()

function goToInventory() {
  open.value = false
  router.push('/admin/inventory')
}
</script>