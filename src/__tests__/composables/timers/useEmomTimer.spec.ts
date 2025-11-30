import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EmomBlock } from '@/types/blocks'
import { useEmomTimer } from '@/composables/timers/useEmomTimer'
import { withSetup } from '../../helpers/withSetup'

function createEmomBlock(overrides: Partial<EmomBlock> = {}): EmomBlock {
  return {
    kind: 'emom',
    id: 1,
    config: {
      minutes: 10,
      exerciseRotation: 'each-minute',
    },
    exercises: [
      { id: '1', name: 'Push-ups', prescribedReps: 10, load: null, thumbnail: '💪' },
      { id: '2', name: 'Squats', prescribedReps: 15, load: null, thumbnail: '🦵' },
    ],
    result: null,
    ...overrides,
  }
}

describe('useEmomTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('starts in idle state', () => {
      const [timer, app] = withSetup(() => useEmomTimer())

      expect(timer.isIdle.value).toBe(true)
      expect(timer.isRunning.value).toBe(false)
      expect(timer.isPaused.value).toBe(false)
      expect(timer.isCompleted.value).toBe(false)

      app.unmount()
    })

    it('initializes with block data', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      const block = createEmomBlock()

      timer.initialize(block)

      expect(timer.block.value).toEqual(block)
      expect(timer.currentMinute.value).toBe(1)
      expect(timer.currentExerciseIndex.value).toBe(0)
      expect(timer.elapsedMs.value).toBe(0)
      expect(timer.missedMinutes.value).toEqual([])

      app.unmount()
    })

    it('resets state when initialized with new block', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      const block = createEmomBlock()

      timer.initialize(block)
      timer.start()
      vi.advanceTimersByTime(30000) // 30 seconds

      const newBlock = createEmomBlock({ id: 2 })
      timer.initialize(newBlock)

      expect(timer.block.value).toEqual(newBlock)
      expect(timer.elapsedMs.value).toBe(0)
      expect(timer.isIdle.value).toBe(true)

      app.unmount()
    })
  })

  describe('timer controls', () => {
    it('starts timer from idle', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()

      expect(timer.isRunning.value).toBe(true)
      expect(timer.isIdle.value).toBe(false)

      app.unmount()
    })

    it('pauses running timer', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()
      timer.pause()

      expect(timer.isPaused.value).toBe(true)
      expect(timer.isRunning.value).toBe(false)

      app.unmount()
    })

    it('resumes paused timer', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()
      vi.advanceTimersByTime(5000)
      timer.pause()
      timer.start()

      expect(timer.isRunning.value).toBe(true)
      expect(timer.isPaused.value).toBe(false)

      app.unmount()
    })

    it('toggles between running and paused', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.toggle()
      expect(timer.isRunning.value).toBe(true)

      timer.toggle()
      expect(timer.isPaused.value).toBe(true)

      timer.toggle()
      expect(timer.isRunning.value).toBe(true)

      app.unmount()
    })

    it('does not start when already completed', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()
      timer.complete()
      timer.start()

      expect(timer.isCompleted.value).toBe(true)
      expect(timer.isRunning.value).toBe(false)

      app.unmount()
    })

    it('does not pause when not running', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.pause()

      expect(timer.isIdle.value).toBe(true)
      expect(timer.isPaused.value).toBe(false)

      app.unmount()
    })

    it('resets timer to initial state', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()
      vi.advanceTimersByTime(120000) // 2 minutes
      timer.reset()

      expect(timer.isIdle.value).toBe(true)
      expect(timer.elapsedMs.value).toBe(0)
      expect(timer.currentMinute.value).toBe(1)

      app.unmount()
    })
  })

  describe('time tracking', () => {
    it('tracks elapsed time', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()
      vi.advanceTimersByTime(5000) // 5 seconds

      expect(timer.elapsedSeconds.value).toBe(5)

      app.unmount()
    })

    it('calculates remaining seconds', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(
        createEmomBlock({ config: { minutes: 10, exerciseRotation: 'each-minute' } }),
      )

      timer.start()
      vi.advanceTimersByTime(60000) // 1 minute

      expect(timer.remainingSeconds.value).toBe(540) // 9 minutes remaining

      app.unmount()
    })

    it('calculates seconds remaining in current minute', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()
      vi.advanceTimersByTime(15000) // 15 seconds

      expect(timer.secondsRemainingInMinute.value).toBe(45)

      app.unmount()
    })

    it('calculates progress percentage', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(
        createEmomBlock({ config: { minutes: 10, exerciseRotation: 'each-minute' } }),
      )

      timer.start()
      vi.advanceTimersByTime(300000) // 5 minutes (50%)

      expect(timer.progress.value).toBe(50)

      app.unmount()
    })

    it('formats elapsed time', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()
      vi.advanceTimersByTime(125000) // 2:05

      expect(timer.formattedElapsed.value).toBe('2:05')

      app.unmount()
    })

    it('formats remaining time', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(
        createEmomBlock({ config: { minutes: 10, exerciseRotation: 'each-minute' } }),
      )

      timer.start()
      vi.advanceTimersByTime(60000) // 1 minute elapsed

      expect(timer.formattedRemaining.value).toBe('9:00')

      app.unmount()
    })
  })

  describe('minute transitions', () => {
    it('increments current minute when crossing minute boundary', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()
      vi.advanceTimersByTime(60100) // Just past 1 minute

      expect(timer.currentMinute.value).toBe(2)

      app.unmount()
    })

    it('calls onMinuteChange callback on minute transition', () => {
      const onMinuteChange = vi.fn()
      const [timer, app] = withSetup(() => useEmomTimer({ onMinuteChange }))
      timer.initialize(createEmomBlock())

      timer.start()
      vi.advanceTimersByTime(60100)

      expect(onMinuteChange).toHaveBeenCalledWith(2)

      app.unmount()
    })

    it('rotates exercise index on minute change with each-minute rotation', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(
        createEmomBlock({ config: { minutes: 10, exerciseRotation: 'each-minute' } }),
      )

      timer.start()
      vi.advanceTimersByTime(60100)

      expect(timer.currentExerciseIndex.value).toBe(1)

      vi.advanceTimersByTime(60000) // another minute

      expect(timer.currentExerciseIndex.value).toBe(0) // wraps around

      app.unmount()
    })

    it('keeps exercise index when rotation is full-round', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock({ config: { minutes: 10, exerciseRotation: 'full-round' } }))

      timer.start()
      vi.advanceTimersByTime(60100)

      expect(timer.currentExerciseIndex.value).toBe(0)

      app.unmount()
    })
  })

  describe('completion', () => {
    it('completes when duration is reached', () => {
      const onComplete = vi.fn()
      const [timer, app] = withSetup(() => useEmomTimer({ onComplete }))
      timer.initialize(createEmomBlock({ config: { minutes: 2, exerciseRotation: 'each-minute' } }))

      timer.start()
      vi.advanceTimersByTime(120100) // Just past 2 minutes

      expect(timer.isCompleted.value).toBe(true)
      expect(onComplete).toHaveBeenCalled()

      app.unmount()
    })

    it('returns result on manual completion', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()
      vi.advanceTimersByTime(150000) // 2.5 minutes
      timer.markMinuteMissed(2)

      const result = timer.complete()

      expect(result.completedMinutes).toBe(2) // currentMinute - 1
      expect(result.missedMinutes).toEqual([2])

      app.unmount()
    })
  })

  describe('missed minutes tracking', () => {
    it('marks minute as missed', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.start()
      timer.markMinuteMissed(1)

      expect(timer.missedMinutes.value).toEqual([1])

      app.unmount()
    })

    it('does not duplicate missed minutes', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.markMinuteMissed(1)
      timer.markMinuteMissed(1)

      expect(timer.missedMinutes.value).toEqual([1])

      app.unmount()
    })

    it('tracks multiple missed minutes', () => {
      const [timer, app] = withSetup(() => useEmomTimer())
      timer.initialize(createEmomBlock())

      timer.markMinuteMissed(1)
      timer.markMinuteMissed(3)
      timer.markMinuteMissed(5)

      expect(timer.missedMinutes.value).toEqual([1, 3, 5])

      app.unmount()
    })
  })

  describe('edge cases', () => {
    it('handles reset without initialization', () => {
      const [timer, app] = withSetup(() => useEmomTimer())

      timer.reset() // Should not throw

      expect(timer.isIdle.value).toBe(true)

      app.unmount()
    })

    it('returns zero remaining seconds without block', () => {
      const [timer, app] = withSetup(() => useEmomTimer())

      expect(timer.remainingSeconds.value).toBe(0)

      app.unmount()
    })

    it('returns zero progress without block', () => {
      const [timer, app] = withSetup(() => useEmomTimer())

      expect(timer.progress.value).toBe(0)

      app.unmount()
    })
  })
})
