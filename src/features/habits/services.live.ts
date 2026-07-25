/**
 * Habits pilot — Live Layer (ADR 003: brain/decisions/003-effect-style-di.md).
 *
 * Browser tiers only: `getRepositoryProvider` transitively imports `@/db`,
 * which constructs the Dexie singleton at import time, so this module must
 * never be reachable from a Node `unit` spec (enforced by
 * `src/__tests__/architecture/unitTierImports.test.ts`).
 *
 * During the pilot the runtime wraps the existing `RepositoryProvider` seam
 * rather than replacing it — `db/provider.ts`, `main.ts`, and
 * `providerUnderTest.ts` stay untouched (D6).
 */
import { onScopeDispose } from 'vue'
import { getRepositoryProvider } from '@/db/provider'
import type { HabitRepository } from '@/db/interfaces'
import type { Context } from '@/lib/di/context'
import { sync } from '@/lib/di/layer'
import { makeRuntimeOf } from '@/lib/di/runtime'
import { HabitRepo } from './services'

// Not exported: `useServices()` below is its only consumer, and `pnpm knip`
// (a required CI gate) fails on an unused export. Export it when a second
// consumer — or a real Layer-composition site — actually exists.
const HabitRepoLive = sync(HabitRepo, () => getRepositoryProvider().habits)

/**
 * Builds a *fresh* runtime on every call — do not memoize the runtime, the
 * context, or the resolved repository at module scope.
 *
 * Why: `resetDatabase()` (run before/after every one of the 98 integration
 * specs) calls `installProviderUnderTest()`, which installs a brand new
 * `RepositoryProvider` object via `setRepositoryProvider(...)`. A module-level
 * memo here would capture a stale provider from a previous test and silently
 * break the characterization baseline: every *new* `useHabits()` call after a
 * reset must resolve the current provider.
 *
 * Residual difference from the old `getHabitsRepository()`-per-method shape:
 * `useHabits` now resolves `HabitRepo` once, at composable construction, and
 * keeps that repository for its lifetime — it does not re-resolve on every
 * method call. A provider swap while a `useHabits` instance stays mounted is
 * therefore not picked up by that instance. This is accepted today because
 * `installProviderUnderTest()` always rebuilds over the same Dexie module
 * singleton (`src/db/implementations/dexie/index.ts`), so a "stale" habits
 * repository is a stateless wrapper over the same live database and behaves
 * identically; it would only become observable if a future provider swap
 * installed a genuinely different backend under a still-mounted consumer.
 */
export function useServices(): Context<HabitRepository> {
  const runtime = makeRuntimeOf(HabitRepoLive)
  // Keeps `Scope` reachable so its finalizers run instead of leaking. A no-op
  // today: `HabitRepoLive` is `sync` and registers no finalizer, so
  // `runtime.dispose()` closes an empty scope — that's exactly why this is
  // behaviour-preserving. If `HabitRepoLive` ever becomes `scoped(...)`, this
  // is what actually releases it. `failSilently: true` because `useServices()`
  // is also called outside any effect scope (e.g. directly from a spec), where
  // there is nothing to attach disposal to and Vue would otherwise warn.
  onScopeDispose(() => runtime.dispose(), true)
  return runtime.context
}
