/**
 * Composable for managing timed block timers (AMRAP, EMOM, Tabata, For Time).
 *
 * Provides unified timer logic with block-specific state management.
 */

import { useIntervalFn } from '@vueuse/core'
import { computed, ref, watch } from 'vue'
import type {
  ActiveBlockState,
  AmrapResult,
  AmrapState,
  EmomResult,
  EmomState,
  ForTimeResult,
  ForTimeState,
  TabataResult,
  TabataState,
  TimedBlock,
} from '@/types/blocks'
import { formatTime } from '@/lib/workout-utils'

type BlockTimerConfig = {
  onMinuteChange?: (minute: number) => void
  onPhaseChange?: (phase: 'work' | 'rest') => void
  onRoundChange?: (round: number) => void
  onComplete?: () => void
}

function createInitialAmrapState(): AmrapState {
  return {
    timerState: { status: 'idle' },
    rounds: 0,
    currentExerciseIndex: 0,
  }
}

function createInitialEmomState(): EmomState {
  return {
    timerState: { status: 'idle' },
    currentMinute: 1,
    currentExerciseIndex: 0,
    missedMinutes: [],
  }
}

function createInitialTabataState(): TabataState {
  return {
    timerState: { status: 'idle' },
    currentRound: 1,
    phase: 'work',
    repsPerRound: [],
  }
}

function createInitialForTimeState(): ForTimeState {
  return {
    timerState: { status: 'idle' },
    completedExercises: [],
  }
}

