<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

type Properties = {
  currentExercise: number // 1-based position within current round
  exercisesPerRound: number
  currentRound: number // 1-based
  totalRounds: number
  globalCurrent: number // 1-based global position
  globalTotal: number
}

const {
  currentExercise,
  exercisesPerRound,
  currentRound,
  totalRounds,
  globalCurrent,
  globalTotal,
} = defineProps<Properties>()

const { t } = useI18n()

// Progress within current round (0-100%)
const roundProgress = computed(() => {
  if (exercisesPerRound === 0) return 0
  return ((currentExercise - 1) / exercisesPerRound) * 100
})

// Generate round segments
const roundSegments = computed(() => {
  return Array.from({ length: totalRounds }, (_, index) => {
    const roundNumber = index + 1
    const isCompleted = roundNumber < currentRound
    const isCurrent = roundNumber === currentRound
    return { roundNum: roundNumber, isCompleted, isCurrent }
  })
})
</script>

<template>
  <div
    role="status"
    :aria-label="t('workouts.progress.announcement', { current: globalCurrent, total: globalTotal })"
    class="flex flex-col gap-2"
  >
    <!-- Segmented progress bar -->
    <div class="flex items-center gap-1">
      <template v-for="segment in roundSegments" :key="segment.roundNum">
        <!-- Round segment -->
        <div
          class="flex-1 h-2 rounded-full overflow-hidden transition-all duration-300"
          :class="segment.isCompleted ? 'bg-primary' : 'bg-primary/20'"
        >
          <!-- Progress fill for current round -->
          <div
            v-if="segment.isCurrent"
            class="h-full bg-primary transition-all duration-300"
            :style="{ width: `${roundProgress}%` }"
          />
        </div>
      </template>
    </div>

    <!-- Labels: Round X/Y • Exercise X/Y -->
    <div class="flex items-center justify-between text-xs text-muted-foreground">
      <span v-if="totalRounds > 1" class="font-medium">
        {{ t('workouts.progress.round', { current: currentRound, total: totalRounds }) }}
      </span>
      <span class="font-medium tabular-nums ml-auto">
        {{ t('workouts.progress.exerciseCount', { current: globalCurrent, total: globalTotal }) }}
      </span>
    </div>
  </div>
</template>
