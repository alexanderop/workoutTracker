import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useTabataTimer } from '@/blocks/tabata/useTabataTimer'
import { createTabataWorkoutBlock } from '@/blocks'
import type { TabataBlock } from '@/blocks'

function createTabataBlock(config: Partial<TabataBlock['config']> = {}): TabataBlock {
  return createTabataWorkoutBlock(
    { rounds: 2, workSeconds: 20, restSeconds: 10, ...config },
    { id: 'ex-1', name: 'Mountain Climbers', prescribedReps: 0, load: null, image: null },
    1,
  )
}

describe('useTabataTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be defined', () => {
    expect(useTabataTimer).toBeDefined()
  })

  it('initializes in the work phase of round one', () => {
    const timer = useTabataTimer()

    timer.initialize(createTabataBlock())

    expect(timer.currentRound.value).toBe(1)
    expect(timer.currentPhase.value).toBe('work')
    expect(timer.repsPerRound.value).toEqual([])
  })

  it('flips to the rest phase when the work window ends', async () => {
    const onPhaseChange = vi.fn()
    const timer = useTabataTimer({ onPhaseChange })
    timer.initialize(createTabataBlock({ workSeconds: 20, restSeconds: 10 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(20_000)

    expect(timer.currentPhase.value).toBe('rest')
    expect(onPhaseChange).toHaveBeenCalledWith('rest')
  })

  it('advances to the next round after work plus rest', async () => {
    const onRoundChange = vi.fn()
    const timer = useTabataTimer({ onRoundChange })
    timer.initialize(createTabataBlock({ rounds: 2, workSeconds: 20, restSeconds: 10 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(30_000)

    expect(timer.currentRound.value).toBe(2)
    expect(onRoundChange).toHaveBeenCalledWith(2)
    expect(timer.currentPhase.value).toBe('work')
  })

  it('counts down seconds within the current phase', async () => {
    const timer = useTabataTimer()
    timer.initialize(createTabataBlock({ workSeconds: 20, restSeconds: 10 }))

    timer.start()
    await vi.advanceTimersByTimeAsync(5000)

    expect(timer.secondsInCurrentPhase.value).toBe(15)
  })

  it('records reps for the current round', async () => {
    const timer = useTabataTimer()
    timer.initialize(createTabataBlock({ rounds: 2, workSeconds: 20, restSeconds: 10 }))

    timer.start()
    timer.recordReps(12)
    await vi.advanceTimersByTimeAsync(30_000)
    timer.recordReps(9)

    expect(timer.repsPerRound.value).toEqual([12, 9])
  })

  it('auto-completes after all rounds and reports repsPerRound', async () => {
    const onComplete = vi.fn()
    const timer = useTabataTimer({ onComplete })
    timer.initialize(createTabataBlock({ rounds: 2, workSeconds: 20, restSeconds: 10 }))

    timer.start()
    timer.recordReps(10)
    await vi.advanceTimersByTimeAsync(60_000)

    expect(timer.isCompleted.value).toBe(true)
    expect(onComplete).toHaveBeenCalledTimes(1)

    const result = timer.complete()
    expect(result).toEqual({ repsPerRound: [10] })
  })

  it('supports pause and resume through the Pausable surface', async () => {
    const timer = useTabataTimer()
    timer.initialize(createTabataBlock())

    timer.start()
    await vi.advanceTimersByTimeAsync(10_000)
    timer.pause()
    await vi.advanceTimersByTimeAsync(30_000)
    timer.resume()
    await vi.advanceTimersByTimeAsync(5000)

    expect(timer.elapsedSeconds.value).toBe(15)
    expect(timer.currentPhase.value).toBe('work')
  })
})
