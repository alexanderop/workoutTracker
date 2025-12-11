<script setup lang="ts">
import { computed, ref } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { useBenchmarkGlobalTimer } from '@/composables/timers/useBenchmarkGlobalTimer'
import { useBenchmark } from '@/features/benchmarks/composables/useBenchmark'
import { useBenchmarkMode } from '@/features/benchmarks/composables/useBenchmarkMode'
import { useBenchmarkExerciseNavigation } from '@/features/benchmarks/composables/useBenchmarkExerciseNavigation'
import { useBenchmarkAnimation } from '@/features/benchmarks/composables/useBenchmarkAnimation'
import { useBenchmarkFirstAttempt } from '@/features/benchmarks/composables/useBenchmarkFirstAttempt'
import { useBenchmarkSplitComparison, type SplitComparison } from '@/features/benchmarks/composables/useBenchmarkSplitComparison'
import { createSplitTracker } from '@/lib/splitTracking'
import BenchmarkForTimeView from './BenchmarkForTimeView.vue'
import BenchmarkActiveModeHeaderActions from './BenchmarkActiveModeHeaderActions.vue'

const emit = defineEmits<{
  'end-workout': []
  'cancel-workout': []
  'workout-complete': []
  'open-queue': []
}>()

const { benchmarkWorkout: workout, currentBlock } = useBenchmark()
const { isActive, enterCompletionMode } = useBenchmarkMode()
const {
  advanceToNextExercise,
  currentExercisePosition,
  totalExerciseCount,
  globalExerciseIndex,
} = useBenchmarkExerciseNavigation()

// Timer and tracking
const benchmarkTimer = useBenchmarkGlobalTimer()
const animation = useBenchmarkAnimation()
const splitTracker = createSplitTracker()
const firstAttemptTracking = useBenchmarkFirstAttempt(() => workout.value.benchmarkId)
const splitComparison = useBenchmarkSplitComparison(() => workout.value.benchmarkId)

// Latest split comparison result
const latestSplitComparison = ref<SplitComparison | null>(null)

// Header content
const headerTitle = computed(() => workout.value.name || 'Benchmark')

// Start timer when entering active mode
if (isActive.value && !benchmarkTimer.isRunning.value) {
  benchmarkTimer.start()
}

function recordSplitTime() {
  const currentSplitTime = benchmarkTimer.getPreciseElapsedSeconds()
  splitTracker.recordSplit(currentSplitTime)

  // Calculate comparison to PB split if available
  const exerciseIndex = splitTracker.getSplits().length - 1
  const comparison = splitComparison.getComparison(exerciseIndex, currentSplitTime)
  latestSplitComparison.value = comparison
}

async function handleBenchmarkCompletion() {
  benchmarkTimer.pause()

  if (currentBlock.value?.kind === 'fortime') {
    const completionTime = benchmarkTimer.getPreciseElapsedSeconds()
    animation.showCompletion(completionTime)

    // Set result in current block
    if (currentBlock.value.result !== undefined) {
      currentBlock.value.result = {
        completionTime,
        completed: true,
        splitTimes: splitTracker.getSplits(),
      }
    }

    enterCompletionMode()
  }
}

async function handleNextExercise() {
  if (animation.state.value.isTransitioning) return

  recordSplitTime()
  await animation.playExerciseTransition()

  const result = advanceToNextExercise()

  if (result === 'completed') {
    await handleBenchmarkCompletion()
  }
}

function handleViewDetails() {
  emit('workout-complete')
}

function returnToBuilder() {
  emit('cancel-workout')
}
</script>

<template>
  <PageLayout
    :title="headerTitle"
    :scrollable="false"
    prevent-navigation
    @back="returnToBuilder"
  >
    <template #header-actions>
      <BenchmarkActiveModeHeaderActions
        @open-queue="emit('open-queue')"
        @end-workout="emit('end-workout')"
        @cancel-workout="emit('cancel-workout')"
      />
    </template>

    <!-- Main content - benchmark ForTime view with exercise progression -->
    <template v-if="currentBlock">
      <BenchmarkForTimeView
        v-if="currentBlock.kind === 'fortime'"
        :block="currentBlock"
        :progress="{
          current: currentExercisePosition,
          totalInRound: totalExerciseCount,
          globalIndex: globalExerciseIndex,
          totalCount: totalExerciseCount,
          isFirstAttempt: firstAttemptTracking.isFirstAttempt.value,
        }"
        :completion="animation.state.value.showCompletion ? {
          isComplete: true,
          time: animation.state.value.completionTime,
          benchmarkName: workout.name,
        } : undefined"
        :animation-state="animation.state.value"
        :split-comparison="latestSplitComparison"
        :elapsed-time="benchmarkTimer.formattedElapsed.value"
        @view-details="handleViewDetails"
        @tap-advance="handleNextExercise"
      />
    </template>
  </PageLayout>
</template>
