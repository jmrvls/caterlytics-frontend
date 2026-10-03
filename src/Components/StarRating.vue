<template>
  <span
    class="inline-flex items-center gap-0.5"
    :role="interactive ? 'radiogroup' : 'img'"
    :aria-label="label"
    @mouseleave="hover = 0"
  >
    <component
      :is="interactive ? 'button' : 'span'"
      v-for="n in 5"
      :key="n"
      :type="interactive ? 'button' : undefined"
      :role="interactive ? 'radio' : undefined"
      :aria-checked="interactive ? n === Math.round(modelValue || 0) : undefined"
      :aria-label="interactive ? `${n} star${n === 1 ? '' : 's'}` : undefined"
      @click="interactive && emit('update:modelValue', n)"
      @mouseenter="interactive && (hover = n)"
      @focus="interactive && (hover = n)"
      @blur="interactive && (hover = 0)"
      :class="interactive ? 'cursor-pointer hover:scale-110 transition' : ''"
    >
      <span class="relative inline-block">
        <svg :class="[sizeClass, 'text-gray-300 dark:text-gray-600']" viewBox="0 0 20 20" fill="currentColor">
          <path :d="starPath" />
        </svg>
        <span class="absolute inset-y-0 left-0 overflow-hidden" :style="{ width: fillPercent(n) + '%' }">
          <svg :class="[sizeClass, 'text-amber-400 max-w-none flex-none']" viewBox="0 0 20 20" fill="currentColor">
            <path :d="starPath" />
          </svg>
        </span>
      </span>
    </component>
  </span>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  modelValue: { type: Number, default: 0 },
  interactive: { type: Boolean, default: false },
  size: { type: String, default: 'sm' } // 'sm' | 'md' | 'lg'
})
const emit = defineEmits(['update:modelValue'])

const starPath = 'M9.05 2.93c.3-.92 1.6-.92 1.9 0l1.07 3.3a1 1 0 00.95.69h3.46c.97 0 1.37 1.24.59 1.81l-2.8 2.03a1 1 0 00-.36 1.12l1.07 3.3c.3.92-.76 1.69-1.54 1.12l-2.8-2.04a1 1 0 00-1.18 0l-2.8 2.04c-.78.57-1.84-.2-1.54-1.12l1.07-3.3a1 1 0 00-.36-1.12L3 8.73c-.78-.57-.38-1.81.59-1.81h3.46a1 1 0 00.95-.69l1.05-3.3z'

const hover = ref(0)
const sizeClass = computed(() => ({ sm: 'w-3.5 h-3.5', md: 'w-5 h-5', lg: 'w-7 h-7' }[props.size] || 'w-3.5 h-3.5'))
const label = computed(() => `${Number(props.modelValue || 0).toFixed(props.interactive ? 0 : 1)} out of 5 stars`)

// Interactive: whole stars (with hover preview). Read-only: averages show
// in half-star steps so 4.4 reads as 4.5 stars instead of rounding to 4.
function fillPercent(n) {
  if (props.interactive) {
    const shown = hover.value || Math.round(props.modelValue || 0)
    return n <= shown ? 100 : 0
  }
  const v = Math.max(0, Math.min(5, Number(props.modelValue) || 0))
  const f = Math.max(0, Math.min(1, v - (n - 1)))
  return Math.round(f * 2) / 2 * 100
}
</script>