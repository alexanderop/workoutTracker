<script setup lang="ts">
import { computed, onScopeDispose, ref } from 'vue'
import PageLayout from '@/components/PageLayout.vue'
import { useBenchmarkGlobalTimer } from '@/composables/timers/useBenchmarkGlobalTimer'
import { useBenchmark } from '@/features/benchmarks/composables/useBenchmark'
import { useBenchmarkMode } from '@/features/benchmarks/composables/useBenchmarkMode'
import { useBenchmarkExerciseNavigation } from '@/features/benchmarks/composables/useBenchmarkExerciseNavigation'
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
  totalGlobalExerciseCount,
} = useBenchmarkExerciseNavigation()

// Timer and tracking
const benchmarkTimer = useBenchmarkGlobalTimer()
const splitTracker = createSplitTracker()
const splitComparison = useBenchmarkSplitComparison(() => workout.value.benchmarkId)

// ============================================
// Inline Animation State (Thiessen's Inline Composables pattern)
// Only used here, no need for separate file
// ============================================
const isTransitioning = ref(false)
const showCheckmark = ref(false)
const showCompletion = ref(false)
const completionTime = ref(0)

const timeoutIds = new Set<ReturnType<typeof setTimeout>>()
onScopeDispose(() => {
  for (const id of timeoutIds) clearTimeout(id)
  timeoutIds.clear()
})

const animationState = computed(() => ({
  isTransitioning: isTransitioning.value,
  showCheckmark: showCheckmark.value,
  showCompletion: showCompletion.value,
  completionTime: completionTime.value,
}))

function delay(ms: number): Promise<void> {
  return new Promise(resolve => {
    const id = setTimeout(() => {
      timeoutIds.delete(id)
      resolve()
    }, ms)
    timeoutIds.add(id)
  })
}

async function playExerciseTransition() {
  isTransitioning.value = true
  showCheckmark.value = true
  await delay(300)
  showCheckmark.value = false
  await delay(500)
  isTransitioning.value = false
}

function showCompletionScreen(time: number) {
  showCompletion.value = true
  completionTime.value = time
}
// ============================================

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
    const time = benchmarkTimer.getPreciseElapsedSeconds()
    showCompletionScreen(time)

    // Set result in current block
    if (currentBlock.value.result !== undefined) {
      currentBlock.value.result = {
        completionTime: time,
        completed: true,
        splitTimes: splitTracker.getSplits(),
      }
    }

    enterCompletionMode()
  }
}

async function handleNextExercise() {
  if (isTransitioning.value) return

  recordSplitTime()
  await playExerciseTransition()

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
          totalCount: totalGlobalExerciseCount,
          currentRound: workout.selectedBlockIndex + 1,
          totalRounds: workout.blocks.length,
          isFirstAttempt: splitComparison.isFirstAttempt.value,
        }"
        :completion="animationState.showCompletion ? {
          isComplete: true,
          time: animationState.completionTime,
          benchmarkName: workout.name,
        } : undefined"
        :animation-state="animationState"
        :split-comparison="latestSplitComparison"
        :elapsed-time="benchmarkTimer.formattedElapsed.value"
        @view-details="handleViewDetails"
        @tap-advance="handleNextExercise"
      />
    </template>
  </PageLayout>
</template>
