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
  goToPreviousExercise,
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
const headerSubtitle = computed(() => `⏱ ${benchmarkTimer.formattedElapsed.value}`)

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

function handlePreviousExercise() {
  // No animation - instant transition for correction action
  goToPreviousExercise()
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
    :subtitle="headerSubtitle"
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
        }"
        :completion="animation.state.value.showCompletion ? {
          isComplete: true,
          time: animation.state.value.completionTime,
          benchmarkName: workout.name,
        } : undefined"
        :animation-state="animation.state.value"
        :is-first-attempt="firstAttemptTracking.isFirstAttempt.value"
        :split-comparison="latestSplitComparison"
        @view-details="handleViewDetails"
      />
    </template>

    <!-- Footer with benchmark-specific actions -->
    <template v-if="currentBlock && !animation.state.value.showCompletion" #footer>
      <div class="p-4 border-t bg-background">
        <div class="flex gap-2">
          <!-- Back button (disabled if first exercise) -->
          <button
            class="flex-1 px-4 py-3 rounded-lg border border-border bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-muted"
            :disabled="globalExerciseIndex === 0 || animation.state.value.isTransitioning"
            @click="handlePreviousExercise"
          >
            {{ $t('common.aria.goBack') }}
          </button>

          <!-- Done button (advances to next exercise or completes) -->
          <button
            class="flex-1 px-4 py-3 rounded-lg bg-primary text-primary-foreground font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors hover:bg-primary/90"
            :disabled="animation.state.value.isTransitioning"
            @click="handleNextExercise"
          >
            {{ globalExerciseIndex === totalExerciseCount - 1 ? $t('common.buttons.finish') : $t('common.buttons.done') }}
          </button>
        </div>
      </div>
    </template>
  </PageLayout>
</template>
