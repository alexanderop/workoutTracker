import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useForTimeTimer } from '@/composables/timers/useForTimeTimer'
import { createForTimeWorkoutBlock } from '@/lib/workoutBlockFactory'
import type { ForTimeBlock } from '@/types/blocks'

function createForTimeBlock(config: Partial<ForTimeBlock['config']> = {}): ForTimeBlock {
  return createForTimeWorkoutBlock(
    { timeCapSeconds: 60, ...config },
    [
      { id: 'ex-1', name: 'Thrusters', prescribedReps: 21, load: null, image: null },
      { id: 'ex-2', name: 'Pull-ups', prescribedReps: 21, load: null, image: null },
    ],
    1,
  )
}

describe('useForTimeTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be defined', () => {
    expect(useForTimeTimer).toBeDefined()
  })

  it('counts up and reports remaining time toward the cap', async () => {
    const timer = useForTimeTimer()
    timer.initialize(createForTimeBlock({ timeCapSeconds: 60 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(10_000)

    expect(timer.elapsedSeconds.value).toBe(10)
    expect(timer.remainingSeconds.value).toBe(50)
  })

  it('tracks completed exercises without duplicates', () => {
    const timer = useForTimeTimer()
    timer.initialize(createForTimeBlock())

    timer.markExerciseComplete('ex-1')
    timer.markExerciseComplete('ex-1')
    timer.markExerciseComplete('ex-2')

    expect(timer.completedExercises.value).toEqual(['ex-1', 'ex-2'])
  })

  it('finishWorkout completes with finishedBeforeCap true', async () => {
    const onComplete = vi.fn()
    const timer = useForTimeTimer({ onComplete })
    timer.initialize(createForTimeBlock({ timeCapSeconds: 60 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(45_000)
    timer.finishWorkout()

    expect(timer.finishedBeforeCap.value).toBe(true)
    expect(timer.isCompleted.value).toBe(true)
    expect(onComplete).toHaveBeenCalledTimes(1)

    const result = timer.complete()
    expect(result).toEqual({ completionTime: 45, completed: true })
  })

  it('auto-completes at the time cap with finishedBeforeCap false', async () => {
    const onComplete = vi.fn()
    const timer = useForTimeTimer({ onComplete })
    timer.initialize(createForTimeBlock({ timeCapSeconds: 30 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(31_000)

    expect(timer.isCompleted.value).toBe(true)
    expect(timer.finishedBeforeCap.value).toBe(false)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('never auto-completes without a time cap', async () => {
    const timer = useForTimeTimer()
    timer.initialize(createForTimeBlock({ timeCapSeconds: null }))

    timer.start()
    await vi.advanceTimersByTimeAsync(120_000)

    expect(timer.isCompleted.value).toBe(false)
    expect(timer.remainingSeconds.value).toBe(0)
    expect(timer.progress.value).toBe(0)
  })

  it('supports pause and resume through the Pausable surface', async () => {
    const timer = useForTimeTimer()
    timer.initialize(createForTimeBlock())

    timer.start()
    await vi.advanceTimersByTimeAsync(10_000)
    timer.pause()
    await vi.advanceTimersByTimeAsync(20_000)
    timer.resume()
    await vi.advanceTimersByTimeAsync(5000)

    expect(timer.elapsedSeconds.value).toBe(15)
  })
})
