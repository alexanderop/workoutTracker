<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

type Props = {
  /** Progress value from 0-100 */
  progress: number
  /** Tailwind color class for progress arc (e.g., 'text-primary') */
  progressColor?: string
  /** Apply urgent styling (destructive color) */
  urgent?: boolean
  /** Whether to show the progress arc (false hides it, useful for ForTime without cap) */
  showProgress?: boolean
}

const {
  progress,
  progressColor = 'text-primary',
  urgent = false,
  showProgress = true,
} = defineProps<Props>()

defineSlots<{
  default: () => unknown
}>()

const circleRadius = 140
const circleCircumference = 2 * Math.PI * circleRadius
const strokeDashoffset = computed(
  () => circleCircumference - (progress / 100) * circleCircumference,
)
</script>

<template>
  <div class="relative">
    <svg class="w-[320px] h-[320px] -rotate-90" viewBox="0 0 320 320">
      <!-- Track -->
      <circle
        cx="160"
        cy="160"
        :r="circleRadius"
        fill="none"
        stroke="currentColor"
        stroke-width="8"
        class="text-muted/30"
      />

      <!-- Progress -->
      <circle
        v-if="showProgress"
        cx="160"
        cy="160"
        :r="circleRadius"
        fill="none"
        stroke="currentColor"
        stroke-width="8"
        stroke-linecap="round"
        :stroke-dasharray="circleCircumference"
        :stroke-dashoffset="strokeDashoffset"
        :class="cn('transition-all duration-200', urgent ? 'text-destructive' : progressColor)"
      />
    </svg>

    <!-- Content Slot -->
    <div class="absolute inset-0 flex flex-col items-center justify-center">
      <slot />
    </div>
  </div>
</template>
