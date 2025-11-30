<script setup lang="ts">
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import type { useBlockTimer } from '@/composables/useBlockTimer'
import { cn } from '@/lib/utils'
import type { TimedBlock } from '@/types/blocks'
import { BLOCK_COLORS, BLOCK_LABELS, getBlockExerciseList } from '@/types/blocks'

type Props = {
  block: TimedBlock
  blockTimer: ReturnType<typeof useBlockTimer>
}

const { block, blockTimer } = defineProps<Props>()

const emit = defineEmits<{
  'increment-round': []
}>()

const blockColors = computed(() => BLOCK_COLORS[block.kind])
const exercises = computed(() => getBlockExerciseList(block))

// Current exercise based on block state
const currentExerciseIndex = computed(() => {
  const state = blockTimer.blockState.value
  if (!state) return 0

  if (state.kind === 'emom' || state.kind === 'amrap') {
    return state.state.currentExerciseIndex
  }
  return 0
})

const currentExercise = computed(() => exercises.value[currentExerciseIndex.value])

const nextExercises = computed(() => {
  if (exercises.value.length <= 1) return []
  const next = []
  for (let i = 1; i <= 2; i++) {
    const idx = (currentExerciseIndex.value + i) % exercises.value.length
    if (exercises.value[idx]) {
      next.push(exercises.value[idx])
    }
  }
  return next
})

// Determine timer display value based on block type
const timerDisplay = computed((): string => {
  const kind = block.kind
  const specific = blockTimer.blockSpecificValues.value
  const values = blockTimer.timerValues.value
  switch (kind) {
    case 'emom':
      return String(specific.secondsRemainingInMinute).padStart(2, '0')
    case 'tabata':
      return String(specific.secondsInCurrentPhase).padStart(2, '0')
    case 'amrap':
      return values.formattedRemaining
    case 'fortime':
      return values.formattedElapsed
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
})

// Progress for circular indicator (0-100)
const circularProgress = computed((): number => {
  const kind = block.kind
  const specific = blockTimer.blockSpecificValues.value
  const values = blockTimer.timerValues.value
  switch (kind) {
    case 'emom':
      return ((60 - specific.secondsRemainingInMinute) / 60) * 100
    case 'tabata': {
      const phase = specific.currentPhase
      const seconds = specific.secondsInCurrentPhase
      const total = phase === 'work' ? block.config.workSeconds : block.config.restSeconds
      return ((total - seconds) / total) * 100
    }
    case 'amrap':
    case 'fortime':
      return values.progress
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
})

// Round/minute indicator text
const progressLabel = computed((): string => {
  const kind = block.kind
  const specific = blockTimer.blockSpecificValues.value
  switch (kind) {
    case 'emom':
      return `MINUTE ${specific.currentMinute} OF ${block.config.minutes}`
    case 'tabata':
      return `ROUND ${specific.currentRound} / ${block.config.rounds}`
    case 'amrap':
      return BLOCK_LABELS.amrap
    case 'fortime':
      return BLOCK_LABELS.fortime
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
})

// Check if in final countdown
const isUrgent = computed(() => {
  const specific = blockTimer.blockSpecificValues.value
  const values = blockTimer.timerValues.value
  switch (block.kind) {
    case 'emom':
      return specific.secondsRemainingInMinute <= 5
    case 'tabata':
      return specific.secondsInCurrentPhase <= 3
    case 'amrap':
      return values.remainingSeconds <= 10
    default:
      return false
  }
})

// Tabata phase indicator
const tabataPhase = computed(() => {
  if (block.kind !== 'tabata') return null
  return blockTimer.blockSpecificValues.value.currentPhase
})

// SVG circle calculations
const circleRadius = 140
const circleCircumference = 2 * Math.PI * circleRadius
const strokeDashoffset = computed(
  () => circleCircumference - (circularProgress.value / 100) * circleCircumference,
)

const showSecondsPrefix = computed(() => block.kind === 'emom' || block.kind === 'tabata')
</script>

<template>
  <div class="flex-1 flex flex-col items-center justify-center px-6">
    <!-- Progress label -->
    <div class="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-4">
      {{ progressLabel }}
    </div>

    <!-- Tabata Phase Badge -->
    <div
      v-if="tabataPhase"
      :class="
        cn(
          'mb-6 px-6 py-2 rounded-full text-sm font-bold uppercase tracking-wider transition-colors',
          tabataPhase === 'work'
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/20 text-amber-400',
        )
      "
    >
      {{ tabataPhase }}
    </div>

    <!-- Circular Timer -->
    <div class="relative mb-6">
      <!-- Background circle -->
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
            cn(
              'transition-all duration-200',
              isUrgent ? 'text-destructive' : blockColors.text,
              tabataPhase === 'rest' && 'text-amber-400',
            )
          "
        />
      </svg>

      <!-- Timer Display -->
      <div class="absolute inset-0 flex flex-col items-center justify-center">
        <span
          :class="
            cn(
              'font-mono tabular-nums font-bold transition-colors',
              showSecondsPrefix ? 'text-[5.5rem] leading-none' : 'text-5xl',
              isUrgent && 'text-destructive animate-pulse',
            )
          "
        >
          {{ showSecondsPrefix ? `:${timerDisplay}` : timerDisplay }}
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

    <!-- Next Exercises (subtle breadcrumb below timer) -->
    <div v-if="nextExercises.length > 0" class="flex items-center gap-2 text-muted-foreground mb-6">
      <span class="text-xs uppercase tracking-wide">Next:</span>
      <span v-for="(ex, i) in nextExercises" :key="ex.id" class="text-sm">
        {{ ex.name }}<span v-if="i < nextExercises.length - 1" class="mx-1">→</span>
      </span>
    </div>

    <!-- AMRAP Round Counter -->
    <div v-if="block.kind === 'amrap'" class="flex items-center gap-6">
      <div class="text-center">
        <div :class="cn('text-5xl font-bold tabular-nums', blockColors.text)">
          {{ blockTimer.blockSpecificValues.value.roundsCompleted }}
        </div>
        <div class="text-xs text-muted-foreground uppercase tracking-wider mt-1">Rounds</div>
      </div>
      <Button
        size="lg"
        variant="outline"
        class="h-16 w-20 text-xl font-bold"
        :disabled="!blockTimer.timerStatus.value.isRunning"
        @click="emit('increment-round')"
      >
        +1
      </Button>
    </div>
  </div>
</template>
