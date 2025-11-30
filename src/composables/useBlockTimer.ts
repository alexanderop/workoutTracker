/**
 * Unified timer composable for timed workout blocks.
 *
 * Provides a single API that internally dispatches to the appropriate
 * specialized timer (AMRAP, EMOM, Tabata, For Time).
 */

import type { ComputedRef } from 'vue'
import { computed, ref, shallowRef } from 'vue'

import type {
  ActiveBlockState,
  AmrapResult,
  BlockTimerState,
  EmomResult,
  ForTimeResult,
  TabataResult,
  TimedBlock,
} from '@/types/blocks'
import { useAmrapTimer } from '@/composables/timers/useAmrapTimer'
import { useEmomTimer } from '@/composables/timers/useEmomTimer'
import { useForTimeTimer } from '@/composables/timers/useForTimeTimer'
import { useTabataTimer } from '@/composables/timers/useTabataTimer'

// --- Types ---

type BlockTimerConfig = Readonly<{
  onMinuteChange?: (minute: number) => void
  onPhaseChange?: (phase: 'work' | 'rest') => void
  onRoundChange?: (round: number) => void
  onComplete?: () => void
}>

type TimerInstance =
  | ReturnType<typeof useAmrapTimer>
  | ReturnType<typeof useEmomTimer>
  | ReturnType<typeof useTabataTimer>
  | ReturnType<typeof useForTimeTimer>

type TimerResult = AmrapResult | EmomResult | TabataResult | ForTimeResult

type TimerValues = Readonly<{
  elapsedMs: number
  elapsedSeconds: number
  remainingSeconds: number
  progress: number
  formattedElapsed: string
  formattedRemaining: string
}>

type TimerStatus = Readonly<{
  isRunning: boolean
  isPaused: boolean
  isCompleted: boolean
  isIdle: boolean
}>

type BlockSpecificValues = Readonly<{
  currentMinute: number
  secondsRemainingInMinute: number
  currentRound: number
  currentPhase: 'work' | 'rest'
  secondsInCurrentPhase: number
  roundsCompleted: number
}>

// --- Pure Helper Functions (Functional Core) ---

function buildTimerState(timer: TimerInstance | null): BlockTimerState {
  if (!timer) return { status: 'idle' }
  if (timer.isCompleted.value) return { status: 'completed', startedAt: 0, completedAt: 0 }
  if (timer.isPaused.value) return { status: 'paused', startedAt: 0, pausedAt: 0 }
  if (timer.isRunning.value) return { status: 'running', startedAt: 0, pausedAt: null }
  return { status: 'idle' }
}

function extractTimerValues(timer: TimerInstance | null): TimerValues {
  return {
    elapsedMs: timer?.elapsedMs.value ?? 0,
    elapsedSeconds: timer?.elapsedSeconds.value ?? 0,
    remainingSeconds: timer?.remainingSeconds.value ?? 0,
    progress: timer?.progress.value ?? 0,
    formattedElapsed: timer?.formattedElapsed.value ?? '0:00',
    formattedRemaining: timer?.formattedRemaining.value ?? '0:00',
  }
}

function extractTimerStatus(timer: TimerInstance | null): TimerStatus {
  return {
    isRunning: timer?.isRunning.value ?? false,
    isPaused: timer?.isPaused.value ?? false,
    isCompleted: timer?.isCompleted.value ?? false,
    isIdle: timer?.isIdle.value ?? true,
  }
}

// --- Composable ---

