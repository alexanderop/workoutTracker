<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useEmomTimer } from '@/composables/timers/useEmomTimer'
import { cn } from '@/lib/utils'
import type { EmomBlock, EmomResult } from '@/types/blocks'
import { BLOCK_COLORS, getBlockExerciseList } from '@/types/blocks'

type Props = {
  block: EmomBlock
  onComplete?: () => void
}

const { block, onComplete } = defineProps<Props>()

const timer = useEmomTimer({ onComplete })

const blockColors = computed(() => BLOCK_COLORS.emom)
const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[timer.currentExerciseIndex.value])

const nextExercises = computed(() => {
  if (exercises.value.length <= 1) return []
  const next = []
  for (let i = 1; i <= 2; i++) {
    const idx = (timer.currentExerciseIndex.value + i) % exercises.value.length
    if (exercises.value[idx]) {
      next.push(exercises.value[idx])
    }
  }
  return next
})

const progressLabel = computed(
  () => `MINUTE ${timer.currentMinute.value} OF ${block.config.minutes}`,
)

const isUrgent = computed(() => timer.secondsRemainingInMinute.value <= 5)

// SVG circle calculations - progress within current minute
const circleRadius = 140
const circleCircumference = 2 * Math.PI * circleRadius
const circularProgress = computed(() => ((60 - timer.secondsRemainingInMinute.value) / 60) * 100)
const strokeDashoffset = computed(
  () => circleCircumference - (circularProgress.value / 100) * circleCircumference,
)

// Timer display - seconds in current minute
const timerDisplay = computed(() => String(timer.secondsRemainingInMinute.value).padStart(2, '0'))

// Footer display format
const formattedTime = computed(
  () =>
    `${timer.currentMinute.value}/${block.config.minutes} — :${String(timer.secondsRemainingInMinute.value).padStart(2, '0')}`,
)

// Initialize timer on mount
onMounted(() => {
  timer.initialize(block)
})

// Expose for parent coordination
defineExpose({
  complete: (): EmomResult => timer.complete(),
  toggle: () => timer.toggle(),
  reset: () => timer.reset(),
  isRunning: timer.isRunning,
  formattedTime,
  timerLabel: 'EMOM',
})
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center px-6">
    <!-- Progress label -->
    <div class="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
      {{ progressLabel }}
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

        <!-- Progress -->
        <circle
          cx="160"
          cy="160"
          :r="circleRadius"
          fill="none"
          stroke="currentColor"
          stroke-width="8"
          stroke-linecap="round"
          :stroke-dasharray="circleCircumference"
          :stroke-dashoffset="strokeDashoffset"
          :class="
            cn('transition-all duration-200', isUrgent ? 'text-destructive' : blockColors.text)
          "
        />
      </svg>

      <!-- Timer Display -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span
          :class="
            cn(
              'text-[5.5rem] leading-none font-mono tabular-nums font-bold transition-colors',
              isUrgent && 'text-destructive animate-pulse',
            )
          "
        >
          :{{ timerDisplay }}
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

    <!-- Next Exercises -->
    <div v-if="nextExercises.length > 0" class="flex items-center gap-2 text-muted-foreground mb-6">
      <span class="text-xs uppercase tracking-wide">Next:</span>
      <span v-for="(ex, i) in nextExercises" :key="ex.id" class="text-sm">
        {{ ex.name }}<span v-if="i < nextExercises.length - 1" class="mx-1">&rarr;</span>
      </span>
    </div>
  </div>
</template>
