/**
 * The ambient time capability, threaded through a DI context instead of
 * called directly. Mirrors Effect's `Clock` / `TestClock` vocabulary.
 *
 * Imports `generateId` from `@/db/generateId` — the zero-import deep path,
 * never the `@/db` barrel. The barrel constructs Dexie at import time, which
 * would make this module unimportable from the Node unit tier.
 */
import { generateId } from '@/db/generateId'
import { Reference } from './di/tag'

export type Clock = { now(): number; sleep(ms: number): Promise<void> }

export const systemClock: Clock = {
  now: () => Date.now(),
  sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
}

/** A Reference, not a Tag — readable from any context, which is what makes it
 *  a default service without breaking layer 1's union constraint (D7). */
export const Clock = Reference<Clock>('Clock', () => systemClock)

export const IdGen = Reference<() => string>('IdGen', () => generateId)

// The `testClock` test double lives in `src/__tests__/fakes/clock.ts` — it has
// no production caller, so it stays out of `src/**` and out of the coverage
// denominator.
