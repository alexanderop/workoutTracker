<script setup lang="ts">
import { ref, computed, useTemplateRef, watch } from 'vue'
import { Pause, Play, RotateCcw, X, Check, Save } from 'lucide-vue-next'
import { useI18n } from 'vue-i18n'
import { Button } from '@/components/ui/button'
import PageLayout from '@/components/PageLayout.vue'
import WorkoutAmrapView from '@/components/timers/WorkoutAmrapView.vue'
import WorkoutEmomView from '@/components/timers/WorkoutEmomView.vue'
import WorkoutTabataView from '@/components/timers/WorkoutTabataView.vue'
import WorkoutForTimeView from '@/components/timers/WorkoutForTimeView.vue'
import { BLOCK_COLORS } from '@/types/blocks'
import type {
  AmrapBlock,
  EmomBlock,
  TabataBlock,
  ForTimeBlock,
  AmrapResult,
  EmomResult,
  TabataResult,
  ForTimeResult,
} from '@/types/blocks'
import { useTimerWorkoutLogger } from '../composables/useTimerWorkoutLogger'

const { t } = useI18n()

type TimedBlock = AmrapBlock | EmomBlock | TabataBlock | ForTimeBlock
type TimedBlockResult = AmrapResult | EmomResult | TabataResult | ForTimeResult

type TimerViewExposed = {
  toggle: () => void
  reset: () => void
  complete: () => TimedBlockResult
  isRunning: { value: boolean }
  formattedTime: { value: string }
}

const { block } = defineProps<{
  block: TimedBlock
}>()

const emit = defineEmits<{
  exit: []
  complete: []
}>()

const timerRef = useTemplateRef<TimerViewExposed>('timer')
const isComplete = ref(false)
const isRunning = ref(false)

// Timer session tracking for workout logging
const startedAt = ref<number | null>(null)
const completedAt = ref<number | null>(null)
const timerResult = ref<TimedBlockResult | null>(null)

// Workout logger
const { isLogged, isSaving, logAmrap, logEmom, logTabata, logForTime, reset: resetLogger } =
  useTimerWorkoutLogger()

// Test-only flag to show complete button for integration testing
const isTestMode = import.meta.env.MODE === 'test'

const colors = computed(() => BLOCK_COLORS[block.kind])
const timerLabel = computed(() => t(`timers.types.${block.kind}`))

// Track when timer starts running
watch(isRunning, (running, wasRunning) => {
  if (running && !wasRunning && startedAt.value === null) {
    startedAt.value = Date.now()
  }
})

function handleToggle() {
  timerRef.value?.toggle()
}

function handleReset() {
  isComplete.value = false
  isRunning.value = false
  startedAt.value = null
  completedAt.value = null
  timerResult.value = null
  resetLogger()
  timerRef.value?.reset()
}

function handleComplete() {
  // If timer was never started (test mode), set startedAt now
  if (startedAt.value === null) {
    startedAt.value = Date.now()
  }

  // Capture the result from the timer
  const result = timerRef.value?.complete()
  if (result) {
    timerResult.value = result
    completedAt.value = Date.now()
  }

  isComplete.value = true
  isRunning.value = false
  emit('complete')
}

function handleExit() {
  emit('exit')
}

function handleRunningChange(value: boolean) {
  isRunning.value = value
}

// Type guards for result types
function isAmrapResult(result: TimedBlockResult): result is AmrapResult {
  return 'rounds' in result && 'partialReps' in result
}

function isEmomResult(result: TimedBlockResult): result is EmomResult {
  return 'completedMinutes' in result && 'missedMinutes' in result
}

function isTabataResult(result: TimedBlockResult): result is TabataResult {
  return 'repsPerRound' in result
}

function isForTimeResult(result: TimedBlockResult): result is ForTimeResult {
  return 'completionTime' in result && 'completed' in result
}

