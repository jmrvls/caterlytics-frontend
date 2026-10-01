<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" @click.self="emit('close')">
    <div class="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl shadow-xl p-6">
      <h3 class="font-bold text-gray-900 dark:text-gray-100">Rate your experience</h3>
      <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">{{ booking?.package_name || 'Your booking' }}</p>

      <div class="flex justify-center my-5">
        <StarRating v-model="rating" interactive size="lg" />
      </div>

      <textarea
        v-model="comment"
        rows="4"
        maxlength="1000"
        placeholder="Tell other clients about the food, service, and punctuality (optional)"
        class="w-full p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 text-gray-900 dark:text-gray-100"
      ></textarea>

      <p v-if="error" class="text-sm text-red-600 dark:text-red-400 mt-2">{{ error }}</p>

      <div class="flex gap-3 mt-5">
        <button type="button" @click="emit('close')" class="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Cancel</button>
        <button type="button" :disabled="!rating || isSaving" @click="submit" class="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold disabled:opacity-50">
          {{ isSaving ? 'Submitting…' : 'Submit review' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import StarRating from './StarRating.vue'
import { submitReview } from '../services/catalogService'

const props = defineProps({ booking: { type: Object, default: null } })
const emit = defineEmits(['close', 'submitted'])

const rating = ref(0)
const comment = ref('')
const isSaving = ref(false)
const error = ref('')

async function submit() {
  if (!rating.value || !props.booking) return
  isSaving.value = true
  error.value = ''
  try {
    await submitReview(props.booking.booking_id, rating.value, comment.value)
    emit('submitted', props.booking.booking_id)
  } catch (e) {
    error.value = e.message || 'Failed to submit review.'
  } finally {
    isSaving.value = false
  }
}
</script>