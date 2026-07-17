import { describe, expect, it } from 'vitest'
import fc from 'fast-check'
import {
  emomProgress,
  emomRemainingSeconds,
  minuteForElapsed,
  secondsRemainingInMinute,
} from '@/lib/emomMath'

/**
 * Property-based tests for the pure EMOM timer math extracted from
 * `useEmomTimer`.
 *
 * NOTE on `secondsRemainingInMinute`: for integer elapsed it is always in
 * [1, 60] and NEVER returns 0. At an exact minute boundary
 * (elapsed % 60 === 0) it returns 60 — correct for the minute that is just
 * starting, but it means the per-minute countdown displays 60→1 rather than
 * 59→0. This is current intended-ish behavior (scout-flagged); these tests
 * pin it, they do not change it.
 */

const elapsedArb = fc.integer({ min: 0, max: 7200 })
const totalMinutesArb = fc.integer({ min: 1, max: 60 })

function minutesToSeconds(minutes: number): number {
  return minutes * 60
}

const minuteBoundaryArb = fc.integer({ min: 0, max: 120 }).map(minutesToSeconds)

describe('emomMath (property-based)', () => {
  describe('secondsRemainingInMinute', () => {
    it('stays in [1, 60] for integer elapsed — it never reaches 0', () => {
      fc.assert(
        fc.property(elapsedArb, (elapsed) => {
          const remaining = secondsRemainingInMinute(elapsed)
          expect(remaining).toBeGreaterThanOrEqual(1)
          expect(remaining).toBeLessThanOrEqual(60)
        }),
      )
    })

    it('returns 60 at exact minute boundaries (countdown displays 60→1)', () => {
      fc.assert(
        fc.property(minuteBoundaryArb, (elapsed) => {
          expect(secondsRemainingInMinute(elapsed)).toBe(60)
        }),
      )
    })
  })

  describe('minuteForElapsed', () => {
    it('starts at minute 1 with zero elapsed', () => {
      expect(minuteForElapsed(0)).toBe(1)
    })

    it('brackets elapsed into its minute window: (m-1)*60 <= elapsed < m*60', () => {
      fc.assert(
        fc.property(elapsedArb, (elapsed) => {
          const minute = minuteForElapsed(elapsed)
          expect((minute - 1) * 60).toBeLessThanOrEqual(elapsed)
          expect(elapsed).toBeLessThan(minute * 60)
        }),
      )
    })

    it('is non-decreasing in elapsed', () => {
      fc.assert(
        fc.property(elapsedArb, elapsedArb, (a, b) => {
          const [earlier, later] = a <= b ? [a, b] : [b, a]
          expect(minuteForElapsed(earlier)).toBeLessThanOrEqual(minuteForElapsed(later))
        }),
      )
    })

    it('stays within [1, totalMinutes] while the block is still running', () => {
      fc.assert(
        fc.property(totalMinutesArb, elapsedArb, (totalMinutes, elapsed) => {
          fc.pre(elapsed < totalMinutes * 60)
          const minute = minuteForElapsed(elapsed)
          expect(minute).toBeGreaterThanOrEqual(1)
          expect(minute).toBeLessThanOrEqual(totalMinutes)
        }),
      )
    })
  })

  describe('emomRemainingSeconds and emomProgress', () => {
    it('remaining is 0 iff elapsed reached the total; progress is 100 iff done', () => {
      fc.assert(
        fc.property(totalMinutesArb, elapsedArb, (totalMinutes, elapsed) => {
          const totalSeconds = totalMinutes * 60
          const remaining = emomRemainingSeconds(totalMinutes, elapsed)
          const progress = emomProgress(totalMinutes, elapsed)
          expect(progress).toBeGreaterThanOrEqual(0)
          expect(progress).toBeLessThanOrEqual(100)
          if (elapsed >= totalSeconds) {
            expect(remaining).toBe(0)
            expect(progress).toBe(100)
            return
          }
          expect(remaining).toBeGreaterThan(0)
          expect(progress).toBeLessThan(100)
        }),
      )
    })

    it('remaining is non-increasing and progress non-decreasing in elapsed', () => {
      fc.assert(
        fc.property(totalMinutesArb, elapsedArb, elapsedArb, (totalMinutes, a, b) => {
          const [earlier, later] = a <= b ? [a, b] : [b, a]
          const remainingEarlier = emomRemainingSeconds(totalMinutes, earlier)
          const remainingLater = emomRemainingSeconds(totalMinutes, later)
          expect(remainingLater).toBeLessThanOrEqual(remainingEarlier)
          const progressEarlier = emomProgress(totalMinutes, earlier)
          const progressLater = emomProgress(totalMinutes, later)
          expect(progressLater).toBeGreaterThanOrEqual(progressEarlier)
        }),
      )
    })

    it('remaining and elapsed sum to the total while the block is running', () => {
      fc.assert(
        fc.property(totalMinutesArb, elapsedArb, (totalMinutes, elapsed) => {
          fc.pre(elapsed <= totalMinutes * 60)
          expect(emomRemainingSeconds(totalMinutes, elapsed) + elapsed).toBe(totalMinutes * 60)
        }),
      )
    })
  })
})