export function useBlockTimer(config: BlockTimerConfig = {}) {
  // 1. Primary State
  const activeBlock = ref<TimedBlock | null>(null)
  const blockState = ref<ActiveBlockState | null>(null)
  const elapsedMs = ref(0)

  // 2. Internal interval - updates every 100ms for smooth countdown
  const { pause, resume, isActive } = useIntervalFn(
    () => {
      if (!blockState.value || blockState.value.state.timerState.status !== 'running') {
        return
      }

      const now = Date.now()
      const { startedAt } = blockState.value.state.timerState
      elapsedMs.value = now - startedAt

      // Handle block-specific logic on each tick
      handleTimerTick()
    },
    100,
    { immediate: false },
  )

  // 3. Computed values
  const isRunning = computed(() => isActive.value)

  const elapsedSeconds = computed(() => Math.floor(elapsedMs.value / 1000))

  const remainingSeconds = computed(() => {
    if (!activeBlock.value) return 0

    switch (activeBlock.value.kind) {
      case 'amrap':
        return Math.max(0, activeBlock.value.config.durationSeconds - elapsedSeconds.value)
      case 'emom':
        return Math.max(0, activeBlock.value.config.minutes * 60 - elapsedSeconds.value)
      case 'tabata': {
        const { rounds, workSeconds, restSeconds } = activeBlock.value.config
        const totalSeconds = rounds * (workSeconds + restSeconds)
        return Math.max(0, totalSeconds - elapsedSeconds.value)
      }
      case 'fortime':
        // For Time counts up, show time cap remaining if set
        if (activeBlock.value.config.timeCapSeconds) {
          return Math.max(0, activeBlock.value.config.timeCapSeconds - elapsedSeconds.value)
        }
        return 0
      default: {
        const _exhaustiveCheck: never = activeBlock.value
        return _exhaustiveCheck
      }
    }
  })

  const formattedElapsed = computed(() => formatTime(elapsedSeconds.value))

  const formattedRemaining = computed(() => formatTime(remainingSeconds.value))

  // Current minute for EMOM
  const currentMinute = computed(() => {
    if (blockState.value?.kind !== 'emom') return 0
    return blockState.value.state.currentMinute
  })

  // Seconds remaining in current minute for EMOM
  const secondsInCurrentMinute = computed(() => {
    if (!activeBlock.value || activeBlock.value.kind !== 'emom') return 0
    const secondsElapsed = elapsedSeconds.value
    return 60 - (secondsElapsed % 60)
  })

  // Current round for Tabata
  const currentRound = computed(() => {
    if (blockState.value?.kind !== 'tabata') return 0
    return blockState.value.state.currentRound
  })

  // Current phase for Tabata
  const currentPhase = computed(() => {
    if (blockState.value?.kind !== 'tabata') return 'work'
    return blockState.value.state.phase
  })

  // Seconds remaining in current phase for Tabata
  const secondsInCurrentPhase = computed(() => {
    if (!activeBlock.value || activeBlock.value.kind !== 'tabata') return 0
    const { workSeconds, restSeconds } = activeBlock.value.config
    const intervalLength = workSeconds + restSeconds
    const secondsInInterval = elapsedSeconds.value % intervalLength
    const phase = blockState.value?.kind === 'tabata' ? blockState.value.state.phase : 'work'

    if (phase === 'work') {
      return Math.max(0, workSeconds - secondsInInterval)
    }
    return Math.max(0, restSeconds - (secondsInInterval - workSeconds))
  })

  // Progress percentage (0-100)
  const progress = computed(() => {
    if (!activeBlock.value) return 0

    switch (activeBlock.value.kind) {
      case 'amrap':
        return Math.min(
          100,
          (elapsedSeconds.value / activeBlock.value.config.durationSeconds) * 100,
        )
      case 'emom':
        return Math.min(100, (elapsedSeconds.value / (activeBlock.value.config.minutes * 60)) * 100)
      case 'tabata': {
        const { rounds, workSeconds, restSeconds } = activeBlock.value.config
        const totalSeconds = rounds * (workSeconds + restSeconds)
        return Math.min(100, (elapsedSeconds.value / totalSeconds) * 100)
      }
      case 'fortime':
        if (activeBlock.value.config.timeCapSeconds) {
          return Math.min(
            100,
            (elapsedSeconds.value / activeBlock.value.config.timeCapSeconds) * 100,
          )
        }
        return 0 // No progress for uncapped For Time
      default: {
        const _exhaustiveCheck: never = activeBlock.value
        return _exhaustiveCheck
      }
    }
  })

  // Rounds completed (AMRAP)
  const roundsCompleted = computed(() => {
    if (blockState.value?.kind !== 'amrap') return 0
    return blockState.value.state.rounds
  })

  // 4. Methods
  function initializeBlock(block: TimedBlock) {
    activeBlock.value = block
    elapsedMs.value = 0

    switch (block.kind) {
      case 'amrap':
        blockState.value = { kind: 'amrap', state: createInitialAmrapState() }
        break
      case 'emom':
        blockState.value = { kind: 'emom', state: createInitialEmomState() }
        break
      case 'tabata':
        blockState.value = { kind: 'tabata', state: createInitialTabataState() }
        break
      case 'fortime':
        blockState.value = { kind: 'fortime', state: createInitialForTimeState() }
        break
    }
  }

  function start() {
    if (!blockState.value) return

    const now = Date.now()

    if (blockState.value.state.timerState.status === 'paused') {
      // Resume from pause - adjust startedAt
      const pausedDuration = now - blockState.value.state.timerState.pausedAt
      blockState.value.state.timerState = {
        status: 'running',
        startedAt: blockState.value.state.timerState.startedAt + pausedDuration,
        pausedAt: null,
      }
      resume()
      return
    }

    // Fresh start
    blockState.value.state.timerState = {
      status: 'running',
      startedAt: now,
      pausedAt: null,
    }
    resume()
  }

  function pauseTimer() {
    if (!blockState.value || blockState.value.state.timerState.status !== 'running') return

    const { startedAt } = blockState.value.state.timerState
    blockState.value.state.timerState = {
      status: 'paused',
      startedAt,
      pausedAt: Date.now(),
    }
    pause()
  }

  function toggle() {
    if (!blockState.value) return

    if (blockState.value.state.timerState.status === 'running') {
      pauseTimer()
      return
    }

    start()
  }

  function reset() {
    if (!activeBlock.value) return
    pause()
    elapsedMs.value = 0
    initializeBlock(activeBlock.value)
  }

  function complete(): AmrapResult | EmomResult | TabataResult | ForTimeResult | null {
    if (!blockState.value || !activeBlock.value) return null

    const now = Date.now()
    pause()

    switch (blockState.value.kind) {
      case 'amrap': {
        const result: AmrapResult = {
          rounds: blockState.value.state.rounds,
          partialReps: blockState.value.state.currentExerciseIndex,
          actualDuration: elapsedSeconds.value,
        }
        blockState.value.state.timerState = {
          status: 'completed',
          startedAt:
            blockState.value.state.timerState.status !== 'idle'
              ? blockState.value.state.timerState.startedAt
              : now,
          completedAt: now,
        }
        return result
      }
      case 'emom': {
        const result: EmomResult = {
          completedMinutes: blockState.value.state.currentMinute - 1,
          missedMinutes: blockState.value.state.missedMinutes,
        }
        blockState.value.state.timerState = {
          status: 'completed',
          startedAt:
            blockState.value.state.timerState.status !== 'idle'
              ? blockState.value.state.timerState.startedAt
              : now,
          completedAt: now,
        }
        return result
      }
      case 'tabata': {
        const result: TabataResult = {
          repsPerRound: blockState.value.state.repsPerRound,
        }
        blockState.value.state.timerState = {
          status: 'completed',
          startedAt:
            blockState.value.state.timerState.status !== 'idle'
              ? blockState.value.state.timerState.startedAt
              : now,
          completedAt: now,
        }
        return result
      }
      case 'fortime': {
        const result: ForTimeResult = {
          completionTime: elapsedSeconds.value,
          completed: true,
        }
        blockState.value.state.timerState = {
          status: 'completed',
          startedAt:
            blockState.value.state.timerState.status !== 'idle'
              ? blockState.value.state.timerState.startedAt
              : now,
          completedAt: now,
        }
        return result
      }
    }
  }

  // AMRAP-specific: increment round count
  function incrementRound() {
    if (blockState.value?.kind !== 'amrap') return
    blockState.value.state.rounds++
    blockState.value.state.currentExerciseIndex = 0
  }

  // EMOM-specific: mark minute as missed
  function markMinuteMissed(minute: number) {
    if (blockState.value?.kind !== 'emom') return
    if (!blockState.value.state.missedMinutes.includes(minute)) {
      blockState.value.state.missedMinutes.push(minute)
    }
  }

  // Tabata-specific: record reps for current round
  function recordTabataReps(reps: number) {
    if (blockState.value?.kind !== 'tabata') return
    const roundIndex = blockState.value.state.currentRound - 1
    blockState.value.state.repsPerRound[roundIndex] = reps
  }

  // For Time-specific: mark exercise as complete
  function markExerciseComplete(exerciseId: string) {
    if (blockState.value?.kind !== 'fortime') return
    if (!blockState.value.state.completedExercises.includes(exerciseId)) {
      blockState.value.state.completedExercises.push(exerciseId)
    }
  }

  // 5. Internal timer tick handler
  function handleTimerTick() {
    if (!blockState.value || !activeBlock.value) return

    const seconds = elapsedSeconds.value
    const block = activeBlock.value

    // Block kind and state kind should always match
    if (blockState.value.kind === 'emom' && block.kind === 'emom') {
      const newMinute = Math.floor(seconds / 60) + 1

      if (newMinute !== blockState.value.state.currentMinute && newMinute <= block.config.minutes) {
        blockState.value.state.currentMinute = newMinute
        // Rotate exercise if configured
        if (block.config.exerciseRotation === 'each-minute') {
          blockState.value.state.currentExerciseIndex =
            (blockState.value.state.currentExerciseIndex + 1) % block.exercises.length
        }
        config.onMinuteChange?.(newMinute)
      }

      // Check for completion
      if (seconds >= block.config.minutes * 60) {
        complete()
        config.onComplete?.()
      }
      return
    }

    if (blockState.value.kind === 'amrap' && block.kind === 'amrap') {
      // Check for completion
      if (seconds >= block.config.durationSeconds) {
        complete()
        config.onComplete?.()
      }
      return
    }

    if (blockState.value.kind === 'tabata' && block.kind === 'tabata') {
      const { workSeconds, restSeconds, rounds } = block.config
      const intervalLength = workSeconds + restSeconds
      const totalSeconds = rounds * intervalLength

      // Calculate current round and phase
      const currentInterval = Math.floor(seconds / intervalLength) + 1
      const secondsInInterval = seconds % intervalLength
      const newPhase: 'work' | 'rest' = secondsInInterval < workSeconds ? 'work' : 'rest'

      // Update round
      if (currentInterval !== blockState.value.state.currentRound && currentInterval <= rounds) {
        blockState.value.state.currentRound = currentInterval
        config.onRoundChange?.(currentInterval)
      }

      // Update phase
      if (newPhase !== blockState.value.state.phase) {
        blockState.value.state.phase = newPhase
        config.onPhaseChange?.(newPhase)
      }

      // Check for completion
      if (seconds >= totalSeconds) {
        complete()
        config.onComplete?.()
      }
      return
    }

    if (blockState.value.kind === 'fortime' && block.kind === 'fortime') {
      // Check for time cap
      if (block.config.timeCapSeconds && seconds >= block.config.timeCapSeconds) {
        // Time cap reached without completion
        pause()
        blockState.value.state.timerState = {
          status: 'completed',
          startedAt:
            blockState.value.state.timerState.status !== 'idle'
              ? blockState.value.state.timerState.startedAt
              : Date.now(),
          completedAt: Date.now(),
        }
        config.onComplete?.()
      }
    }
  }

  // 6. Cleanup on block change
  watch(activeBlock, (newBlock, oldBlock) => {
    if (oldBlock && !newBlock) {
      pause()
      blockState.value = null
      elapsedMs.value = 0
    }
  })

  return {
    // State
    activeBlock,
    blockState,
    elapsedMs,
    elapsedSeconds,
    remainingSeconds,
    isRunning,

    // Formatted values
    formattedElapsed,
    formattedRemaining,
    progress,

    // Block-specific computed
    currentMinute,
    secondsInCurrentMinute,
    currentRound,
    currentPhase,
    secondsInCurrentPhase,
    roundsCompleted,

    // Methods
    initializeBlock,
    start,
    pause: pauseTimer,
    toggle,
    reset,
    complete,

    // Block-specific methods
    incrementRound,
    markMinuteMissed,
    recordTabataReps,
    markExerciseComplete,
  }
}
