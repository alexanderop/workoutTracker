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
  <div class="flex-1 flex flex-col items-center justify-center px-4">
    <!-- Circular Timer - gym variant with all info inside -->
    <WorkoutCircularTimer
      variant="gym"
      :progress="timer.progress.value"
      :progress-color="blockColors.text"
      :show-progress="hasTimeCap"
    >
      <!-- Label inside circle -->
      <div class="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">
        {{ BLOCK_LABELS.fortime }}
      </div>

      <!-- MASSIVE elapsed time display -->
      <span class="text-[5rem] leading-none font-mono tabular-nums font-black tracking-tight text-foreground">
        {{ timer.formattedElapsed.value }}
      </span>

      <!-- Time Cap indicator inside circle -->
      <div v-if="block.config.timeCapSeconds" class="mt-2 text-base text-muted-foreground font-semibold">
        {{ t('timers.workout.fortime.cap') }}{{ Math.floor(block.config.timeCapSeconds / 60) }}:{{
          String(block.config.timeCapSeconds % 60).padStart(2, '0')
        }}
      </div>

      <!-- Current Exercise (inside circle) -->
      <div v-if="currentExercise" class="mt-2 text-center max-w-[220px]">
        <p class="text-lg font-bold text-foreground truncate">
          {{ currentExercise.name }}
        </p>
        <p class="text-base text-muted-foreground font-semibold">
          {{ currentExercise.prescribedReps }} {{ t('workouts.builder.timedCard.reps') }}
        </p>
      </div>
    </WorkoutCircularTimer>
  </div>
</template>
