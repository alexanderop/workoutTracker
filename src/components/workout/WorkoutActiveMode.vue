<script setup lang="ts">
import { MoreVertical, SkipForward, Square, X } from 'lucide-vue-next'
import { computed, watch } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBlockTimer } from '@/composables/useBlockTimer'
import { useRestTimer } from '@/composables/useRestTimer'
import { isSetReady, useWorkout } from '@/composables/useWorkout'
import { useWorkoutMode } from '@/composables/useWorkoutMode'
import { BLOCK_LABELS, isStrengthBlock, isTimedBlock } from '@/types/blocks'
import WorkoutActiveModeFooter from './WorkoutActiveModeFooter.vue'
import WorkoutActiveStrengthView from './WorkoutActiveStrengthView.vue'
import WorkoutActiveTimedView from './WorkoutActiveTimedView.vue'

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
const blockTimer = useBlockTimer({
  onComplete: handleBlockTimerComplete,
})

const isFirstBlock = computed(() => currentBlockIndex.value === 0)

const isStrength = computed(() => currentBlock.value && isStrengthBlock(currentBlock.value))
const isTimed = computed(() => currentBlock.value && isTimedBlock(currentBlock.value))

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

// Initialize block timer when switching to a timed block
watch(
  () => currentBlock.value,
  (block) => {
    if (block && isTimedBlock(block) && !block.result) {
      blockTimer.initializeBlock(block)
    }
  },
  { immediate: true },
)

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

function handleIncrementRound() {
  blockTimer.incrementRound()
}

function handleToggleTimer() {
  blockTimer.toggle()
}

function handleCompleteBlock() {
  if (!currentBlock.value || !isTimedBlock(currentBlock.value)) return

  const result = blockTimer.complete()
  if (result) {
    setBlockResult(currentBlockIndex.value, result)
  }

  if (isLastBlock.value) {
    emit('workout-complete')
    return
  }

  advanceToNextBlock()
}

function handleBlockTimerComplete() {
  handleCompleteBlock()
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

      <WorkoutActiveTimedView
        v-if="isTimed && isTimedBlock(currentBlock)"
        :block="currentBlock"
        :block-timer="blockTimer"
        @increment-round="handleIncrementRound"
      />
    </template>

    <!-- Footer with timer display and contextual actions -->
    <template v-if="currentBlock" #footer>
      <WorkoutActiveModeFooter
        :block="currentBlock"
        :is-timer-running="blockTimer.timerStatus.value.isRunning"
        :can-complete="canCompleteSet"
        :is-first-block="isFirstBlock"
        :is-last-block="isLastBlock"
        :block-timer="blockTimer"
        :rest-timer="restTimer"
        @prev-block="handlePrevBlock"
        @next-block="handleNextBlock"
        @complete-set="handleCompleteSet"
        @increment-round="handleIncrementRound"
        @toggle-timer="handleToggleTimer"
        @complete-block="handleCompleteBlock"
      />
    </template>
  </PageLayout>
</template>
