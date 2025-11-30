import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { TabataBlock } from '@/types/blocks'
import { useTabataTimer } from '@/composables/timers/useTabataTimer'
import { withSetup } from '../../helpers/withSetup'

function createTabataBlock(overrides: Partial<TabataBlock> = {}): TabataBlock {
  return {
    kind: 'tabata',
    id: 1,
    config: {
      rounds: 8,
      workSeconds: 20,
      restSeconds: 10,
    },
    exercise: { id: '1', name: 'Squats', prescribedReps: 0, load: null, thumbnail: '🦵' },
    result: null,
    ...overrides,
  }
}

describe('useTabataTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('starts in idle state', () => {
      const [timer, app] = withSetup(() => useTabataTimer())

      expect(timer.isIdle.value).toBe(true)
      expect(timer.isRunning.value).toBe(false)
      expect(timer.isPaused.value).toBe(false)
      expect(timer.isCompleted.value).toBe(false)

      app.unmount()
    })

    it('initializes with block data', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      const block = createTabataBlock()

      timer.initialize(block)

      expect(timer.block.value).toEqual(block)
      expect(timer.currentRound.value).toBe(1)
      expect(timer.currentPhase.value).toBe('work')
      expect(timer.elapsedMs.value).toBe(0)
      expect(timer.repsPerRound.value).toEqual([])

      app.unmount()
    })

    it('resets state when initialized with new block', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      const block = createTabataBlock()

      timer.initialize(block)
      timer.start()
      vi.advanceTimersByTime(30000) // Past first round
      timer.recordReps(10)

      const newBlock = createTabataBlock({ id: 2 })
      timer.initialize(newBlock)

      expect(timer.block.value).toEqual(newBlock)
      expect(timer.elapsedMs.value).toBe(0)
      expect(timer.isIdle.value).toBe(true)
      expect(timer.currentRound.value).toBe(1)
      expect(timer.currentPhase.value).toBe('work')
      expect(timer.repsPerRound.value).toEqual([])

      app.unmount()
    })
  })

  describe('timer controls', () => {
    it('starts timer from idle', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()

      expect(timer.isRunning.value).toBe(true)
      expect(timer.isIdle.value).toBe(false)

      app.unmount()
    })

    it('pauses running timer', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      timer.pause()

      expect(timer.isPaused.value).toBe(true)
      expect(timer.isRunning.value).toBe(false)

      app.unmount()
    })

    it('resumes paused timer', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(5000)
      timer.pause()
      timer.start()

      expect(timer.isRunning.value).toBe(true)
      expect(timer.isPaused.value).toBe(false)

      app.unmount()
    })

    it('toggles between running and paused', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.toggle()
      expect(timer.isRunning.value).toBe(true)

      timer.toggle()
      expect(timer.isPaused.value).toBe(true)

      timer.toggle()
      expect(timer.isRunning.value).toBe(true)

      app.unmount()
    })

    it('does not start when already completed', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      timer.complete()
      timer.start()

      expect(timer.isCompleted.value).toBe(true)
      expect(timer.isRunning.value).toBe(false)

      app.unmount()
    })

    it('does not pause when not running', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.pause()

      expect(timer.isIdle.value).toBe(true)
      expect(timer.isPaused.value).toBe(false)

      app.unmount()
    })

    it('resets timer to initial state', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(60000)
      timer.recordReps(10)
      timer.reset()

      expect(timer.isIdle.value).toBe(true)
      expect(timer.elapsedMs.value).toBe(0)
      expect(timer.currentRound.value).toBe(1)
      expect(timer.currentPhase.value).toBe('work')
      expect(timer.repsPerRound.value).toEqual([])

      app.unmount()
    })
  })

  describe('time tracking', () => {
    it('tracks elapsed time', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(15000) // 15 seconds

      expect(timer.elapsedSeconds.value).toBe(15)

      app.unmount()
    })

    it('calculates remaining seconds', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      // 8 rounds * (20 + 10) = 240 seconds total
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(30000) // 30 seconds (1 round)

      expect(timer.remainingSeconds.value).toBe(210) // 7 rounds remaining

      app.unmount()
    })

    it('calculates seconds in current phase', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(5000) // 5 seconds into work

      // 20 - 5 = 15 seconds remaining in work phase
      expect(timer.secondsInCurrentPhase.value).toBe(15)

      app.unmount()
    })

    it('calculates seconds in rest phase', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(22000) // 2 seconds into rest

      expect(timer.currentPhase.value).toBe('rest')
      // 10 - 2 = 8 seconds remaining in rest phase
      expect(timer.secondsInCurrentPhase.value).toBe(8)

      app.unmount()
    })

    it('calculates progress percentage', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      // Total: 8 * 30 = 240 seconds
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(120000) // 50% (120 of 240 seconds)

      expect(timer.progress.value).toBe(50)

      app.unmount()
    })

    it('formats elapsed time', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(95000) // 1:35

      expect(timer.formattedElapsed.value).toBe('1:35')

      app.unmount()
    })

    it('formats remaining time', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(60000) // 1 minute elapsed

      expect(timer.formattedRemaining.value).toBe('3:00') // 180 seconds remaining

      app.unmount()
    })
  })

  describe('phase transitions', () => {
    it('starts in work phase', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()

      expect(timer.currentPhase.value).toBe('work')

      app.unmount()
    })

    it('transitions to rest phase after work', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(20100) // Just past work phase

      expect(timer.currentPhase.value).toBe('rest')

      app.unmount()
    })

    it('transitions back to work phase after rest', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(30100) // Past work + rest

      expect(timer.currentPhase.value).toBe('work')

      app.unmount()
    })

    it('calls onPhaseChange callback', () => {
      const onPhaseChange = vi.fn()
      const [timer, app] = withSetup(() => useTabataTimer({ onPhaseChange }))
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(20100) // Transition to rest

      expect(onPhaseChange).toHaveBeenCalledWith('rest')

      vi.advanceTimersByTime(10000) // Transition to work

      expect(onPhaseChange).toHaveBeenCalledWith('work')

      app.unmount()
    })
  })

  describe('round transitions', () => {
    it('starts at round 1', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()

      expect(timer.currentRound.value).toBe(1)

      app.unmount()
    })

    it('increments round after completing work+rest interval', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(30100) // Just past first interval (20 + 10)

      expect(timer.currentRound.value).toBe(2)

      app.unmount()
    })

    it('calls onRoundChange callback', () => {
      const onRoundChange = vi.fn()
      const [timer, app] = withSetup(() => useTabataTimer({ onRoundChange }))
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(30100) // Complete first round

      expect(onRoundChange).toHaveBeenCalledWith(2)

      app.unmount()
    })

    it('progresses through multiple rounds', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      vi.advanceTimersByTime(90100) // 3 rounds (30 * 3)

      expect(timer.currentRound.value).toBe(4)

      app.unmount()
    })
  })

  describe('completion', () => {
    it('completes after all rounds', () => {
      const onComplete = vi.fn()
      const [timer, app] = withSetup(() => useTabataTimer({ onComplete }))
      timer.initialize(createTabataBlock()) // 8 rounds * 30 seconds = 240 seconds

      timer.start()
      vi.advanceTimersByTime(240100) // Just past total duration

      expect(timer.isCompleted.value).toBe(true)
      expect(onComplete).toHaveBeenCalled()

      app.unmount()
    })

    it('returns result on manual completion', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      timer.recordReps(10)
      vi.advanceTimersByTime(30000)
      timer.recordReps(12)

      const result = timer.complete()

      expect(result.repsPerRound).toEqual([10, 12])

      app.unmount()
    })
  })

  describe('reps tracking', () => {
    it('records reps for current round', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      timer.recordReps(10)

      expect(timer.repsPerRound.value).toEqual([10])

      app.unmount()
    })

    it('records reps for multiple rounds', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      timer.recordReps(10)
      vi.advanceTimersByTime(30100) // Move to round 2
      timer.recordReps(12)
      vi.advanceTimersByTime(30000) // Move to round 3
      timer.recordReps(8)

      expect(timer.repsPerRound.value).toEqual([10, 12, 8])

      app.unmount()
    })

    it('updates reps for current round when called multiple times', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(createTabataBlock())

      timer.start()
      timer.recordReps(10)
      timer.recordReps(15) // Update same round

      expect(timer.repsPerRound.value).toEqual([15])

      app.unmount()
    })
  })

  describe('different configurations', () => {
    it('handles short work periods', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(
        createTabataBlock({
          config: { rounds: 4, workSeconds: 10, restSeconds: 5 },
        }),
      )

      timer.start()
      vi.advanceTimersByTime(10100)

      expect(timer.currentPhase.value).toBe('rest')

      app.unmount()
    })

    it('handles long rest periods', () => {
      const [timer, app] = withSetup(() => useTabataTimer())
      timer.initialize(
        createTabataBlock({
          config: { rounds: 4, workSeconds: 20, restSeconds: 40 },
        }),
      )

      timer.start()
      vi.advanceTimersByTime(20100) // Enter rest

      expect(timer.currentPhase.value).toBe('rest')

      vi.advanceTimersByTime(20000) // Still in rest
      expect(timer.currentPhase.value).toBe('rest')

      vi.advanceTimersByTime(20000) // Enter work
      expect(timer.currentPhase.value).toBe('work')

      app.unmount()
    })

    it('handles single round', () => {
      const onComplete = vi.fn()
      const [timer, app] = withSetup(() => useTabataTimer({ onComplete }))
      timer.initialize(
        createTabataBlock({
          config: { rounds: 1, workSeconds: 20, restSeconds: 10 },
        }),
      )

      timer.start()
      vi.advanceTimersByTime(30100) // Complete single round

      expect(timer.isCompleted.value).toBe(true)
      expect(onComplete).toHaveBeenCalled()

      app.unmount()
    })
  })

  describe('edge cases', () => {
    it('handles reset without initialization', () => {
      const [timer, app] = withSetup(() => useTabataTimer())

      timer.reset() // Should not throw

      expect(timer.isIdle.value).toBe(true)

      app.unmount()
    })

    it('returns zero remaining seconds without block', () => {
      const [timer, app] = withSetup(() => useTabataTimer())

      expect(timer.remainingSeconds.value).toBe(0)

      app.unmount()
    })

    it('returns zero progress without block', () => {
      const [timer, app] = withSetup(() => useTabataTimer())

      expect(timer.progress.value).toBe(0)

      app.unmount()
    })

    it('returns zero secondsInCurrentPhase without block', () => {
      const [timer, app] = withSetup(() => useTabataTimer())

      expect(timer.secondsInCurrentPhase.value).toBe(0)

      app.unmount()
    })
  })
})
