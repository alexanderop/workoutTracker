import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useEmomTimer } from '@/composables/timers/useEmomTimer'
import { createEmomWorkoutBlock } from '@/lib/workoutBlockFactory'
import type { EmomBlock } from '@/blocks'

function createEmomBlock(config: Partial<EmomBlock['config']> = {}): EmomBlock {
  return createEmomWorkoutBlock(
    { minutes: 2, exerciseRotation: 'each-minute', ...config },
    [
      { id: 'ex-1', name: 'Burpees', prescribedReps: 10, load: null, image: null },
      { id: 'ex-2', name: 'Air Squats', prescribedReps: 15, load: null, image: null },
    ],
    1,
  )
}

describe('useEmomTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be defined', () => {
    expect(useEmomTimer).toBeDefined()
  })

  it('initializes at minute one with no missed minutes', () => {
    const timer = useEmomTimer()

    timer.initialize(createEmomBlock())

    expect(timer.currentMinute.value).toBe(1)
    expect(timer.currentExerciseIndex.value).toBe(0)
    expect(timer.missedMinutes.value).toEqual([])
  })

  it('fires onMinuteChange and rotates the exercise at each minute boundary', async () => {
    const onMinuteChange = vi.fn()
    const timer = useEmomTimer({ onMinuteChange })
    timer.initialize(createEmomBlock({ minutes: 3 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(timer.currentMinute.value).toBe(2)
    expect(onMinuteChange).toHaveBeenCalledWith(2)
    expect(timer.currentExerciseIndex.value).toBe(1)

    await vi.advanceTimersByTimeAsync(60_000)

    expect(timer.currentMinute.value).toBe(3)
    expect(timer.currentExerciseIndex.value).toBe(0) // wrapped around two exercises
  })

  it('does not rotate exercises with full-round rotation', async () => {
    const timer = useEmomTimer()
    timer.initialize(createEmomBlock({ minutes: 3, exerciseRotation: 'full-round' }))

    timer.start()
    await vi.advanceTimersByTimeAsync(60_000)

    expect(timer.currentMinute.value).toBe(2)
    expect(timer.currentExerciseIndex.value).toBe(0)
  })

  it('counts seconds remaining in the current minute', async () => {
    const timer = useEmomTimer()
    timer.initialize(createEmomBlock())

    timer.start()
    await vi.advanceTimersByTimeAsync(15_000)

    expect(timer.secondsRemainingInMinute.value).toBe(45)
  })

  it('records missed minutes without duplicates', () => {
    const timer = useEmomTimer()
    timer.initialize(createEmomBlock())

    timer.markMinuteMissed(1)
    timer.markMinuteMissed(1)
    timer.markMinuteMissed(2)

    expect(timer.missedMinutes.value).toEqual([1, 2])
  })

  it('auto-completes when all minutes elapse and reports the result', async () => {
    const onComplete = vi.fn()
    const timer = useEmomTimer({ onComplete })
    timer.initialize(createEmomBlock({ minutes: 2 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(120_000)

    expect(timer.isCompleted.value).toBe(true)
    expect(onComplete).toHaveBeenCalledTimes(1)

    timer.markMinuteMissed(2)
    const result = timer.complete()
    expect(result).toEqual({ completedMinutes: 1, missedMinutes: [2] })
  })

  it('supports pause and resume through the Pausable surface', async () => {
    const timer = useEmomTimer()
    timer.initialize(createEmomBlock())

    timer.start()
    await vi.advanceTimersByTimeAsync(10_000)
    timer.pause()
    await vi.advanceTimersByTimeAsync(30_000)
    timer.resume()
    await vi.advanceTimersByTimeAsync(5000)

    expect(timer.elapsedSeconds.value).toBe(15)
  })
})
