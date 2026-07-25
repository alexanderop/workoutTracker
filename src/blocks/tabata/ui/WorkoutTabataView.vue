<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTabataTimer } from '@/blocks/tabata/useTabataTimer'
import { useTimerAudio } from '@/composables/timers/useTimerAudio'
import { cn } from '@/lib/utils'
import type { TabataBlock, TabataResult } from '@/blocks'
import { getBlockExerciseList } from '@/blocks'
import WorkoutCircularTimer from '@/blocks/ui/WorkoutCircularTimer.vue'

const { t } = useI18n()

type Properties = {
  block: TabataBlock
  onComplete?: () => void
}

const { block, onComplete } = defineProps<Properties>()

const emit = defineEmits<{
  'update:isRunning': [value: boolean]
}>()

const audio = useTimerAudio()

function handleComplete() {
  audio.playComplete()
  onComplete?.()
}

function handlePhaseChange(phase: 'work' | 'rest') {
  if (phase === 'work') {
    audio.playWorkBeep()
    return
  }
  audio.playRestBeep()
}

function handleRoundChange() {
  audio.playRoundBeep()
}

const timer = useTabataTimer({
  onComplete: handleComplete,
  onPhaseChange: handlePhaseChange,
  onRoundChange: handleRoundChange,
})

// Emit when isRunning changes so parent can react
watch(timer.isRunning, (isRunning, wasRunning) => {
  emit('update:isRunning', isRunning)
  // Play work beep when timer first starts (idle -> running)
  if (isRunning && !wasRunning) {
    audio.playWorkBeep()
  }
})

const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[0])

// Standalone quick-timer tabata sessions use a generic placeholder exercise
// ("Work") that has no real name to show. Real workout exercises keep their
// own name across both phases; the placeholder tracks the current phase
// instead so it never reads stale (e.g. "Work" while resting).
const isPlaceholderExercise = computed(() => currentExercise.value?.id === 'standalone')

const isUrgent = computed(() => timer.secondsInCurrentPhase.value <= 3)

// Phase colors: work = success ("go"), rest = warning ("hold")
const phaseColors = computed(() => {
  if (timer.currentPhase.value === 'work') {
    return {
      text: 'text-success',
      bg: 'bg-success/30',
      border: 'border-success/50',
    }
  }
  return {
    text: 'text-warning',
    bg: 'bg-warning/30',
    border: 'border-warning/50',
  }
})

// Progress within current phase (0-100)
const circularProgress = computed(() => {
  const seconds = timer.secondsInCurrentPhase.value
  const total =
    timer.currentPhase.value === 'work' ? block.config.workSeconds : block.config.restSeconds
  return ((total - seconds) / total) * 100
})

// Timer display - seconds in current phase
const timerDisplay = computed(() => String(timer.secondsInCurrentPhase.value).padStart(2, '0'))

// Localized phase label
const phaseLabel = computed(() =>
  timer.currentPhase.value === 'work'
    ? t('timers.workout.tabata.work')
    : t('timers.workout.tabata.rest'),
)

// Footer display format
const formattedTime = computed(() => {
  return `R${timer.currentRound.value}/${block.config.rounds} ${phaseLabel.value} :${String(timer.secondsInCurrentPhase.value).padStart(2, '0')}`
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
  <div class="flex-1 flex flex-col items-center justify-center px-4">
    <!-- Circular Timer - gym variant with all info inside -->
    <WorkoutCircularTimer
      variant="gym"
      :progress="circularProgress"
      :progress-color="phaseColors.text"
      :urgent="isUrgent"
    >
      <!-- Phase Badge - inside circle at top -->
      <div
        :class="
          cn(
            'mb-2 px-6 py-1.5 rounded-lg text-xl font-black uppercase tracking-widest transition-all border-2',
            phaseColors.bg,
            phaseColors.text,
            phaseColors.border,
          )
        "
      >
        {{ phaseLabel }}
      </div>

      <!-- MASSIVE time display for gym floor readability -->
      <span
        :class="
          cn(
            'text-[7rem] leading-none font-mono tabular-nums font-black tracking-tight transition-colors',
            isUrgent && 'text-destructive animate-pulse',
          )
        "
      >
        {{ timerDisplay }}
      </span>

      <!-- Round counter - prominent inside circle -->
      <div class="mt-2 flex items-center gap-2">
        <span class="text-3xl font-black tabular-nums" :class="phaseColors.text">
          {{ timer.currentRound.value }}
        </span>
        <span class="text-xl text-muted-foreground font-bold">/</span>
        <span class="text-xl text-muted-foreground font-bold tabular-nums">
          {{ block.config.rounds }}
        </span>
      </div>

      <!-- Current Exercise (inside circle) - smaller, secondary -->
      <div v-if="currentExercise" class="mt-2 text-center max-w-[220px]">
        <p class="text-base font-semibold text-foreground/80 truncate">
          {{ isPlaceholderExercise ? phaseLabel : currentExercise.name }}
        </p>
      </div>
    </WorkoutCircularTimer>
  </div>
</template>
