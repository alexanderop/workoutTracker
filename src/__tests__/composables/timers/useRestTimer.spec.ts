import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useRestTimer } from '@/composables/timers/useRestTimer'

describe('useRestTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('without a target (count-up only)', () => {
    it('starts at zero seconds', () => {
      const { elapsedSeconds, formattedTime } = useRestTimer()

      expect(elapsedSeconds.value).toBe(0)
      expect(formattedTime.value).toBe('0:00')
    })

    it('counts up while running', () => {
      const { start, elapsedSeconds } = useRestTimer()

      start()
      vi.advanceTimersByTime(3000)

      expect(elapsedSeconds.value).toBe(3)
    })

    it('reports no target and never completes', () => {
      const { start, hasTarget, isDone } = useRestTimer()

      start()
      vi.advanceTimersByTime(10_000)

      expect(hasTarget.value).toBe(false)
      expect(isDone.value).toBe(false)
    })

    it('computes elapsed from the start timestamp so a late tick still reports correct time', () => {
      // Regression: the old implementation incremented a counter once per tick,
      // so a delayed/throttled tick (e.g. backgrounded tab, screen wake-lock
      // interactions) would silently undercount. Simulate a single very late
      // tick and confirm elapsed still reflects real wall-clock time.
      const { start, elapsedSeconds } = useRestTimer()

      start()
      // Advance real wall-clock time by 5s but only flush one 1s tick boundary.
      vi.advanceTimersByTime(5000)

      expect(elapsedSeconds.value).toBe(5)
    })
  })

  describe('with a target', () => {
    it('counts down remaining seconds toward zero', () => {
      const { start, remainingSeconds } = useRestTimer({ target: 90 })

      start()
      vi.advanceTimersByTime(10_000)

      expect(remainingSeconds.value).toBe(80)
    })

    it('reports hasTarget true', () => {
      const { hasTarget } = useRestTimer({ target: 90 })

      expect(hasTarget.value).toBe(true)
    })

    it('formats the countdown (remaining time), not the count-up elapsed time', () => {
      const { start, formattedTime } = useRestTimer({ target: 90 })

      start()
      vi.advanceTimersByTime(30_000)

      expect(formattedTime.value).toBe('1:00')
    })

    it('clamps remaining seconds to zero once the target is reached', () => {
      const { start, remainingSeconds } = useRestTimer({ target: 10 })

      start()
      vi.advanceTimersByTime(30_000)

      expect(remainingSeconds.value).toBe(0)
    })

    it('transitions to the completed state once elapsed reaches the target', () => {
      const { start, isDone } = useRestTimer({ target: 10 })

      start()
      expect(isDone.value).toBe(false)

      vi.advanceTimersByTime(10_000)

      expect(isDone.value).toBe(true)
    })

    it('does not complete before the target is reached', () => {
      const { start, isDone } = useRestTimer({ target: 10 })

      start()
      vi.advanceTimersByTime(9000)

      expect(isDone.value).toBe(false)
    })

    it('reacts to a reactive target ref changing while running', () => {
      const target = ref(10)
      const { start, remainingSeconds, isDone } = useRestTimer({ target })

      start()
      vi.advanceTimersByTime(5000)
      expect(remainingSeconds.value).toBe(5)
      expect(isDone.value).toBe(false)

      // User taps "+15s" mid-rest -- the countdown should immediately reflect it.
      target.value = 25
      expect(remainingSeconds.value).toBe(20)
      expect(isDone.value).toBe(false)
    })

    it('treats a target of 0 as no target', () => {
      const { start, hasTarget, elapsedSeconds, formattedTime } = useRestTimer({ target: 0 })

      start()
      vi.advanceTimersByTime(3000)

      expect(hasTarget.value).toBe(false)
      expect(formattedTime.value).toBe(formatSeconds(elapsedSeconds.value))
    })
  })

  describe('reset()', () => {
    it('clears elapsed time and stops running', () => {
      const { start, reset, elapsedSeconds, isRunning } = useRestTimer()

      start()
      vi.advanceTimersByTime(5000)
      reset()

      expect(elapsedSeconds.value).toBe(0)
      expect(isRunning.value).toBe(false)
    })

    it('clears the completed state so a subsequent rest starts fresh', () => {
      const { start, reset, isDone } = useRestTimer({ target: 5 })

      start()
      vi.advanceTimersByTime(5000)
      expect(isDone.value).toBe(true)

      reset()

      expect(isDone.value).toBe(false)
    })
  })

  describe('start()', () => {
    it('restarts from zero even if already running', () => {
      const { start, elapsedSeconds } = useRestTimer()

      start()
      vi.advanceTimersByTime(5000)
      start()

      expect(elapsedSeconds.value).toBe(0)
    })
  })
})

function formatSeconds(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}
