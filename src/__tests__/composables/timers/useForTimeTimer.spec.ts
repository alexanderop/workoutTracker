import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ForTimeBlock } from '@/types/blocks'
import { useForTimeTimer } from '@/composables/timers/useForTimeTimer'
import { withSetup } from '../../helpers/withSetup'

function createForTimeBlock(overrides: Partial<ForTimeBlock> = {}): ForTimeBlock {
  return {
    kind: 'fortime',
    id: 1,
    config: {
      timeCapSeconds: 600, // 10 minute cap
    },
    exercises: [
      { id: '1', name: 'Burpees', prescribedReps: 50, load: null, thumbnail: '🏃' },
      { id: '2', name: 'Box Jumps', prescribedReps: 40, load: '24"', thumbnail: '📦' },
    ],
    result: null,
    ...overrides,
  }
}

describe('useForTimeTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initialization', () => {
    it('starts in idle state', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())

      expect(timer.isIdle.value).toBe(true)
      expect(timer.isRunning.value).toBe(false)
      expect(timer.isPaused.value).toBe(false)
      expect(timer.isCompleted.value).toBe(false)

      app.unmount()
    })

    it('initializes with block data', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      const block = createForTimeBlock()

      timer.initialize(block)

      expect(timer.block.value).toEqual(block)
      expect(timer.elapsedMs.value).toBe(0)
      expect(timer.completedExercises.value).toEqual([])
      expect(timer.finishedBeforeCap.value).toBe(false)

      app.unmount()
    })

    it('resets state when initialized with new block', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      const block = createForTimeBlock()

      timer.initialize(block)
      timer.start()
      vi.advanceTimersByTime(30000)
      timer.markExerciseComplete('1')

      const newBlock = createForTimeBlock({ id: 2 })
      timer.initialize(newBlock)

      expect(timer.block.value).toEqual(newBlock)
      expect(timer.elapsedMs.value).toBe(0)
      expect(timer.isIdle.value).toBe(true)
      expect(timer.completedExercises.value).toEqual([])

      app.unmount()
    })
  })

  describe('timer controls', () => {
    it('starts timer from idle', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.start()

      expect(timer.isRunning.value).toBe(true)
      expect(timer.isIdle.value).toBe(false)

      app.unmount()
    })

    it('pauses running timer', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.start()
      timer.pause()

      expect(timer.isPaused.value).toBe(true)
      expect(timer.isRunning.value).toBe(false)

      app.unmount()
    })

    it('resumes paused timer', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.start()
      vi.advanceTimersByTime(5000)
      timer.pause()
      timer.start()

      expect(timer.isRunning.value).toBe(true)
      expect(timer.isPaused.value).toBe(false)

      app.unmount()
    })

    it('toggles between running and paused', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.toggle()
      expect(timer.isRunning.value).toBe(true)

      timer.toggle()
      expect(timer.isPaused.value).toBe(true)

      timer.toggle()
      expect(timer.isRunning.value).toBe(true)

      app.unmount()
    })

    it('does not start when already completed', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.start()
      timer.complete()
      timer.start()

      expect(timer.isCompleted.value).toBe(true)
      expect(timer.isRunning.value).toBe(false)

      app.unmount()
    })

    it('does not pause when not running', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.pause()

      expect(timer.isIdle.value).toBe(true)
      expect(timer.isPaused.value).toBe(false)

      app.unmount()
    })

    it('resets timer to initial state', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.start()
      vi.advanceTimersByTime(120000)
      timer.markExerciseComplete('1')
      timer.reset()

      expect(timer.isIdle.value).toBe(true)
      expect(timer.elapsedMs.value).toBe(0)
      expect(timer.completedExercises.value).toEqual([])

      app.unmount()
    })
  })

  describe('time tracking', () => {
    it('tracks elapsed time (count up)', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.start()
      vi.advanceTimersByTime(45000) // 45 seconds

      expect(timer.elapsedSeconds.value).toBe(45)

      app.unmount()
    })

    it('calculates remaining seconds until time cap', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock({ config: { timeCapSeconds: 300 } }))

      timer.start()
      vi.advanceTimersByTime(60000) // 1 minute

      expect(timer.remainingSeconds.value).toBe(240) // 4 minutes remaining

      app.unmount()
    })

    it('returns zero remaining when no time cap', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock({ config: { timeCapSeconds: null } }))

      timer.start()
      vi.advanceTimersByTime(60000)

      expect(timer.remainingSeconds.value).toBe(0)

      app.unmount()
    })

    it('calculates progress percentage', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock({ config: { timeCapSeconds: 200 } }))

      timer.start()
      vi.advanceTimersByTime(100000) // 100 seconds (50%)

      expect(timer.progress.value).toBe(50)

      app.unmount()
    })

    it('returns zero progress when no time cap', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock({ config: { timeCapSeconds: null } }))

      timer.start()
      vi.advanceTimersByTime(60000)

      expect(timer.progress.value).toBe(0)

      app.unmount()
    })

    it('formats elapsed time', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.start()
      vi.advanceTimersByTime(185000) // 3:05

      expect(timer.formattedElapsed.value).toBe('3:05')

      app.unmount()
    })

    it('formats remaining time', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock({ config: { timeCapSeconds: 600 } }))

      timer.start()
      vi.advanceTimersByTime(60000) // 1 minute elapsed

      expect(timer.formattedRemaining.value).toBe('9:00')

      app.unmount()
    })
  })

  describe('time cap', () => {
    it('completes when time cap is reached', () => {
      const onComplete = vi.fn()
      const [timer, app] = withSetup(() => useForTimeTimer({ onComplete }))
      timer.initialize(createForTimeBlock({ config: { timeCapSeconds: 120 } }))

      timer.start()
      vi.advanceTimersByTime(120100) // Just past 2 minutes

      expect(timer.isCompleted.value).toBe(true)
      expect(onComplete).toHaveBeenCalled()

      app.unmount()
    })

    it('continues indefinitely without time cap', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock({ config: { timeCapSeconds: null } }))

      timer.start()
      vi.advanceTimersByTime(3600000) // 1 hour

      expect(timer.isCompleted.value).toBe(false)
      expect(timer.isRunning.value).toBe(true)
      expect(timer.elapsedSeconds.value).toBe(3600)

      app.unmount()
    })
  })

  describe('exercise tracking', () => {
    it('marks exercise as complete', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.markExerciseComplete('1')

      expect(timer.completedExercises.value).toEqual(['1'])

      app.unmount()
    })

    it('does not duplicate completed exercises', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.markExerciseComplete('1')
      timer.markExerciseComplete('1')

      expect(timer.completedExercises.value).toEqual(['1'])

      app.unmount()
    })

    it('tracks multiple completed exercises', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.markExerciseComplete('1')
      timer.markExerciseComplete('2')

      expect(timer.completedExercises.value).toEqual(['1', '2'])

      app.unmount()
    })
  })

  describe('completion', () => {
    it('returns result on manual completion', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock())

      timer.start()
      vi.advanceTimersByTime(180000) // 3 minutes

      const result = timer.complete()

      expect(result.completionTime).toBe(180)
      expect(result.completed).toBe(false)

      app.unmount()
    })

    it('marks finished before cap when using finishWorkout', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())
      timer.initialize(createForTimeBlock({ config: { timeCapSeconds: 600 } }))

      timer.start()
      vi.advanceTimersByTime(180000) // 3 minutes

      timer.finishWorkout()

      expect(timer.isCompleted.value).toBe(true)
      expect(timer.finishedBeforeCap.value).toBe(true)

      app.unmount()
    })

    it('calls onComplete callback when finishing workout', () => {
      const onComplete = vi.fn()
      const [timer, app] = withSetup(() => useForTimeTimer({ onComplete }))
      timer.initialize(createForTimeBlock())

      timer.start()
      timer.finishWorkout()

      expect(onComplete).toHaveBeenCalled()

      app.unmount()
    })
  })

  describe('edge cases', () => {
    it('handles reset without initialization', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())

      timer.reset() // Should not throw

      expect(timer.isIdle.value).toBe(true)

      app.unmount()
    })

    it('returns zero remaining seconds without block', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())

      expect(timer.remainingSeconds.value).toBe(0)

      app.unmount()
    })

    it('returns zero progress without block', () => {
      const [timer, app] = withSetup(() => useForTimeTimer())

      expect(timer.progress.value).toBe(0)

      app.unmount()
    })
  })
})