export function useBlockTimer(config: BlockTimerConfig = {}) {
  // 1. Initializing - timer instances (lazy-initialized)
  let amrapTimer: ReturnType<typeof useAmrapTimer> | null = null
  let emomTimer: ReturnType<typeof useEmomTimer> | null = null
  let tabataTimer: ReturnType<typeof useTabataTimer> | null = null
  let forTimeTimer: ReturnType<typeof useForTimeTimer> | null = null

  function getOrCreateAmrapTimer() {
    if (!amrapTimer) {
      amrapTimer = useAmrapTimer({ onComplete: config.onComplete })
    }
    return amrapTimer
  }

  function getOrCreateEmomTimer() {
    if (!emomTimer) {
      emomTimer = useEmomTimer({
        onMinuteChange: config.onMinuteChange,
        onComplete: config.onComplete,
      })
    }
    return emomTimer
  }

  function getOrCreateTabataTimer() {
    if (!tabataTimer) {
      tabataTimer = useTabataTimer({
        onPhaseChange: config.onPhaseChange,
        onRoundChange: config.onRoundChange,
        onComplete: config.onComplete,
      })
    }
    return tabataTimer
  }

  function getOrCreateForTimeTimer() {
    if (!forTimeTimer) {
      forTimeTimer = useForTimeTimer({ onComplete: config.onComplete })
    }
    return forTimeTimer
  }

  // 2. Primary State
  const activeBlockKind = shallowRef<TimedBlock['kind'] | null>(null)

  // 3. State Metadata - error handling
  const error = ref<Error | null>(null)

  // 4. Computed - derived state

  const currentTimer = computed((): TimerInstance | null => {
    switch (activeBlockKind.value) {
      case 'amrap':
        return amrapTimer
      case 'emom':
        return emomTimer
      case 'tabata':
        return tabataTimer
      case 'fortime':
        return forTimeTimer
      default:
        return null
    }
  })

  const activeBlock = computed(() => currentTimer.value?.block.value ?? null)

  // Grouped timer values
  const timerValues: ComputedRef<TimerValues> = computed(() =>
    extractTimerValues(currentTimer.value),
  )

  // Grouped timer status
  const timerStatus: ComputedRef<TimerStatus> = computed(() =>
    extractTimerStatus(currentTimer.value),
  )

  // Block-specific computed values grouped
  const blockSpecificValues: ComputedRef<BlockSpecificValues> = computed(() => ({
    currentMinute: activeBlockKind.value === 'emom' ? (emomTimer?.currentMinute.value ?? 0) : 0,
    secondsRemainingInMinute:
      activeBlockKind.value === 'emom' ? (emomTimer?.secondsRemainingInMinute.value ?? 0) : 0,
    currentRound: activeBlockKind.value === 'tabata' ? (tabataTimer?.currentRound.value ?? 0) : 0,
    currentPhase:
      activeBlockKind.value === 'tabata' ? (tabataTimer?.currentPhase.value ?? 'work') : 'work',
    secondsInCurrentPhase:
      activeBlockKind.value === 'tabata' ? (tabataTimer?.secondsInCurrentPhase.value ?? 0) : 0,
    roundsCompleted: activeBlockKind.value === 'amrap' ? (amrapTimer?.rounds.value ?? 0) : 0,
  }))

  const blockState = computed((): ActiveBlockState | null => {
    if (!currentTimer.value) return null

    const timerState = buildTimerState(currentTimer.value)

    switch (activeBlockKind.value) {
      case 'amrap':
        return {
          kind: 'amrap',
          state: {
            timerState,
            rounds: amrapTimer?.rounds.value ?? 0,
            currentExerciseIndex: amrapTimer?.currentExerciseIndex.value ?? 0,
          },
        }
      case 'emom':
        return {
          kind: 'emom',
          state: {
            timerState,
            currentMinute: emomTimer?.currentMinute.value ?? 0,
            currentExerciseIndex: emomTimer?.currentExerciseIndex.value ?? 0,
            missedMinutes: emomTimer?.missedMinutes.value ?? [],
          },
        }
      case 'tabata':
        return {
          kind: 'tabata',
          state: {
            timerState,
            currentRound: tabataTimer?.currentRound.value ?? 0,
            phase: tabataTimer?.currentPhase.value ?? 'work',
            repsPerRound: tabataTimer?.repsPerRound.value ?? [],
          },
        }
      case 'fortime':
        return {
          kind: 'fortime',
          state: {
            timerState,
            completedExercises: forTimeTimer?.completedExercises.value ?? [],
          },
        }
      default:
        return null
    }
  })

  // 5. Methods

  function clearError() {
    error.value = null
  }

  function initializeBlock(block: TimedBlock) {
    clearError()
    activeBlockKind.value = block.kind

    // Discriminated union narrows type automatically via block.kind
    switch (block.kind) {
      case 'amrap':
        getOrCreateAmrapTimer().initialize(block)
        break
      case 'emom':
        getOrCreateEmomTimer().initialize(block)
        break
      case 'tabata':
        getOrCreateTabataTimer().initialize(block)
        break
      case 'fortime':
        getOrCreateForTimeTimer().initialize(block)
        break
    }
  }

  function start() {
    currentTimer.value?.start()
  }

  function pause() {
    currentTimer.value?.pause()
  }

  function toggle() {
    currentTimer.value?.toggle()
  }

  function reset() {
    clearError()
    currentTimer.value?.reset()
  }

  function complete(): TimerResult | null {
    return currentTimer.value?.complete() ?? null
  }

  // Block-specific methods with error state instead of throwing
  function incrementRound(): boolean {
    if (activeBlockKind.value !== 'amrap') {
      error.value = new Error('incrementRound() can only be called for AMRAP blocks')
      return false
    }
    amrapTimer?.incrementRound()
    return true
  }

  function markMinuteMissed(minute: number): boolean {
    if (activeBlockKind.value !== 'emom') {
      error.value = new Error('markMinuteMissed() can only be called for EMOM blocks')
      return false
    }
    emomTimer?.markMinuteMissed(minute)
    return true
  }

  function recordTabataReps(reps: number): boolean {
    if (activeBlockKind.value !== 'tabata') {
      error.value = new Error('recordTabataReps() can only be called for Tabata blocks')
      return false
    }
    tabataTimer?.recordReps(reps)
    return true
  }

  function markExerciseComplete(exerciseId: string): boolean {
    if (activeBlockKind.value !== 'fortime') {
      error.value = new Error('markExerciseComplete() can only be called for For Time blocks')
      return false
    }
    forTimeTimer?.markExerciseComplete(exerciseId)
    return true
  }

  return {
    // State
    activeBlock,
    blockState,
    error,

    // Grouped computed
    timerValues,
    timerStatus,
    blockSpecificValues,

    // Methods
    initializeBlock,
    start,
    pause,
    toggle,
    reset,
    complete,
    clearError,

    // Block-specific methods
    incrementRound,
    markMinuteMissed,
    recordTabataReps,
    markExerciseComplete,
  }
}
