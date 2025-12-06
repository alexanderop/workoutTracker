import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBaseTimer } from '@/composables/timers/useBaseTimer'

describe('useBaseTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
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
      const { isRunning, isPaused, isCompleted, isIdle } = useBaseTimer()

      expect(isIdle.value).toBe(true)
      expect(isRunning.value).toBe(false)
      expect(isPaused.value).toBe(false)
      expect(isCompleted.value).toBe(false)
    })
  })

  describe('start()', () => {
    it('transitions from idle to running', () => {
      const { start, status, isRunning } = useBaseTimer()

      start()

      expect(status.value).toBe('running')
      expect(isRunning.value).toBe(true)
    })

    it('updates elapsed time while running', () => {
      const { start, elapsedMs, elapsedSeconds } = useBaseTimer()

      start()
      vi.advanceTimersByTime(2500)

      expect(elapsedMs.value).toBeGreaterThanOrEqual(2500)
      expect(elapsedSeconds.value).toBe(2)
    })

    it('does not restart if already running', () => {
      const { start, elapsedMs } = useBaseTimer()

      start()
      vi.advanceTimersByTime(1000)

      start() // Should have no effect
      vi.advanceTimersByTime(1000)

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
      const { start, pause, status, isPaused } = useBaseTimer()

      start()
      pause()

      expect(status.value).toBe('paused')
      expect(isPaused.value).toBe(true)
    })

    it('stops elapsed time from incrementing', () => {
      const { start, pause, elapsedMs } = useBaseTimer()

      start()
      vi.advanceTimersByTime(1000)
      pause()
      const elapsedAtPause = elapsedMs.value

      vi.advanceTimersByTime(5000)

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

  describe('resume from pause', () => {
    it('transitions from paused to running on start()', () => {
      const { start, pause, status, isRunning } = useBaseTimer()

      start()
      pause()
      start()

      expect(status.value).toBe('running')
      expect(isRunning.value).toBe(true)
    })

    it('continues counting from paused elapsed time', () => {
      const { start, pause, elapsedSeconds } = useBaseTimer()

      start()
      vi.advanceTimersByTime(3000)
      pause()
      vi.advanceTimersByTime(10000) // Pause for 10 seconds
      start() // Resume
      vi.advanceTimersByTime(2000)

      // Should be ~5 seconds (3 + 2), not 15
      expect(elapsedSeconds.value).toBe(5)
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

    it('resets elapsed time to zero', () => {
      const { start, resetState, elapsedMs, elapsedSeconds } = useBaseTimer()

      start()
      vi.advanceTimersByTime(5000)
      resetState()

      expect(elapsedMs.value).toBe(0)
      expect(elapsedSeconds.value).toBe(0)
    })

    it('stops the interval', () => {
      const { start, resetState, elapsedMs } = useBaseTimer()

      start()
      vi.advanceTimersByTime(1000)
      resetState()
      vi.advanceTimersByTime(5000)

      expect(elapsedMs.value).toBe(0)
    })

    it('allows starting again after reset', () => {
      const { start, resetState, isRunning, elapsedSeconds } = useBaseTimer()

      start()
      vi.advanceTimersByTime(3000)
      resetState()
      start()
      vi.advanceTimersByTime(1000)

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

    it('stops the interval', () => {
      const { start, complete, elapsedMs } = useBaseTimer()

      start()
      vi.advanceTimersByTime(1000)
      complete()
      const elapsedAtComplete = elapsedMs.value

      vi.advanceTimersByTime(5000)

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
    it('calls onTick on each interval tick', () => {
      const onTick = vi.fn()
      const { start } = useBaseTimer({ onTick })

      start()
      vi.advanceTimersByTime(300) // 3 ticks at 100ms interval

      expect(onTick).toHaveBeenCalledTimes(3)
    })

    it('does not call onTick when paused', () => {
      const onTick = vi.fn()
      const { start, pause } = useBaseTimer({ onTick })

      start()
      vi.advanceTimersByTime(100)
      pause()
      onTick.mockClear()
      vi.advanceTimersByTime(500)

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
    it('respects custom tickInterval', () => {
      const onTick = vi.fn()
      const { start } = useBaseTimer({ onTick, tickInterval: 50 })

      start()
      vi.advanceTimersByTime(200) // 4 ticks at 50ms interval

      expect(onTick).toHaveBeenCalledTimes(4)
    })
  })
})
