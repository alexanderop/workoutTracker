/**
 * Base timer composable providing shared timing functionality.
 *
 * Handles core timer state, interval management, and control methods
 * used by AMRAP, EMOM, Tabata, and ForTime timer composables.
 */

import { useIntervalFn } from '@vueuse/core'
import { computed, readonly, ref } from 'vue'

type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

type TimerAction = 'start' | 'resume' | 'pause' | 'complete'

// State machine transition map - documents all valid state changes
const TRANSITIONS = {
  idle:      { start: 'running' },
  running:   { pause: 'paused', complete: 'completed' },
  paused:    { resume: 'running' },
  completed: {},
} as const satisfies Record<TimerStatus, Partial<Record<TimerAction, TimerStatus>>>

type BaseTimerConfig = Readonly<{
  onTick?: () => void
  onComplete?: () => void
  tickInterval?: number
}>

export function useBaseTimer(config: BaseTimerConfig = {}) {
  const { tickInterval = 100 } = config

  // Core State
  const status = ref<TimerStatus>('idle')
  const elapsedMs = ref(0)
  const startedAt = ref<number | null>(null)
  const pausedDuration = ref(0)

  // Interval Management
  const { pause: stopInterval, resume: startInterval } = useIntervalFn(
    () => {
      if (status.value !== 'running' || !startedAt.value) return
      elapsedMs.value = Date.now() - startedAt.value - pausedDuration.value
      config.onTick?.()
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
  function start() {
    if (status.value === 'paused' && startedAt.value) {
      if (!transition('resume')) return
      // Resume from pause
      const now = Date.now()
      const pauseStart = startedAt.value + elapsedMs.value + pausedDuration.value
      pausedDuration.value += now - pauseStart
      startInterval()
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
    config.onComplete?.()
    return false
  }

  return {
    // State (readonly to prevent external mutation)
    status: readonly(status),
    elapsedMs: readonly(elapsedMs),
    elapsedSeconds,
    isRunning,
    isPaused,
    isCompleted,
    isIdle,

    // Methods
    start,
    pause,
    toggle,
    resetState,
    complete,
  }
}
