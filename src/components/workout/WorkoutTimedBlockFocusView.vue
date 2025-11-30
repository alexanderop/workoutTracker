<script setup lang="ts">
import { ChevronDown, Pause, Play, RotateCcw } from 'lucide-vue-next'
import { computed } from 'vue'
import { Button } from '@/components/ui/button'
import type { useBlockTimer } from '@/composables/useBlockTimer'
import { cn } from '@/lib/utils'
import type { TimedBlock } from '@/types/blocks'
import { BLOCK_LABELS, getBlockExerciseList } from '@/types/blocks'

type Props = {
  block: TimedBlock
  blockTimer: ReturnType<typeof useBlockTimer>
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'complete-block': []
  'increment-round': []
  'end-workout': []
  collapse: []
}>()

const exercises = computed(() => getBlockExerciseList(props.block))

// Current exercise based on block state
const currentExerciseIndex = computed(() => {
  const state = props.blockTimer.blockState.value
  if (!state) return 0

  switch (state.kind) {
    case 'emom':
      return state.state.currentExerciseIndex
    case 'amrap':
      return state.state.currentExerciseIndex
    default:
      return 0
  }
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
  const kind = props.block.kind
  switch (kind) {
    case 'emom':
      return String(props.blockTimer.secondsInCurrentMinute.value).padStart(2, '0')
    case 'tabata':
      return String(props.blockTimer.secondsInCurrentPhase.value).padStart(2, '0')
    case 'amrap':
      return props.blockTimer.formattedRemaining.value
    case 'fortime':
      return props.blockTimer.formattedElapsed.value
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
})

// Progress for circular indicator (0-100)
const circularProgress = computed((): number => {
  const kind = props.block.kind
  switch (kind) {
    case 'emom':
      // Progress within the current minute (60 -> 0 seconds)
      return ((60 - props.blockTimer.secondsInCurrentMinute.value) / 60) * 100
    case 'tabata': {
      const phase = props.blockTimer.currentPhase.value
      const seconds = props.blockTimer.secondsInCurrentPhase.value
      const total =
        phase === 'work' ? props.block.config.workSeconds : props.block.config.restSeconds
      return ((total - seconds) / total) * 100
    }
    case 'amrap':
    case 'fortime':
      return props.blockTimer.progress.value
    default: {
      const _exhaustive: never = kind
      return _exhaustive
    }
  }
})

// Round/minute indicator text
const progressLabel = computed((): string => {
  const kind = props.block.kind
  switch (kind) {
    case 'emom':
      return `MINUTE ${props.blockTimer.currentMinute.value} OF ${props.block.config.minutes}`
    case 'tabata':
      return `ROUND ${props.blockTimer.currentRound.value} / ${props.block.config.rounds}`
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
  switch (props.block.kind) {
    case 'emom':
      return props.blockTimer.secondsInCurrentMinute.value <= 5
    case 'tabata':
      return props.blockTimer.secondsInCurrentPhase.value <= 3
    case 'amrap':
      return props.blockTimer.remainingSeconds.value <= 10
    default:
      return false
  }
})

// Tabata phase indicator
const tabataPhase = computed(() => {
  if (props.block.kind !== 'tabata') return null
  return props.blockTimer.currentPhase.value
})

// SVG circle calculations
const circleRadius = 140
const circleCircumference = 2 * Math.PI * circleRadius
const strokeDashoffset = computed(
  () => circleCircumference - (circularProgress.value / 100) * circleCircumference,
)
</script>

<template>
  <div
    class="fixed inset-0 z-50 bg-background flex flex-col safe-area-top safe-area-bottom overflow-hidden"
  >
    <!-- Minimal Header -->
    <header class="flex items-center justify-between px-4 py-3">
      <Button variant="ghost" size="icon" class="text-muted-foreground" @click="emit('collapse')">
        <ChevronDown class="size-5" />
      </Button>

      <div class="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
        {{ progressLabel }}
      </div>

      <Button
        variant="ghost"
        size="sm"
        class="text-destructive/70 hover:text-destructive"
        @click="emit('end-workout')"
      >
        End
      </Button>
    </header>

    <!-- Main Timer Area -->
    <div class="flex-1 flex flex-col items-center justify-center px-6 -mt-8">
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
      <div class="relative">
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
                isUrgent ? 'text-destructive' : 'text-primary',
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
                block.kind === 'emom' || block.kind === 'tabata'
                  ? 'text-[5.5rem] leading-none'
                  : 'text-5xl',
                isUrgent && 'text-destructive animate-pulse',
              )
            "
          >
            {{
              block.kind === 'emom' || block.kind === 'tabata' ? `:${timerDisplay}` : timerDisplay
            }}
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
      <div
        v-if="nextExercises.length > 0"
        class="mt-6 flex items-center gap-2 text-muted-foreground"
      >
        <span class="text-xs uppercase tracking-wide">Next:</span>
        <span v-for="(ex, i) in nextExercises" :key="ex.id" class="text-sm">
          {{ ex.name }}<span v-if="i < nextExercises.length - 1" class="mx-1">→</span>
        </span>
      </div>

      <!-- AMRAP Round Counter -->
      <div v-if="block.kind === 'amrap'" class="mt-8 flex items-center gap-6">
        <div class="text-center">
          <div class="text-5xl font-bold text-primary tabular-nums">
            {{ blockTimer.roundsCompleted }}
          </div>
          <div class="text-xs text-muted-foreground uppercase tracking-wider mt-1">Rounds</div>
        </div>
        <Button
          size="lg"
          variant="outline"
          class="h-16 w-20 text-xl font-bold"
          :disabled="!blockTimer.isRunning.value"
          @click="emit('increment-round')"
        >
          +1
        </Button>
      </div>
    </div>

    <!-- Control Bar -->
    <div class="px-6 pb-6 space-y-3">
      <!-- Primary Controls -->
      <div class="flex gap-3">
        <Button
          variant="outline"
          size="lg"
          class="h-14 w-14 rounded-full"
          @click="blockTimer.reset"
        >
          <RotateCcw class="size-5" />
        </Button>

        <Button
          :variant="blockTimer.isRunning.value ? 'secondary' : 'default'"
          size="lg"
          class="flex-1 h-14 text-lg font-semibold rounded-full"
          @click="blockTimer.toggle"
        >
          <component :is="blockTimer.isRunning.value ? Pause : Play" class="size-5 mr-2" />
          {{ blockTimer.isRunning.value ? 'Pause' : 'Start' }}
        </Button>

        <Button
          variant="default"
          size="lg"
          class="h-14 px-6 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
          @click="emit('complete-block')"
        >
          Done
        </Button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Ensure the focus view takes full screen on mobile */
@supports (height: 100dvh) {
  .fixed.inset-0 {
    height: 100dvh;
  }
}
</style>