async function handleLogWorkout() {
  if (!timerResult.value || !startedAt.value || !completedAt.value) {
    return
  }

  const result = timerResult.value
  const start = startedAt.value
  const end = completedAt.value

  // Call type-specific log function based on block kind and result type
  if (block.kind === 'amrap' && isAmrapResult(result)) {
    await logAmrap(block, result, start, end)
    return
  }

  if (block.kind === 'emom' && isEmomResult(result)) {
    await logEmom(block, result, start, end)
    return
  }

  if (block.kind === 'tabata' && isTabataResult(result)) {
    await logTabata(block, result, start, end)
    return
  }

  if (block.kind === 'fortime' && isForTimeResult(result)) {
    await logForTime(block, result, start, end)
  }
}
</script>

<template>
  <PageLayout :title="timerLabel" prevent-navigation @back="handleExit">
    <!-- Timer Content -->
    <div class="h-full flex flex-col">
      <WorkoutAmrapView
        v-if="block.kind === 'amrap'"
        ref="timer"
        :block="block"
        :on-complete="handleComplete"
        @update:is-running="handleRunningChange"
      />
      <WorkoutEmomView
        v-if="block.kind === 'emom'"
        ref="timer"
        :block="block"
        :on-complete="handleComplete"
        @update:is-running="handleRunningChange"
      />
      <WorkoutTabataView
        v-if="block.kind === 'tabata'"
        ref="timer"
        :block="block"
        :on-complete="handleComplete"
        @update:is-running="handleRunningChange"
      />
      <WorkoutForTimeView
        v-if="block.kind === 'fortime'"
        ref="timer"
        :block="block"
        :on-complete="handleComplete"
        @update:is-running="handleRunningChange"
      />
    </div>

    <template #footer>
      <div v-if="!isComplete" class="flex items-center justify-center gap-4 py-4 safe-area-bottom">
        <Button
          variant="outline"
          size="icon"
          class="size-touch"
          :aria-label="t('common.aria.exitTimer')"
          @click="handleExit"
        >
          <X class="w-5 h-5" />
        </Button>

        <Button
          size="lg"
          class="h-14 w-14 rounded-full"
          :class="colors.accent"
          :aria-label="isRunning ? t('common.aria.pauseTimer') : t('common.aria.playTimer')"
          @click="handleToggle"
        >
          <Pause v-if="isRunning" class="w-6 h-6" />
          <Play v-if="!isRunning" class="w-6 h-6 ml-0.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          class="size-touch"
          :aria-label="t('common.aria.resetTimer')"
          @click="handleReset"
        >
          <RotateCcw class="w-5 h-5" />
        </Button>

        <!-- Test-only button to trigger completion for integration tests -->
        <!-- eslint-disable @intlify/vue-i18n/no-raw-text -->
        <button
          v-if="isTestMode"
          data-testid="complete-timer-test"
          class="text-xs px-1 py-0.5 bg-gray-200 rounded"
          @click="handleComplete"
        >
          Complete
        </button>
        <!-- eslint-enable @intlify/vue-i18n/no-raw-text -->
      </div>

      <!-- Completion state -->
      <div v-if="isComplete" class="text-center space-y-4 py-4 safe-area-bottom">
        <div class="text-2xl font-bold" :class="colors.text">{{ t('timers.runner.complete') }}</div>

        <!-- Log Workout button -->
        <Button
          :disabled="isLogged || isSaving"
          :class="isLogged ? 'bg-green-600 hover:bg-green-600' : ''"
          @click="handleLogWorkout"
        >
          <Check v-if="isLogged" class="w-4 h-4 mr-2" />
          <Save v-else class="w-4 h-4 mr-2" />
          {{ isLogged ? t('timers.runner.logged') : t('timers.runner.logWorkout') }}
        </Button>

        <div class="flex gap-3 justify-center">
          <Button variant="outline" @click="handleReset">
            <RotateCcw class="w-4 h-4 mr-2" />
            {{ t('timers.runner.again') }}
          </Button>
          <Button variant="outline" @click="handleExit">{{ t('timers.runner.done') }}</Button>
        </div>
      </div>
    </template>
  </PageLayout>
</template>
