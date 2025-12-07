<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { useRestTimer } from '@/composables/timers/useRestTimer'
import type { useBenchmarkGlobalTimer } from '@/composables/timers/useBenchmarkGlobalTimer'
import { isSetReady, useWorkout } from '@/features/workout/composables/useWorkout'
import { useWorkoutMode } from '@/features/workout/composables/useWorkoutMode'
import type { AmrapResult, EmomResult, ForTimeResult, TabataResult } from '@/types/blocks'
import { BLOCK_LABELS, getBlockExerciseList, isStrengthBlock, isTimedBlock } from '@/types/blocks'
import WorkoutActiveModeFooter, { type TimerDisplayData } from './WorkoutActiveModeFooter.vue'
import WorkoutActiveStrengthView from './WorkoutActiveStrengthView.vue'
import WorkoutAmrapView from '@/components/timers/WorkoutAmrapView.vue'
import WorkoutEmomView from '@/components/timers/WorkoutEmomView.vue'
import WorkoutForTimeView from '@/components/timers/WorkoutForTimeView.vue'
import WorkoutTabataView from '@/components/timers/WorkoutTabataView.vue'
import WorkoutActiveModeHeaderActions from './WorkoutActiveModeHeaderActions.vue'
import BenchmarkForTimeView from './BenchmarkForTimeView.vue'

type TimedBlockResult = AmrapResult | EmomResult | TabataResult | ForTimeResult

const {
  isBenchmarkMode = false,
  benchmarkTimer,
} = defineProps<{
  isBenchmarkMode?: boolean
  benchmarkTimer?: ReturnType<typeof useBenchmarkGlobalTimer>
}>()

const emit = defineEmits<{
  'end-workout': []
  'cancel-workout': []
  'workout-complete': []
  'open-queue': []
}>()

const {
  workout,
  completeSet,
  setBlockResult,
  updateSetValue,
  advanceToNextExercise,
  currentExercisePosition,
  totalExerciseCount,
  globalExerciseIndex,
} = useWorkout()
const {
  currentBlock,
  currentBlockIndex,
  totalBlocks,
  isLastBlock,
  activeSet,
  returnToBuilder,
  advanceToNextBlock,
  goToPreviousBlock,
} = useWorkoutMode()

const restTimer = useRestTimer()

// Template ref for timed view components - they expose timer methods
const timedViewRef = useTemplateRef<{
  complete: () => unknown
  toggle: () => void
  reset: () => void
  isRunning: { value: boolean }
  formattedTime: { value: string }
  timerLabel: string
}>('timedView')

const isFirstBlock = computed(() => currentBlockIndex.value === 0)

const isStrength = computed(() => currentBlock.value && isStrengthBlock(currentBlock.value))

// Timer running state - updated via emit from timer views
const timerIsRunning = ref(false)

function handleTimerRunningChange(isRunning: boolean) {
  timerIsRunning.value = isRunning
}

// Grouped timer data from timed view for footer
const timerDisplayData = computed<TimerDisplayData | undefined>(() => {
  if (!timedViewRef.value) return undefined
  return {
    isRunning: timerIsRunning.value,
    display: timedViewRef.value.formattedTime.value,
    label: timedViewRef.value.timerLabel,
  }
})

// Header content
const headerTitle = computed(() => {
  if (!currentBlock.value) return 'Workout'

  // Benchmark mode: show benchmark name
  if (isBenchmarkMode) {
    return workout.value.name
  }

  // Regular mode: show block type
  return BLOCK_LABELS[currentBlock.value.kind]
})

const headerSubtitle = computed(() => {
  // Benchmark mode: show timer
  if (isBenchmarkMode && benchmarkTimer) {
    return `⏱ ${benchmarkTimer.formattedElapsed.value}`
  }

  // Regular mode: show block counter
  return `Block ${currentBlockIndex.value + 1} of ${totalBlocks.value}`
})

const canSkipBlock = computed(() => currentBlockIndex.value < totalBlocks.value - 1)

const canCompleteSet = computed(() => {
  if (!activeSet.value) return false
  return isSetReady(activeSet.value)
})

const isLastExercise = computed(() => {
  if (!isBenchmarkMode || !currentBlock.value || !isTimedBlock(currentBlock.value))
    return false

  const exerciseIndex = workout.value.activeExerciseIndex ?? 0
  const exerciseCount = getBlockExerciseList(currentBlock.value).length

  return exerciseIndex === exerciseCount - 1 && isLastBlock.value
})

function handleCompleteSet() {
  if (!activeSet.value) return

  const result = completeSet(activeSet.value)

  if (result.kind !== 'completed') return

  if (result.nextAction === 'workout-complete') {
    emit('workout-complete')
    return
  }

  restTimer.start()
}

