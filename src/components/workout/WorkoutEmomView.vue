<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import { useEmomTimer } from '@/composables/timers/useEmomTimer'
import { cn } from '@/lib/utils'
import type { EmomBlock, EmomResult } from '@/types/blocks'
import { BLOCK_COLORS, getBlockExerciseList } from '@/types/blocks'
import WorkoutCircularTimer from './WorkoutCircularTimer.vue'

const { t } = useI18n()

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
  () =>
    `${t('timers.workout.emom.minute')}${timer.currentMinute.value}${t('timers.workout.emom.of')}${block.config.minutes}`,
)

const isUrgent = computed(() => timer.secondsRemainingInMinute.value <= 5)

// Progress within current minute (0-100)
const circularProgress = computed(() => ((60 - timer.secondsRemainingInMinute.value) / 60) * 100)

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
    <WorkoutCircularTimer
      :progress="circularProgress"
      :progress-color="blockColors.text"
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

    <!-- Next Exercises -->
    <div v-if="nextExercises.length > 0" class="flex items-center gap-2 text-muted-foreground mb-6">
      <span class="text-xs uppercase tracking-wide">{{ t('timers.workout.amrap.next') }}</span>
      <span v-for="(ex, i) in nextExercises" :key="ex.id" class="text-sm">
        {{ ex.name }}<span v-if="i < nextExercises.length - 1" class="mx-1">→</span>
      </span>
    </div>
  </div>
</template>
