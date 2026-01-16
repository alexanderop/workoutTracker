<script setup lang="ts">
import { AlertTriangle } from 'lucide-vue-next'
import { computed, ref, useTemplateRef, type Component } from 'vue'
import { useI18n } from 'vue-i18n'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import { useRestTimer } from '@/composables/timers/useRestTimer'
import { isSetReady, useWorkout } from '@/features/workout/composables/useWorkout'
import { useWorkoutMode } from '@/features/workout/composables/useWorkoutMode'
import { BLOCK_LABELS, isStrengthBlock, isTimedBlock, isTimedBlockResult } from '@/types/blocks'
import type { Set } from '@/types/workout'
import WorkoutActiveModeFooter, { type TimerDisplayData } from './WorkoutActiveModeFooter.vue'
import WorkoutActiveStrengthView from './WorkoutActiveStrengthView.vue'
import WorkoutAmrapView from '@/components/timers/WorkoutAmrapView.vue'
import WorkoutEmomView from '@/components/timers/WorkoutEmomView.vue'
import WorkoutForTimeView from '@/components/timers/WorkoutForTimeView.vue'
import WorkoutTabataView from '@/components/timers/WorkoutTabataView.vue'
import WorkoutActiveModeHeaderActions from './WorkoutActiveModeHeaderActions.vue'

// Strategy pattern: Map block kinds to their view components
const TIMED_VIEW_COMPONENTS: Record<string, Component> = {
  amrap: WorkoutAmrapView,
  emom: WorkoutEmomView,
  tabata: WorkoutTabataView,
  fortime: WorkoutForTimeView,
}

const { t } = useI18n()

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
  addSet,
  removeSet,
  duplicateSet,
  removeBlock,
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
const timedViewReference = useTemplateRef<{
  complete: () => unknown
  toggle: () => void
  reset: () => void
  isRunning: { value: boolean }
  formattedTime: { value: string }
  timerLabel: string
}>('timedView')

const isFirstBlock = computed(() => currentBlockIndex.value === 0)

const isStrength = computed(() => currentBlock.value && isStrengthBlock(currentBlock.value))

// Get the appropriate timed view component for current block
const timedViewComponent = computed(() => {
  if (!currentBlock.value) return null
  return TIMED_VIEW_COMPONENTS[currentBlock.value.kind] ?? null
})

// Timer running state - updated via emit from timer views
const timerIsRunning = ref(false)

function handleTimerRunningChange(isRunning: boolean) {
  timerIsRunning.value = isRunning
}

// Grouped timer data from timed view for footer
const timerDisplayData = computed<TimerDisplayData | undefined>(() => {
  if (!timedViewReference.value) return
  return {
    isRunning: timerIsRunning.value,
    display: timedViewReference.value.formattedTime.value,
    label: timedViewReference.value.timerLabel,
  }
})

// Header content
const headerTitle = computed(() => {
  if (!currentBlock.value) return 'Workout'
  return BLOCK_LABELS[currentBlock.value.kind]
})

const headerSubtitle = computed(() => {
  if (!currentBlock.value) return ''
  return `Block ${currentBlockIndex.value + 1} of ${totalBlocks.value}`
})

const canSkipBlock = computed(() => currentBlockIndex.value < totalBlocks.value - 1)

const canCompleteSet = computed(() => {
  if (!activeSet.value) return false
  return isSetReady(activeSet.value)
})

const footerState = computed(() => ({
  canComplete: canCompleteSet.value,
  isFirstBlock: isFirstBlock.value,
  isLastBlock: isLastBlock.value,
  isTransitioning: false,
}))

function handleSetCompletion(result: ReturnType<typeof completeSet>) {
  if (result.kind !== 'completed') return

  if (result.nextAction === 'workout-complete') {
    emit('workout-complete')
    return
  }

  restTimer.start()
}

function handleCompleteSet() {
  if (!activeSet.value) return
  handleSetCompletion(completeSet(activeSet.value))
}

function handleToggleTimer() {
  timedViewReference.value?.toggle()
}

function handleCompleteBlock() {
  if (!currentBlock.value) return

  // Handle timed blocks (AMRAP, EMOM, Tabata, ForTime) - capture result from timer
  if (isTimedBlock(currentBlock.value)) {
    const result = timedViewReference.value?.complete()
    if (isTimedBlockResult(result)) {
      setBlockResult(currentBlockIndex.value, result)
    }
  }

  // Cardio blocks don't have a timer to complete, just advance
  // (Cardio result tracking would be added separately if needed)

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

function handleRemoveBlock() {
  removeBlock(currentBlockIndex.value)
  // If no blocks remain, return to builder mode
  if (workout.value.blocks.length === 0) {
    returnToBuilder()
  }
}

function handleUpdateSet(setId: number, field: 'kg' | 'reps' | 'duration' | 'rir', value: number | undefined) {
  updateSetValue(setId, field, value)
}

function handleToggleComplete(set: Set) {
  handleSetCompletion(completeSet(set))
}

function handleAddSet() {
  addSet(currentBlockIndex.value)
}

function handleDeleteSet(setId: number) {
  removeSet(currentBlockIndex.value, setId)
}

function handleDuplicateSet(setId: number) {
  duplicateSet(currentBlockIndex.value, setId)
}
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
        @remove-block="handleRemoveBlock"
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
        @toggle-complete="handleToggleComplete"
        @add-set="handleAddSet"
        @delete-set="handleDeleteSet"
        @duplicate-set="handleDuplicateSet"
      />

      <!-- Timed block views - dynamically rendered based on block kind -->
      <component
        :is="timedViewComponent"
        v-if="timedViewComponent"
        ref="timedView"
        :block="currentBlock"
        :on-complete="handleCompleteBlock"
        @update:is-running="handleTimerRunningChange"
      />
    </template>

    <!-- Fallback state when currentBlock is null (corrupted state recovery) -->
    <div v-else class="flex flex-col items-center justify-center h-full gap-4 p-6 text-center">
      <div class="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
        <AlertTriangle class="w-8 h-8 text-destructive" aria-hidden="true" />
      </div>
      <div class="space-y-2">
        <h2 class="text-lg font-semibold">{{ t('workouts.active.errorNoBlock') }}</h2>
        <p class="text-muted-foreground text-sm">{{ t('workouts.active.errorNoBlockDescription') }}</p>
      </div>
      <Button variant="outline" @click="returnToBuilder">
        {{ t('workouts.active.returnToBuilder') }}
      </Button>
    </div>

    <!-- Footer with timer display and contextual actions -->
    <template v-if="currentBlock" #footer>
      <WorkoutActiveModeFooter
        :block="currentBlock"
        :timer="timerDisplayData"
        :rest-timer="restTimer"
        :state="footerState"
        @prev-block="handlePrevBlock"
        @next-block="handleNextBlock"
        @complete-set="handleCompleteSet"
        @toggle-timer="handleToggleTimer"
        @complete-block="handleCompleteBlock"
      />
    </template>
  </PageLayout>
</template>
