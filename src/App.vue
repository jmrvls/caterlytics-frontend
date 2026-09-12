<template>
  <RouterView />

  <!-- Desktop-site toggle: only shown on phones (lg:hidden). Lets a user
       force the wide/desktop layout instead of the mobile one, the same
       way "Request Desktop Site" works in mobile browsers. -->
  <button
    @click="toggleDesktopMode"
    class="lg:hidden fixed bottom-4 right-4 z-[60] flex items-center gap-2 bg-gray-900/90 dark:bg-gray-700/90 text-white text-xs font-semibold px-3 py-2 rounded-full shadow-lg print:hidden"
  >
    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path v-if="!isDesktopMode" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
    </svg>
    {{ isDesktopMode ? 'Mobile Site' : 'Desktop Site' }}
  </button>
</template>

<script setup>
import { useDesktopMode } from './composables/useDesktopMode'

const { isDesktopMode, toggleDesktopMode } = useDesktopMode()
</script>