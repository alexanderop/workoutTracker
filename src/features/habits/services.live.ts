/**
 * Habits pilot — Live Layer (ADR 003: brain/decisions/003-effect-style-di.md,
 * ADR 004: brain/decisions/004-db-in-di.md).
 *
 * Browser tiers only: `HabitRepoLive` reads `Repositories` out of the context
 * rather than importing `@/db` or `@/db/provider` directly — but the module
 * that supplies that service (`@/db/services.live`) still transitively
 * imports `./implementations/dexie/database`, which constructs the Dexie
 * singleton at import time, so this module must never be reachable from a
 * Node `unit` spec (enforced by
 * `src/__tests__/architecture/unitTierImports.test.ts`).
 *
 * `ctx.unsafeGet` (not `ctx.get`) is used because `buildAll` hands each layer
 * an erased `Context`, so the `Services` union is not available at
 * layer-build time; the ordering contract — `RepositoriesLive` must precede
 * `HabitRepoLive` in the app's layer array — is what actually guarantees
 * resolution, and getting it wrong throws `Service not found: Repositories`
 * at build time.
 */
import { Repositories } from '@/db/services'
import { sync } from '@/lib/di/layer'
import { HabitRepo, HabitViewModeStore } from './services'

export const HabitRepoLive = sync(HabitRepo, (ctx) => ctx.unsafeGet(Repositories).habits)

export const HabitViewModeStoreLive = sync(HabitViewModeStore, (ctx) => {
  const settings = ctx.unsafeGet(Repositories).settings
  return {
    get: () => settings.get('habitViewMode'),
    set: (mode) => settings.set({ key: 'habitViewMode', value: mode }),
  }
})
