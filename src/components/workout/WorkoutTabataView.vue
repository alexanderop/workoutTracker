<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useTabataTimer } from '@/composables/timers/useTabataTimer'
import { cn } from '@/lib/utils'
import type { TabataBlock, TabataResult } from '@/types/blocks'
import { getBlockExerciseList } from '@/types/blocks'
import WorkoutCircularTimer from './WorkoutCircularTimer.vue'

const { t } = useI18n()

type Props = {
  block: TabataBlock
  onComplete?: () => void
}

const { block, onComplete } = defineProps<Props>()

const emit = defineEmits<{
  'update:isRunning': [value: boolean]
}>()

const timer = useTabataTimer({ onComplete })

// Emit when isRunning changes so parent can react
watch(timer.isRunning, (isRunning) => {
  emit('update:isRunning', isRunning)
})

const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[0])

const progressLabel = computed(
  () => `${t('timers.workout.tabata.round')}${timer.currentRound.value} / ${block.config.rounds}`,
)

const isUrgent = computed(() => timer.secondsInCurrentPhase.value <= 3)

const phaseColors = computed(() => {
  if (timer.currentPhase.value === 'work') {
    return { text: 'text-emerald-400', bg: 'bg-emerald-500/20' }
  }
  return { text: 'text-amber-400', bg: 'bg-amber-500/20' }
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

// Footer display format
const formattedTime = computed(() => {
  const phase =
    timer.currentPhase.value === 'work'
      ? t('timers.workout.tabata.work')
      : t('timers.workout.tabata.rest')
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
    <WorkoutCircularTimer
      :progress="circularProgress"
      :progress-color="phaseColors.text"
      :urgent="isUrgent"
      class="mb-6"
    >
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
        <p class="text-sm text-muted-foreground">
          {{ currentExercise.prescribedReps }} {{ t('workouts.builder.timedCard.reps') }}
        </p>
      </div>
    </WorkoutCircularTimer>
  </div>
</template>
