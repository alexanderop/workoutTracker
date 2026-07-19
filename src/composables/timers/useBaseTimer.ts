/**
 * Base timer composable providing shared timing functionality.
 *
 * Handles core timer state, interval management, and control methods
 * used by AMRAP, EMOM, Tabata, and ForTime timer composables.
 */

import type { Pausable } from '@vueuse/core'
import { useIntervalFn } from '@vueuse/core'
import type { ComputedRef, ShallowRef } from 'vue'
import { computed, shallowReadonly, shallowRef } from 'vue'
import { formatTime } from '@/lib/workout-utils'

type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

type TimerAction = 'start' | 'resume' | 'pause' | 'complete'

// State machine transition map - documents all valid state changes
const TRANSITIONS = {
  idle: { start: 'running' },
  running: { pause: 'paused', complete: 'completed' },
  paused: { resume: 'running' },
} as const satisfies Partial<Record<TimerStatus, Partial<Record<TimerAction, TimerStatus>>>>

export type UseBaseTimerOptions = Readonly<{
  /** Called on every interval tick while running. */
  onTick?: () => void
  /** Called once when the timer first completes. */
  onComplete?: () => void
  /**
   * Interval between ticks in milliseconds.
   * @default 100
   */
  tickInterval?: number
}>

export type UseBaseTimerReturn = Pausable & {
  status: Readonly<ShallowRef<TimerStatus>>
  elapsedMs: Readonly<ShallowRef<number>>
  elapsedSeconds: ComputedRef<number>
  isRunning: ComputedRef<boolean>
  isPaused: ComputedRef<boolean>
  isCompleted: ComputedRef<boolean>
  isIdle: ComputedRef<boolean>
  /** Start a fresh timer, or resume when paused. */
  start: () => void
  toggle: () => void
  resetState: () => void
  /** Transition to completed; returns true when the timer was already completed. */
  complete: () => boolean
}

/**
 * Return surface shared by the block timer composables (AMRAP, EMOM, Tabata,
 * ForTime): the base timer state plus the block ref, countdown/progress
 * computeds, and lifecycle methods. Each timer extends this with its
 * kind-specific state and actions.
 */
export type BlockTimerReturn<TBlock, TResult> = Pausable & {
  elapsedMs: Readonly<ShallowRef<number>>
  elapsedSeconds: ComputedRef<number>
  isRunning: ComputedRef<boolean>
  isPaused: ComputedRef<boolean>
  isCompleted: ComputedRef<boolean>
  isIdle: ComputedRef<boolean>
  block: Readonly<ShallowRef<TBlock | null>>
  remainingSeconds: ComputedRef<number>
  progress: ComputedRef<number>
  formattedElapsed: ComputedRef<string>
  formattedRemaining: ComputedRef<string>
  initialize: (block: TBlock) => void
  start: () => void
  toggle: () => void
  reset: () => void
  complete: () => TResult
}

/**
 * The base-timer state and controls that every block timer re-exposes
 * verbatim. Spread into a block timer's return object alongside its
 * kind-specific state and methods.
 */
export function blockTimerBase(baseTimer: UseBaseTimerReturn) {
  return {
    elapsedMs: baseTimer.elapsedMs,
    elapsedSeconds: baseTimer.elapsedSeconds,
    isRunning: baseTimer.isRunning,
    isPaused: baseTimer.isPaused,
    isCompleted: baseTimer.isCompleted,
    isIdle: baseTimer.isIdle,
    isActive: baseTimer.isActive,
    start: baseTimer.start,
    pause: baseTimer.pause,
    resume: baseTimer.resume,
    toggle: baseTimer.toggle,
  }
}

/**
 * Creates formatted time computed properties for timer displays.
 * Shared by AMRAP, EMOM, and Tabata timers to reduce duplication.
 */
export function createFormattedTimeComputeds(
  elapsedSeconds: ComputedRef<number>,
  remainingSeconds: ComputedRef<number>,
) {
  return {
    formattedElapsed: computed(() => formatTime(elapsedSeconds.value)),
    formattedRemaining: computed(() => formatTime(remainingSeconds.value)),
  }
}

/**
 * Timestamp-based timer state machine (idle → running ⇄ paused → completed)
 * driven by a scope-bound `useIntervalFn`, so ticking stops with the owning
 * effect scope.
 *
 * @param options
 */
export function useBaseTimer(options: UseBaseTimerOptions = {}): UseBaseTimerReturn {
  const { tickInterval = 100 } = options

  // Core State
  const status = shallowRef<TimerStatus>('idle')
  const elapsedMs = shallowRef(0)
  const startedAt = shallowRef<number | null>(null)
  const pausedDuration = shallowRef(0)

  // Interval Management
  const { pause: stopInterval, resume: startInterval } = useIntervalFn(
    () => {
      if (status.value !== 'running' || !startedAt.value) return
      elapsedMs.value = Date.now() - startedAt.value - pausedDuration.value
      options.onTick?.()
    },
    tickInterval,
    { immediate: false },
  )

  // Computed
  const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))
  const isRunning = computed(() => status.value === 'running')
  const isPaused = computed(() => status.value === 'paused')
  const isCompleted = computed(() => status.value === 'completed')
  const isIdle = computed(() => status.value === 'idle')

  // Transition helper - validates and performs state changes
  function transition(action: TimerAction): boolean {
    const current = status.value

    if (current === 'idle' && action === 'start') {
      status.value = TRANSITIONS.idle.start
      return true
    }

    if (current === 'running' && action === 'pause') {
      status.value = TRANSITIONS.running.pause
      return true
    }

    if (current === 'running' && action === 'complete') {
      status.value = TRANSITIONS.running.complete
      return true
    }

    if (current === 'paused' && action === 'resume') {
      status.value = TRANSITIONS.paused.resume
      return true
    }

    return false
  }

  // Methods
  function resume() {
    if (!startedAt.value) return
    if (!transition('resume')) return
    // Resume from pause
    const now = Date.now()
    const pauseStart = startedAt.value + elapsedMs.value + pausedDuration.value
    pausedDuration.value += now - pauseStart
    startInterval()
  }

  function start() {
    if (status.value === 'paused') {
      resume()
      return
    }

    if (!transition('start')) return
    // Fresh start
    startedAt.value = Date.now()
    startInterval()
  }

  function pause() {
    if (!transition('pause')) return
    stopInterval()
  }

  function toggle() {
    if (status.value === 'running') {
      pause()
      return
    }
    if (status.value === 'idle' || status.value === 'paused') {
      start()
    }
  }

  function resetState() {
    status.value = 'idle'
    elapsedMs.value = 0
    startedAt.value = null
    pausedDuration.value = 0
    stopInterval()
  }

  function complete() {
    const wasAlreadyCompleted = !transition('complete')
    if (wasAlreadyCompleted) return true
    stopInterval()
    options.onComplete?.()
    return false
  }

  return {
    // State (readonly to prevent external mutation)
    status: shallowReadonly(status),
    elapsedMs: shallowReadonly(elapsedMs),
    elapsedSeconds,
    isRunning,
    isPaused,
    isCompleted,
    isIdle,
    isActive: isRunning,

    // Methods
    start,
    pause,
    resume,
    toggle,
    resetState,
    complete,
  }
}
