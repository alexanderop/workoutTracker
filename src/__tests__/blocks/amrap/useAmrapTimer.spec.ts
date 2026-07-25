import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useAmrapTimer } from '@/blocks/amrap/useAmrapTimer'
import { createAmrapWorkoutBlock } from '@/blocks'
import type { AmrapBlock } from '@/blocks'

function createAmrapBlock(config: Partial<AmrapBlock['config']> = {}): AmrapBlock {
  return createAmrapWorkoutBlock(
    { durationSeconds: 60, ...config },
    [{ id: 'ex-1', name: 'Burpees', prescribedReps: 10, load: null, image: null }],
    1,
  )
}

describe('useAmrapTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be defined', () => {
    expect(useAmrapTimer).toBeDefined()
  })

  it('initializes with the block and zeroed round state', () => {
    const timer = useAmrapTimer()

    timer.initialize(createAmrapBlock())

    expect(timer.block.value?.kind).toBe('amrap')
    expect(timer.rounds.value).toBe(0)
    expect(timer.currentExerciseIndex.value).toBe(0)
    expect(timer.isIdle.value).toBe(true)
  })

  it('counts down remaining seconds while running', async () => {
    const timer = useAmrapTimer()
    timer.initialize(createAmrapBlock({ durationSeconds: 60 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(10_000)

    expect(timer.remainingSeconds.value).toBe(50)
    expect(timer.formattedRemaining.value).toBe('0:50')
  })

  it('tracks rounds via incrementRound', () => {
    const timer = useAmrapTimer()
    timer.initialize(createAmrapBlock())

    timer.incrementRound()
    timer.incrementRound()

    expect(timer.rounds.value).toBe(2)
    expect(timer.currentExerciseIndex.value).toBe(0)
  })

  it('auto-completes when the duration is reached and fires onComplete once', async () => {
    const onComplete = vi.fn()
    const timer = useAmrapTimer({ onComplete })
    timer.initialize(createAmrapBlock({ durationSeconds: 5 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(6000)

    expect(timer.isCompleted.value).toBe(true)
    expect(timer.progress.value).toBe(100)
    expect(onComplete).toHaveBeenCalledTimes(1)
  })

  it('returns the AMRAP result payload from complete()', async () => {
    const timer = useAmrapTimer()
    timer.initialize(createAmrapBlock({ durationSeconds: 60 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(10_000)
    timer.incrementRound()

    const result = timer.complete()

    expect(result).toEqual({ rounds: 1, partialReps: 0, actualDuration: 10 })
  })

  it('reset restores the initial state for the same block', async () => {
    const timer = useAmrapTimer()
    timer.initialize(createAmrapBlock())

    timer.start()
    await vi.advanceTimersByTimeAsync(5000)
    timer.incrementRound()
    timer.reset()

    expect(timer.rounds.value).toBe(0)
    expect(timer.elapsedSeconds.value).toBe(0)
    expect(timer.isIdle.value).toBe(true)
  })

  it('supports pause and resume through the Pausable surface', async () => {
    const timer = useAmrapTimer()
    timer.initialize(createAmrapBlock())

    timer.start()
    await vi.advanceTimersByTimeAsync(3000)
    timer.pause()
    expect(timer.isActive.value).toBe(false)
    await vi.advanceTimersByTimeAsync(10_000)

    timer.resume()
    await vi.advanceTimersByTimeAsync(2000)

    expect(timer.elapsedSeconds.value).toBe(5)
    expect(timer.isActive.value).toBe(true)
  })
})
