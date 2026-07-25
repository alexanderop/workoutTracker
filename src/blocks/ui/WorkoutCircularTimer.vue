<script setup lang="ts">
import { computed } from 'vue'
import { cn } from '@/lib/utils'

type Properties = {
  /** Progress value from 0-100 */
  progress: number
  /** Tailwind color class for progress arc (e.g., 'text-primary') */
  progressColor?: string
  /** Apply urgent styling (destructive color) */
  urgent?: boolean
  /** Whether to show the progress arc (false hides it, useful for ForTime without cap) */
  showProgress?: boolean
  /** Size variant - 'default' for standard, 'gym' for larger gym-floor readable */
  variant?: 'default' | 'gym'
}

const {
  progress,
  progressColor = 'text-primary',
  urgent = false,
  showProgress = true,
  variant = 'default',
} = defineProps<Properties>()

defineSlots<{
  default: () => unknown
}>()

// Gym variant: larger circle with thicker stroke for floor visibility
const isGym = computed(() => variant === 'gym')
const circleRadius = computed(() => (isGym.value ? 155 : 140))
const strokeWidth = computed(() => (isGym.value ? 16 : 8))
const viewBoxSize = computed(() => (isGym.value ? 360 : 320))
const center = computed(() => viewBoxSize.value / 2)

const circleCircumference = computed(() => 2 * Math.PI * circleRadius.value)
const strokeDashoffset = computed(
  () => circleCircumference.value - (progress / 100) * circleCircumference.value,
)

const containerClasses = computed(() =>
  isGym.value ? 'w-[360px] h-[360px]' : 'w-[320px] h-[320px]',
)
</script>

<template>
  <div class="relative">
    <svg :class="cn(containerClasses, '-rotate-90')" :viewBox="`0 0 ${viewBoxSize} ${viewBoxSize}`">
      <!-- Track - thicker and more visible in gym mode -->
      <circle
        :cx="center"
        :cy="center"
        :r="circleRadius"
        fill="none"
        stroke="currentColor"
        :stroke-width="strokeWidth"
        :class="isGym ? 'text-muted/40' : 'text-muted/30'"
      />

      <!-- Progress - square caps in gym mode for industrial feel -->
      <circle
        v-if="showProgress"
        :cx="center"
        :cy="center"
        :r="circleRadius"
        fill="none"
        stroke="currentColor"
        :stroke-width="strokeWidth"
        :stroke-linecap="isGym ? 'square' : 'round'"
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
