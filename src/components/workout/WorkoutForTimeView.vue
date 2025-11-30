<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useForTimeTimer } from '@/composables/timers/useForTimeTimer'
import { cn } from '@/lib/utils'
import type { ForTimeBlock, ForTimeResult } from '@/types/blocks'
import { BLOCK_COLORS, BLOCK_LABELS, getBlockExerciseList } from '@/types/blocks'

type Props = {
  block: ForTimeBlock
  onComplete?: () => void
}

const { block, onComplete } = defineProps<Props>()

const timer = useForTimeTimer({ onComplete })

const blockColors = computed(() => BLOCK_COLORS.fortime)
const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[0])

// SVG circle calculations - progress toward time cap (if set)
const circleRadius = 140
const circleCircumference = 2 * Math.PI * circleRadius
const strokeDashoffset = computed(
  () => circleCircumference - (timer.progress.value / 100) * circleCircumference,
)

const hasTimeCap = computed(() => !!block.config.timeCapSeconds)

// Initialize timer on mount
onMounted(() => {
  timer.initialize(block)
})

// Expose for parent coordination
defineExpose({
  complete: (): ForTimeResult => timer.complete(),
  toggle: () => timer.toggle(),
  reset: () => timer.reset(),
  finishWorkout: () => timer.finishWorkout(),
  isRunning: timer.isRunning,
  formattedTime: timer.formattedElapsed,
  timerLabel: BLOCK_LABELS.fortime,
})
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center px-6">
    <!-- Progress label -->
    <div class="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
      {{ BLOCK_LABELS.fortime }}
    </div>

    <!-- Circular Timer -->
    <div class="relative mb-6">
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

        <!-- Progress (only visible if time cap set) -->
        <circle
          v-if="hasTimeCap"
          cx="160"
          cy="160"
          :r="circleRadius"
          fill="none"
          stroke="currentColor"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="circleCircumference"
          :stroke-dashoffset="strokeDashoffset"
          :class="cn('transition-all duration-200', blockColors.text)"
        />
      </svg>

      <!-- Timer Display -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span class="text-5xl font-mono tabular-nums font-bold text-foreground">
          {{ timer.formattedElapsed.value }}
        </span>

        <!-- Current Exercise (inside circle) -->
        <div v-if="currentExercise" class="mt-4 text-center max-w-[200px]">
          <p class="text-lg font-semibold text-foreground truncate">
            {{ currentExercise.name }}
          </p>
          <p class="text-sm text-muted-foreground">{{ currentExercise.prescribedReps }} reps</p>
        </div>
      </div>
    </div>

    <!-- Time Cap indicator -->
    <div v-if="hasTimeCap" class="text-sm text-muted-foreground">
      Cap: {{ Math.floor(block.config.timeCapSeconds! / 60) }}:{{
        String(block.config.timeCapSeconds! % 60).padStart(2, '0')
      }}
    </div>
  </div>
</template>
