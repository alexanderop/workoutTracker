<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useForTimeTimer } from '@/composables/timers/useForTimeTimer'
import type { ForTimeBlock, ForTimeResult } from '@/types/blocks'
import { BLOCK_COLORS, BLOCK_LABELS, getBlockExerciseList } from '@/types/blocks'
import WorkoutCircularTimer from './WorkoutCircularTimer.vue'

const { t } = useI18n()

type Props = {
  block: ForTimeBlock
  onComplete?: () => void
}

const { block, onComplete } = defineProps<Props>()

const emit = defineEmits<{
  'update:isRunning': [value: boolean]
}>()

const timer = useForTimeTimer({ onComplete })

// Emit when isRunning changes so parent can react
watch(timer.isRunning, (isRunning) => {
  emit('update:isRunning', isRunning)
})

const blockColors = computed(() => BLOCK_COLORS.fortime)
const exercises = computed(() => getBlockExerciseList(block))
const currentExercise = computed(() => exercises.value[0])

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
    <WorkoutCircularTimer
      :progress="timer.progress.value"
      :progress-color="blockColors.text"
      :show-progress="hasTimeCap"
      class="mb-6"
    >
      <span class="text-5xl font-mono tabular-nums font-bold text-foreground">
        {{ timer.formattedElapsed.value }}
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

    <!-- Time Cap indicator -->
    <div v-if="hasTimeCap" class="text-sm text-muted-foreground">
      {{ t('timers.workout.fortime.cap') }}{{ Math.floor(block.config.timeCapSeconds! / 60) }}:{{
        String(block.config.timeCapSeconds! % 60).padStart(2, '0')
      }}
    </div>
  </div>
</template>
