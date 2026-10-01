<template>
  <button
    type="button"
    @click.stop="emit('toggle')"
    :aria-pressed="active"
    :aria-label="active ? 'Remove from favorites' : 'Save to favorites'"
    class="rounded-full bg-white/90 dark:bg-gray-900/80 backdrop-blur shadow flex items-center justify-center transition hover:scale-110 active:scale-95"
    :class="small ? 'w-7 h-7' : 'w-9 h-9'"
  >
    <svg :class="[small ? 'w-4 h-4' : 'w-5 h-5', active ? 'text-red-500' : 'text-gray-400']" viewBox="0 0 24 24" :fill="active ? 'currentColor' : 'none'" stroke="currentColor" stroke-width="2">
      <path stroke-linecap="round" stroke-linejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  </button>
</template>

<script setup>
defineProps({ active: { type: Boolean, default: false }, small: { type: Boolean, default: false } })
const emit = defineEmits(['toggle'])
</script>