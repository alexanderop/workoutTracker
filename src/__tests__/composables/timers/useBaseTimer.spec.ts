import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope } from 'vue'
import { useBaseTimer } from '@/composables/timers/useBaseTimer'

describe('useBaseTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should be defined', () => {
    expect(useBaseTimer).toBeDefined()
  })

  describe('initial state', () => {
    it('starts in idle state', () => {
      const { status, isIdle } = useBaseTimer()

      expect(status.value).toBe('idle')
      expect(isIdle.value).toBe(true)
    })

    it('starts with zero elapsed time', () => {
      const { elapsedMs, elapsedSeconds } = useBaseTimer()

      expect(elapsedMs.value).toBe(0)
      expect(elapsedSeconds.value).toBe(0)
    })

    it('has all status flags false except isIdle', () => {
      const { isRunning, isPaused, isCompleted, isIdle, isActive } = useBaseTimer()

      expect(isIdle.value).toBe(true)
      expect(isRunning.value).toBe(false)
      expect(isPaused.value).toBe(false)
      expect(isCompleted.value).toBe(false)
      expect(isActive.value).toBe(false)
    })
  })

  describe('start()', () => {
    it('transitions from idle to running', () => {
      const { start, status, isRunning, isActive } = useBaseTimer()

      start()

      expect(status.value).toBe('running')
      expect(isRunning.value).toBe(true)
      expect(isActive.value).toBe(true)
    })

    it('updates elapsed time while running', async () => {
      const { start, elapsedMs, elapsedSeconds } = useBaseTimer()

      start()
      await vi.advanceTimersByTimeAsync(2500)

      expect(elapsedMs.value).toBeGreaterThanOrEqual(2500)
      expect(elapsedSeconds.value).toBe(2)
    })

    it('does not restart if already running', async () => {
      const { start, elapsedMs } = useBaseTimer()

      start()
      await vi.advanceTimersByTimeAsync(1000)

      start() // Should have no effect
      await vi.advanceTimersByTimeAsync(1000)

      // Should continue counting, not restart from 0
      // After 2 seconds total, elapsed should be ~2000ms, not ~1000ms
      expect(elapsedMs.value).toBeGreaterThanOrEqual(2000)
      expect(elapsedMs.value).toBeLessThan(3000)
    })

    it('does not start if already completed', () => {
      const { start, complete, status } = useBaseTimer()

      start()
      complete()
      start()

      expect(status.value).toBe('completed')
    })
  })

  describe('pause()', () => {
    it('transitions from running to paused', () => {
      const { start, pause, status, isPaused, isActive } = useBaseTimer()

      start()
      pause()

      expect(status.value).toBe('paused')
      expect(isPaused.value).toBe(true)
      expect(isActive.value).toBe(false)
    })

    it('stops elapsed time from incrementing', async () => {
      const { start, pause, elapsedMs } = useBaseTimer()

      start()
      await vi.advanceTimersByTimeAsync(1000)
      pause()
      const elapsedAtPause = elapsedMs.value

      await vi.advanceTimersByTimeAsync(5000)

      expect(elapsedMs.value).toBe(elapsedAtPause)
    })

    it('does nothing when idle', () => {
      const { pause, status } = useBaseTimer()

      pause()

      expect(status.value).toBe('idle')
    })

    it('does nothing when already paused', () => {
      const { start, pause, status } = useBaseTimer()

      start()
      pause()
      pause()

      expect(status.value).toBe('paused')
    })
  })

  describe('resume()', () => {
    it('transitions from paused to running', () => {
      const { start, pause, resume, status, isRunning } = useBaseTimer()

      start()
      pause()
      resume()

      expect(status.value).toBe('running')
      expect(isRunning.value).toBe(true)
    })

    it('continues counting from paused elapsed time', async () => {
      const { start, pause, resume, elapsedSeconds } = useBaseTimer()

      start()
      await vi.advanceTimersByTimeAsync(3000)
      pause()
      await vi.advanceTimersByTimeAsync(10_000) // Pause for 10 seconds
      resume()
      await vi.advanceTimersByTimeAsync(2000)

      // Should be ~5 seconds (3 + 2), not 15
      expect(elapsedSeconds.value).toBe(5)
    })

    it('does nothing when idle', () => {
      const { resume, status } = useBaseTimer()

      resume()

      expect(status.value).toBe('idle')
    })

    it('is also reachable through start()', () => {
      const { start, pause, status, isRunning } = useBaseTimer()

      start()
      pause()
      start()

      expect(status.value).toBe('running')
      expect(isRunning.value).toBe(true)
    })
  })

  describe('toggle()', () => {
    it('starts timer when idle', () => {
      const { toggle, isRunning } = useBaseTimer()

      toggle()

      expect(isRunning.value).toBe(true)
    })

    it('pauses timer when running', () => {
      const { toggle, isPaused } = useBaseTimer()

      toggle() // Start
      toggle() // Pause

      expect(isPaused.value).toBe(true)
    })

    it('resumes timer when paused', () => {
      const { toggle, isRunning } = useBaseTimer()

      toggle() // Start
      toggle() // Pause
      toggle() // Resume

      expect(isRunning.value).toBe(true)
    })

    it('does nothing when completed', () => {
      const { toggle, complete, isCompleted } = useBaseTimer()

      toggle()
      complete()
      toggle()

      expect(isCompleted.value).toBe(true)
    })
  })

  describe('resetState()', () => {
    it('transitions to idle state', () => {
      const { start, resetState, status, isIdle } = useBaseTimer()

      start()
      resetState()

      expect(status.value).toBe('idle')
      expect(isIdle.value).toBe(true)
    })

    it('resets elapsed time to zero', async () => {
      const { start, resetState, elapsedMs, elapsedSeconds } = useBaseTimer()

      start()
      await vi.advanceTimersByTimeAsync(5000)
      resetState()

      expect(elapsedMs.value).toBe(0)
      expect(elapsedSeconds.value).toBe(0)
    })

    it('stops the interval', async () => {
      const { start, resetState, elapsedMs } = useBaseTimer()

      start()
      await vi.advanceTimersByTimeAsync(1000)
      resetState()
      await vi.advanceTimersByTimeAsync(5000)

      expect(elapsedMs.value).toBe(0)
    })

    it('allows starting again after reset', async () => {
      const { start, resetState, isRunning, elapsedSeconds } = useBaseTimer()

      start()
      await vi.advanceTimersByTimeAsync(3000)
      resetState()
      start()
      await vi.advanceTimersByTimeAsync(1000)

      expect(isRunning.value).toBe(true)
      expect(elapsedSeconds.value).toBe(1)
    })
  })

  describe('complete()', () => {
    it('transitions to completed state', () => {
      const { start, complete, status, isCompleted } = useBaseTimer()

      start()
      complete()

      expect(status.value).toBe('completed')
      expect(isCompleted.value).toBe(true)
    })

    it('stops the interval', async () => {
      const { start, complete, elapsedMs } = useBaseTimer()

      start()
      await vi.advanceTimersByTimeAsync(1000)
      complete()
      const elapsedAtComplete = elapsedMs.value

      await vi.advanceTimersByTimeAsync(5000)

      expect(elapsedMs.value).toBe(elapsedAtComplete)
    })

    it('returns false on first completion', () => {
      const { start, complete } = useBaseTimer()

      start()
      const wasAlreadyCompleted = complete()

      expect(wasAlreadyCompleted).toBe(false)
    })

    it('returns true on subsequent completions', () => {
      const { start, complete } = useBaseTimer()

      start()
      complete()
      const wasAlreadyCompleted = complete()

      expect(wasAlreadyCompleted).toBe(true)
    })
  })

  describe('onTick callback', () => {
    it('calls onTick on each interval tick', async () => {
      const onTick = vi.fn()
      const { start } = useBaseTimer({ onTick })

      start()
      await vi.advanceTimersByTimeAsync(300) // 3 ticks at 100ms interval

      expect(onTick).toHaveBeenCalledTimes(3)
    })

    it('does not call onTick when paused', async () => {
      const onTick = vi.fn()
      const { start, pause } = useBaseTimer({ onTick })

      start()
      await vi.advanceTimersByTimeAsync(100)
      pause()
      onTick.mockClear()
      await vi.advanceTimersByTimeAsync(500)

      expect(onTick).not.toHaveBeenCalled()
    })
  })

  describe('onComplete callback', () => {
    it('calls onComplete when completing for the first time', () => {
      const onComplete = vi.fn()
      const { start, complete } = useBaseTimer({ onComplete })

      start()
      complete()

      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('does not call onComplete on subsequent completions', () => {
      const onComplete = vi.fn()
      const { start, complete } = useBaseTimer({ onComplete })

      start()
      complete()
      complete()
      complete()

      expect(onComplete).toHaveBeenCalledTimes(1)
    })
  })

  describe('custom tick interval', () => {
    it('respects custom tickInterval', async () => {
      const onTick = vi.fn()
      const { start } = useBaseTimer({ onTick, tickInterval: 50 })

      start()
      await vi.advanceTimersByTimeAsync(200) // 4 ticks at 50ms interval

      expect(onTick).toHaveBeenCalledTimes(4)
    })
  })

  describe('scope cleanup', () => {
    it('stops ticking when the owning effect scope is disposed', async () => {
      const onTick = vi.fn()
      const scope = effectScope()

      scope.run(() => {
        const { start } = useBaseTimer({ onTick })
        start()
      })
      await vi.advanceTimersByTimeAsync(300)
      expect(onTick).toHaveBeenCalledTimes(3)

      scope.stop()
      onTick.mockClear()
      await vi.advanceTimersByTimeAsync(500)

      expect(onTick).not.toHaveBeenCalled()
    })
  })
})
