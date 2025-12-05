import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useRestTimer } from '@/composables/timers/useRestTimer'

describe('useRestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('initial state', () => {
    it('starts with zero elapsed seconds', () => {
      const { elapsedSeconds } = useRestTimer()
      expect(elapsedSeconds.value).toBe(0)
    })

    it('starts in stopped state', () => {
      const { isRunning } = useRestTimer()
      expect(isRunning.value).toBe(false)
    })

    it('displays formatted time as 0:00', () => {
      const { formattedTime } = useRestTimer()
      expect(formattedTime.value).toBe('0:00')
    })
  })

  describe('start', () => {
    it('resets elapsed time to zero and begins counting', () => {
      const { start, elapsedSeconds, isRunning } = useRestTimer()

      start()

      expect(elapsedSeconds.value).toBe(0)
      expect(isRunning.value).toBe(true)
    })

    it('resets elapsed time when started again', () => {
      const { start, elapsedSeconds } = useRestTimer()

      start()
      vi.advanceTimersByTime(5000)
      expect(elapsedSeconds.value).toBe(5)

      start()
      expect(elapsedSeconds.value).toBe(0)
    })
  })

  describe('counting behavior', () => {
    it('increments elapsed seconds every second while running', () => {
      const { start, elapsedSeconds } = useRestTimer()

      start()

      vi.advanceTimersByTime(1000)
      expect(elapsedSeconds.value).toBe(1)

      vi.advanceTimersByTime(1000)
      expect(elapsedSeconds.value).toBe(2)

      vi.advanceTimersByTime(3000)
      expect(elapsedSeconds.value).toBe(5)
    })

    it('updates formatted time as seconds increase', () => {
      const { start, formattedTime } = useRestTimer()

      start()

      vi.advanceTimersByTime(65000) // 65 seconds = 1:05
      expect(formattedTime.value).toBe('1:05')

      vi.advanceTimersByTime(55000) // 120 seconds total = 2:00
      expect(formattedTime.value).toBe('2:00')
    })
  })

  describe('stop', () => {
    it('pauses the timer without resetting', () => {
      const { start, stop, elapsedSeconds, isRunning } = useRestTimer()

      start()
      vi.advanceTimersByTime(3000)
      stop()

      expect(elapsedSeconds.value).toBe(3)
      expect(isRunning.value).toBe(false)

      vi.advanceTimersByTime(2000)
      expect(elapsedSeconds.value).toBe(3) // Should not have changed
    })
  })

  describe('reset', () => {
    it('stops and resets elapsed time to zero', () => {
      const { start, reset, elapsedSeconds, isRunning } = useRestTimer()

      start()
      vi.advanceTimersByTime(5000)
      reset()

      expect(elapsedSeconds.value).toBe(0)
      expect(isRunning.value).toBe(false)
    })
  })

  describe('toggle', () => {
    it('starts timer when stopped', () => {
      const { toggle, isRunning } = useRestTimer()

      toggle()

      expect(isRunning.value).toBe(true)
    })

    it('pauses timer when running', () => {
      const { start, toggle, isRunning, elapsedSeconds } = useRestTimer()

      start()
      vi.advanceTimersByTime(2000)
      toggle()

      expect(isRunning.value).toBe(false)
      expect(elapsedSeconds.value).toBe(2)
    })

    it('resumes from paused position without reset', () => {
      const { start, toggle, elapsedSeconds, isRunning } = useRestTimer()

      start()
      vi.advanceTimersByTime(3000)
      toggle() // pause
      toggle() // resume

      expect(isRunning.value).toBe(true)
      expect(elapsedSeconds.value).toBe(3) // Should resume from where it paused

      vi.advanceTimersByTime(2000)
      expect(elapsedSeconds.value).toBe(5)
    })
  })

  describe('auto-stop at maximum time', () => {
    it('automatically stops at 5 minutes (300 seconds)', () => {
      const { start, elapsedSeconds, isRunning } = useRestTimer()

      start()
      vi.advanceTimersByTime(300_000) // 5 minutes

      expect(elapsedSeconds.value).toBe(300)
      expect(isRunning.value).toBe(false)
    })

    it('does not exceed maximum time', () => {
      const { start, elapsedSeconds } = useRestTimer()

      start()
      vi.advanceTimersByTime(360_000) // 6 minutes

      expect(elapsedSeconds.value).toBe(300) // Capped at max
    })
  })
})
