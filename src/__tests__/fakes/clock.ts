/**
 * Virtual-time `Clock` test double — mirrors Effect's `TestClock.adjust` /
 * `setTime`. Never uses real timers: `sleep` schedules a resolution at a
 * virtual instant, and `adjust`/`setTime` resolve everything scheduled at or
 * before the new time, in scheduled-time order.
 *
 * Lives here rather than in `src/lib/clock.ts` (where C3 originally put it):
 * it is a test double with no production caller, and every other double in
 * this repo lives under `src/__tests__/`. Keeping it out of `src/**` also
 * keeps it out of the enforced coverage denominator, which only the browser
 * tiers feed. Node-safe — `import type` only, so unit specs may import it.
 */
import type { Clock } from '@/lib/clock'

export type TestClock = Clock & {
  /** Advance by `ms` and run everything scheduled at or before the new time. */
  adjust(ms: number): void
  /** Jump to an absolute time and run everything scheduled at or before it. */
  setTime(ms: number): void
}

type PendingSleep = { at: number; resolve: () => void }

export function testClock(startMs: number): TestClock {
  let current = startMs
  let pending: Array<PendingSleep> = []

  function resolveDue(newTime: number): void {
    const due = pending.filter((sleep) => sleep.at <= newTime)
    due.sort((a, b) => a.at - b.at)
    pending = pending.filter((sleep) => sleep.at > newTime)
    for (const sleep of due) sleep.resolve()
  }

  return {
    now: () => current,
    sleep: (ms) =>
      new Promise((resolve) => {
        const at = current + ms
        const alreadyDue = at <= current
        if (alreadyDue) {
          resolve()
          return
        }
        pending.push({ at, resolve })
      }),
    adjust(ms) {
      current += ms
      resolveDue(current)
    },
    setTime(ms) {
      current = ms
      resolveDue(current)
    },
  }
}
