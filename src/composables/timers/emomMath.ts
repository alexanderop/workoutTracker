/**
 * Pure EMOM (Every Minute On the Minute) timer math.
 *
 * Extracted verbatim from `useEmomTimer` so the arithmetic can be
 * property-tested without Vue reactivity or fake timers. No Vue imports.
 */

/**
 * The 1-based minute an elapsed time falls into.
 *
 * `minuteForElapsed(0)` is 1 (the first minute), `minuteForElapsed(60)` is 2,
 * and so on: minute m covers elapsed seconds `[(m - 1) * 60, m * 60)`.
 *
 * @param elapsedSeconds Whole seconds elapsed since the block started.
 */
export function minuteForElapsed(elapsedSeconds: number): number {
  return Math.floor(elapsedSeconds / 60) + 1
}

/**
 * Seconds left in the currently running minute.
 *
 * For integer input this is always in `[1, 60]` — it never returns 0. At an
 * exact minute boundary (`elapsedSeconds % 60 === 0`) it returns 60 for the
 * minute that is just starting, so the countdown displays 60→1 rather than
 * 59→0.
 *
 * @param elapsedSeconds Whole seconds elapsed since the block started.
 */
export function secondsRemainingInMinute(elapsedSeconds: number): number {
  return 60 - (elapsedSeconds % 60)
}

/**
 * Seconds left until the whole EMOM block completes, clamped at 0.
 *
 * @param totalMinutes Configured number of EMOM minutes.
 * @param elapsedSeconds Whole seconds elapsed since the block started.
 */
export function emomRemainingSeconds(totalMinutes: number, elapsedSeconds: number): number {
  return Math.max(0, totalMinutes * 60 - elapsedSeconds)
}

/**
 * Block progress as a percentage in `[0, 100]`, clamped at 100.
 *
 * @param totalMinutes Configured number of EMOM minutes.
 * @param elapsedSeconds Whole seconds elapsed since the block started.
 */
export function emomProgress(totalMinutes: number, elapsedSeconds: number): number {
  return Math.min(100, (elapsedSeconds / (totalMinutes * 60)) * 100)
}
