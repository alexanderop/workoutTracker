import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBenchmarkGlobalTimer } from '@/composables/timers/useBenchmarkGlobalTimer'

describe('useBenchmarkGlobalTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    useBenchmarkGlobalTimer().reset()
  })

  afterEach(() => {
    useBenchmarkGlobalTimer().reset()
    vi.useRealTimers()
  })

  it('should be defined', () => {
    expect(useBenchmarkGlobalTimer).toBeDefined()
  })

  it('shares singleton state across callers', async () => {
    const first = useBenchmarkGlobalTimer()
    const second = useBenchmarkGlobalTimer()

    first.start()

    expect(second.isRunning.value).toBe(true)

    await vi.advanceTimersByTimeAsync(3000)

    expect(second.getPreciseElapsedSeconds()).toBe(3)
  })

  it('pause preserves elapsed time and toggle resumes', async () => {
    const timer = useBenchmarkGlobalTimer()

    timer.start()
    await vi.advanceTimersByTimeAsync(5000)
    timer.pause()

    expect(timer.isRunning.value).toBe(false)
    expect(timer.getPreciseElapsedSeconds()).toBe(5)

    timer.toggle()
    expect(timer.isRunning.value).toBe(true)
  })

  it('reset returns to 00:00', async () => {
    const timer = useBenchmarkGlobalTimer()

    timer.start()
    await vi.advanceTimersByTimeAsync(5000)
    timer.reset()

    expect(timer.isRunning.value).toBe(false)
    expect(timer.getStartedAt()).toBeNull()
    expect(timer.getPreciseElapsedSeconds()).toBe(0)
  })

  describe('initializeFromWorkout', () => {
    it('resumes from a valid stored timestamp', () => {
      const timer = useBenchmarkGlobalTimer()
      const tenSecondsAgo = Date.now() - 10_000

      timer.initializeFromWorkout(tenSecondsAgo)

      expect(timer.isRunning.value).toBe(true)
      expect(timer.getPreciseElapsedSeconds()).toBe(10)
    })

    it('falls back to the current time for a future timestamp', () => {
      const timer = useBenchmarkGlobalTimer()

      timer.initializeFromWorkout(Date.now() + 60_000)

      expect(timer.isRunning.value).toBe(true)
      expect(timer.getPreciseElapsedSeconds()).toBe(0)
    })

    it('ignores a timestamp before 2020', () => {
      const timer = useBenchmarkGlobalTimer()

      timer.initializeFromWorkout(946_684_800_000) // 2000-01-01

      expect(timer.isRunning.value).toBe(false)
      expect(timer.getStartedAt()).toBeNull()
    })

    it('ignores a null timestamp', () => {
      const timer = useBenchmarkGlobalTimer()

      timer.initializeFromWorkout(null)

      expect(timer.isRunning.value).toBe(false)
    })
  })
})
