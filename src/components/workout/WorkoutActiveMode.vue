<script setup lang="ts">
import { MoreVertical, SkipForward, Square, X } from 'lucide-vue-next'
import { computed, useTemplateRef } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useRestTimer } from '@/composables/useRestTimer'
import { isSetReady, useWorkout } from '@/composables/useWorkout'
import { useWorkoutMode } from '@/composables/useWorkoutMode'
import type { AmrapResult, EmomResult, ForTimeResult, TabataResult } from '@/types/blocks'
import { BLOCK_LABELS, isStrengthBlock, isTimedBlock } from '@/types/blocks'
import WorkoutActiveModeFooter, { type TimerDisplayData } from './WorkoutActiveModeFooter.vue'
import WorkoutActiveStrengthView from './WorkoutActiveStrengthView.vue'
import WorkoutAmrapView from './WorkoutAmrapView.vue'
import WorkoutEmomView from './WorkoutEmomView.vue'
import WorkoutForTimeView from './WorkoutForTimeView.vue'

import WorkoutTabataView from './WorkoutTabataView.vue'

type TimedBlockResult = AmrapResult | EmomResult | TabataResult | ForTimeResult

const emit = defineEmits<{
  'end-workout': []
  'cancel-workout': []
  'workout-complete': []
}>()

const { workout, completeSet, setBlockResult, updateSetValue } = useWorkout()
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

// Grouped timer data from timed view for footer
const timerDisplayData = computed<TimerDisplayData | undefined>(() => {
  if (!timedViewRef.value) return undefined
  return {
    isRunning: timedViewRef.value.isRunning.value,
    display: timedViewRef.value.formattedTime.value,
    label: timedViewRef.value.timerLabel,
  }
})

// Header content
const headerTitle = computed(() => {
  if (!currentBlock.value) return 'Workout'
  return BLOCK_LABELS[currentBlock.value.kind]
})

const headerSubtitle = computed(() => {
  return `Block ${currentBlockIndex.value + 1} of ${totalBlocks.value}`
})

const canSkipBlock = computed(() => currentBlockIndex.value < totalBlocks.value - 1)

const canCompleteSet = computed(() => {
  if (!activeSet.value) return false
  return isSetReady(activeSet.value)
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
</script>

<template>
  <PageLayout
    :title="headerTitle"
    :subtitle="headerSubtitle"
    :scrollable="false"
    prevent-navigation
    @back="returnToBuilder"
  >
    <!-- Header actions (dropdown menu) -->
    <template #header-actions>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" class="flex-shrink-0">
            <MoreVertical class="size-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" class="w-48">
          <DropdownMenuItem v-if="canSkipBlock" @click="handleSkipBlock">
            <SkipForward class="size-4 mr-2" />
            Skip Block
          </DropdownMenuItem>
          <DropdownMenuSeparator v-if="canSkipBlock" />
          <DropdownMenuItem @click="emit('end-workout')">
            <Square class="size-4 mr-2" />
            End Workout
          </DropdownMenuItem>
          <DropdownMenuItem class="text-destructive" @click="emit('cancel-workout')">
            <X class="size-4 mr-2" />
            Cancel Workout
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
      />
      <WorkoutEmomView
        v-else-if="currentBlock.kind === 'emom'"
        ref="timedView"
        :block="currentBlock"
        :on-complete="handleCompleteBlock"
      />
      <WorkoutTabataView
        v-else-if="currentBlock.kind === 'tabata'"
        ref="timedView"
        :block="currentBlock"
        :on-complete="handleCompleteBlock"
      />
      <WorkoutForTimeView
        v-else-if="currentBlock.kind === 'fortime'"
        ref="timedView"
        :block="currentBlock"
        :on-complete="handleCompleteBlock"
      />
    </template>

    <!-- Footer with timer display and contextual actions -->
    <template v-if="currentBlock" #footer>
      <WorkoutActiveModeFooter
        :block="currentBlock"
        :timer="timerDisplayData"
        :can-complete="canCompleteSet"
        :is-first-block="isFirstBlock"
        :is-last-block="isLastBlock"
        :rest-timer="restTimer"
        @prev-block="handlePrevBlock"
        @next-block="handleNextBlock"
        @complete-set="handleCompleteSet"
        @toggle-timer="handleToggleTimer"
        @complete-block="handleCompleteBlock"
      />
    </template>
  </PageLayout>
</template>
