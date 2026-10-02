<template>
  <div>
    <div class="relative w-full aspect-square bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden">
      <img v-if="current" :src="current" :alt="alt" class="w-full h-full object-cover" />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-600 text-sm">No image</div>

      <template v-if="images.length > 1">
        <button type="button" @click="step(-1)" class="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center" aria-label="Previous photo">‹</button>
        <button type="button" @click="step(1)" class="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center" aria-label="Next photo">›</button>
        <span class="absolute bottom-2 right-2 text-[10px] font-semibold bg-black/50 text-white px-2 py-0.5 rounded-full">{{ index + 1 }} / {{ images.length }}</span>
      </template>
    </div>

    <div v-if="images.length > 1" class="flex gap-2 mt-3 overflow-x-auto pb-1">
      <button
        v-for="(src, i) in images"
        :key="src + i"
        type="button"
        @click="index = i"
        class="w-14 h-14 rounded-md overflow-hidden flex-shrink-0 border-2 transition"
        :class="i === index ? 'border-emerald-500' : 'border-transparent opacity-70 hover:opacity-100'"
      >
        <img :src="src" :alt="`${alt} photo ${i + 1}`" class="w-full h-full object-cover" />
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

// images: array of URL strings. The first image is usually the package cover.
const props = defineProps({
  images: { type: Array, default: () => [] },
  alt: { type: String, default: 'Package photo' }
})

const index = ref(0)
const current = computed(() => props.images[index.value] || '')
watch(() => props.images, () => { index.value = 0 })

function step(dir) {
  const n = props.images.length
  if (!n) return
  index.value = (index.value + dir + n) % n
}
</script>