function handleToggleTimer() {
  timedViewRef.value?.toggle()
}

function handleCompleteBlock() {
  if (!currentBlock.value || !isTimedBlock(currentBlock.value)) return

  // @ts-expect-error - template ref returns unknown but runtime type is TimedBlockResult
  const result: TimedBlockResult | undefined = timedViewRef.value?.complete()
  if (result) {
    setBlockResult(currentBlockIndex.value, result)
  }

  if (isLastBlock.value) {
    emit('workout-complete')
    return
  }

  advanceToNextBlock()
}

function handlePrevBlock() {
  goToPreviousBlock()
}

function handleNextBlock() {
  advanceToNextBlock()
}

function handleSkipBlock() {
  advanceToNextBlock()
}

function handleUpdateSet(setId: number, field: 'kg' | 'reps' | 'rir', value: number | undefined) {
  updateSetValue(setId, field, value)
}

function handleNextExercise() {
  const result = advanceToNextExercise()

  if (result === 'workout-complete') {
    emit('workout-complete')
  }
}

// Start timer when entering active mode (for benchmarks)
watch(
  () => workout.value.mode,
  (newMode) => {
    if (newMode === 'active' && isBenchmarkMode && benchmarkTimer && !benchmarkTimer.isRunning.value) {
      benchmarkTimer.start()
    }
  },
  { immediate: true },
)
</script>

<template>
  <PageLayout
    :title="headerTitle"
    :subtitle="headerSubtitle"
    :scrollable="false"
    prevent-navigation
    @back="returnToBuilder"
  >
    <template #header-actions>
      <WorkoutActiveModeHeaderActions
        :can-skip-block="canSkipBlock"
        @skip-block="handleSkipBlock"
        @open-queue="emit('open-queue')"
        @end-workout="emit('end-workout')"
        @cancel-workout="emit('cancel-workout')"
      />
    </template>

    <!-- Main content - switches between strength and timed views -->
    <template v-if="currentBlock">
      <WorkoutActiveStrengthView
        v-if="isStrength && isStrengthBlock(currentBlock)"
        :block="currentBlock"
        :active-set-index="workout.activeSetIndex ?? 0"
        @update-set="handleUpdateSet"
      />

      <!-- Timed block views - each manages its own timer internally -->
      <WorkoutAmrapView
        v-if="currentBlock.kind === 'amrap'"
        ref="timedView"
        :block="currentBlock"
        :on-complete="handleCompleteBlock"
        @update:is-running="handleTimerRunningChange"
      />
      <WorkoutEmomView
        v-else-if="currentBlock.kind === 'emom'"
        ref="timedView"
        :block="currentBlock"
        :on-complete="handleCompleteBlock"
        @update:is-running="handleTimerRunningChange"
      />
      <WorkoutTabataView
        v-else-if="currentBlock.kind === 'tabata'"
        ref="timedView"
        :block="currentBlock"
        :on-complete="handleCompleteBlock"
        @update:is-running="handleTimerRunningChange"
      />
      <!-- Regular ForTime (non-benchmark) -->
      <WorkoutForTimeView
        v-else-if="currentBlock.kind === 'fortime' && !isBenchmarkMode"
        ref="timedView"
        :block="currentBlock"
        :on-complete="handleCompleteBlock"
        @update:is-running="handleTimerRunningChange"
      />

      <!-- Benchmark ForTime (with exercise progression) -->
      <BenchmarkForTimeView
        v-else-if="currentBlock.kind === 'fortime' && isBenchmarkMode"
        :block="currentBlock"
        :exercise-number="currentExercisePosition?.current ?? 1"
        :total-exercises-in-round="currentExercisePosition?.total ?? 1"
        :global-exercise-index="globalExerciseIndex ?? 0"
        :total-exercises="totalExerciseCount ?? 1"
      />
    </template>

    <!-- Footer with timer display and contextual actions -->
    <template v-if="currentBlock" #footer>
      <WorkoutActiveModeFooter
        :block="currentBlock"
        :timer="timerDisplayData"
        :rest-timer="restTimer"
        :state="{
          canComplete: canCompleteSet,
          isFirstBlock,
          isLastBlock,
          isBenchmarkMode,
          isLastExercise,
        }"
        @prev-block="handlePrevBlock"
        @next-block="handleNextBlock"
        @complete-set="handleCompleteSet"
        @toggle-timer="handleToggleTimer"
        @complete-block="handleCompleteBlock"
        @next-exercise="handleNextExercise"
      />
    </template>
  </PageLayout>
</template>
