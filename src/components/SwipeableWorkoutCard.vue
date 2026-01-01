<script setup lang="ts">
import { computed, ref, watch, useTemplateRef } from 'vue'
import { useSwipe } from '@vueuse/core'
import { useI18n } from 'vue-i18n'
import { Trash2 } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

const { workoutId, isOpen } = defineProps<{
  workoutId: string
  isOpen: boolean
}>()
const emit = defineEmits<{
  open: [id: string]
  close: [id: string]
  delete: [id: string]
}>()

defineSlots<{
  default: () => unknown
}>()

const { t } = useI18n()

const DELETE_BUTTON_WIDTH = 80
const SWIPE_THRESHOLD = 50

const containerRef = useTemplateRef<HTMLElement>('containerRef')
const offset = ref(0)
const isDragging = ref(false)

// Use VueUse's useSwipe for touch gesture detection
const { lengthX, isSwiping, direction } = useSwipe(containerRef, {
  passive: true,
  threshold: 10,
  onSwipe() {
    if (direction.value !== 'left' && direction.value !== 'right') return

    isDragging.value = true
    // Calculate offset based on swipe length, clamped to reasonable bounds
    const swipeOffset = -lengthX.value
    offset.value = Math.max(-DELETE_BUTTON_WIDTH, Math.min(0, swipeOffset))
  },
  onSwipeEnd() {
    isDragging.value = false

    // If swiped past threshold, snap to open position
    if (offset.value < -SWIPE_THRESHOLD) {
      offset.value = -DELETE_BUTTON_WIDTH
      emit('open', workoutId)
      return
    }

    // Otherwise snap back to closed
    offset.value = 0
    if (isOpen) {
      emit('close', workoutId)
    }
  },
})

// Watch for external close (when another card opens)
watch(
  () => isOpen,
  (isOpen) => {
    if (!isOpen && offset.value !== 0) {
      offset.value = 0
    }
  },
)

// Computed style for the sliding content
const contentStyle = computed(() => ({
  transform: `translateX(${offset.value}px)`,
  transition: isDragging.value || isSwiping.value ? 'none' : 'transform 0.2s ease-out',
}))

// Only render delete button when it could be visible
const showDeleteButton = computed(() => offset.value < 0 || isOpen || isDragging.value)

// Handle click on the content area (not the delete button)
function handleContentClick(event: MouseEvent | KeyboardEvent): void {
  // If card is open, close it and prevent navigation
  if (isOpen) {
    event.preventDefault()
    event.stopPropagation()
    offset.value = 0
    emit('close', workoutId)
    return
  }

  // If card is closed, let the click propagate normally (for navigation)
}

function handleDeleteClick(event: MouseEvent): void {
  event.preventDefault()
  event.stopPropagation()
  emit('delete', workoutId)
}

// Keyboard support for accessibility (WCAG 2.1.1)
function handleDeleteKeypress(event: KeyboardEvent): void {
  event.preventDefault()
  event.stopPropagation()
  emit('delete', workoutId)
}
</script>

<template>
  <div
    ref="containerRef"
    class="relative overflow-hidden touch-pan-y"
    data-swipeable
    :data-workout-id="workoutId"
  >
    <!-- Live region for screen reader announcements (WCAG 4.1.3) -->
    <div class="sr-only" role="status" aria-live="polite" aria-atomic="true">
      <span v-if="isOpen">{{ t('workouts.swipe.deleteRevealed') }}</span>
    </div>

    <!-- Delete action button (behind the card) - only render when visible -->
    <Button
      v-if="showDeleteButton"
      variant="destructive"
      class="absolute right-0 top-0 z-0 h-full rounded-none px-6"
      :style="{ width: `${DELETE_BUTTON_WIDTH}px` }"
      :aria-label="t('workouts.deleteWorkout.confirmButton')"
      @click="handleDeleteClick"
    >
      <Trash2 class="h-5 w-5" aria-hidden="true" />
    </Button>

    <!-- Sliding content wrapper with keyboard support -->
    <div
      class="relative z-10 bg-background"
      :style="contentStyle"
      @click="handleContentClick"
      @keydown.delete="handleDeleteKeypress"
    >
      <slot />
    </div>
  </div>
</template>
