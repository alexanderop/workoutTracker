<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useTabataTimer } from '@/composables/timers/useTabataTimer'
import { cn } from '@/lib/utils'
import type { TabataBlock, TabataResult } from '@/types/blocks'
import { getBlockExerciseList } from '@/types/blocks'

type Props = {
  block: TabataBlock
  onComplete?: () => void
}

const { block, onComplete } = defineProps<Props>()

const timer = useTabataTimer({ onComplete })

const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[0])

const progressLabel = computed(() => `ROUND ${timer.currentRound.value} / ${block.config.rounds}`)

const isUrgent = computed(() => timer.secondsInCurrentPhase.value <= 3)

const phaseColors = computed(() => {
  if (timer.currentPhase.value === 'work') {
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/20' }
  }
  return { text: 'text-amber-400', bg: 'bg-amber-500/20' }
})

// SVG circle calculations - progress within current phase
const circleRadius = 140
const circleCircumference = 2 * Math.PI * circleRadius
const circularProgress = computed(() => {
  const seconds = timer.secondsInCurrentPhase.value
  const total =
    timer.currentPhase.value === 'work' ? block.config.workSeconds : block.config.restSeconds
  return ((total - seconds) / total) * 100
})
const strokeDashoffset = computed(
  () => circleCircumference - (circularProgress.value / 100) * circleCircumference,
)

// Timer display - seconds in current phase
const timerDisplay = computed(() => String(timer.secondsInCurrentPhase.value).padStart(2, '0'))

// Footer display format
const formattedTime = computed(() => {
  const phase = timer.currentPhase.value === 'work' ? 'WORK' : 'REST'
  return `R${timer.currentRound.value}/${block.config.rounds} ${phase} :${String(timer.secondsInCurrentPhase.value).padStart(2, '0')}`
})

// Initialize timer on mount
onMounted(() => {
  timer.initialize(block)
})

// Expose for parent coordination
defineExpose({
  complete: (): TabataResult => timer.complete(),
  toggle: () => timer.toggle(),
  reset: () => timer.reset(),
  isRunning: timer.isRunning,
  formattedTime,
  timerLabel: 'TABATA',
})
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center px-6">
    <!-- Progress label -->
    <div class="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
      {{ progressLabel }}
    </div>

    <!-- Phase Badge -->
    <div
      :class="
        cn(
          'mb-6 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors',
          phaseColors.bg,
          phaseColors.text,
        )
      "
    >
      {{ timer.currentPhase.value }}
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
            cn('transition-all duration-200', isUrgent ? 'text-destructive' : phaseColors.text)
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
  </div>
</template>
