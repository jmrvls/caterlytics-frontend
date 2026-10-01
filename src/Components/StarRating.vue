<template>
  <span class="inline-flex items-center gap-0.5" :aria-label="label">
    <component
      :is="interactive ? 'button' : 'span'"
      v-for="n in 5"
      :key="n"
      :type="interactive ? 'button' : undefined"
      @click="interactive && emit('update:modelValue', n)"
      :class="interactive ? 'cursor-pointer hover:scale-110 transition' : ''"
    >
      <svg :class="[sizeClass, n <= Math.round(modelValue || 0) ? 'text-amber-400' : 'text-gray-300 dark:text-gray-600']" viewBox="0 0 20 20" fill="currentColor">
        <path d="M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.3a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.3c.3.92-.76 1.69-1.54 1.12l-2.8-2.04a1 1 0 00-1.18 0l-2.8 2.04c-.78.57-1.84-.2-1.54-1.12l1.07-3.3a1 1 0 00-.36-1.12L3 8.73c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.05-3.3z" />
      </svg>
    </component>
  </span>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  interactive: { type: Boolean, default: false },
  size: { type: String, default: 'sm' } // 'sm' | 'md' | 'lg'
})
const emit = defineEmits(['update:modelValue'])

const sizeClass = computed(() => ({ sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' }[props.size] || 'w-3.5 h-3.5'))
const label = computed(() => `${props.modelValue || 0} out of 5 stars`)
</script>