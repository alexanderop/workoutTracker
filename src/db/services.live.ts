/**
 * `Db` in DI (ADR 004: brain/decisions/004-db-in-di.md) — Live Layer.
 *
 * Browser tiers only: `createDexieRepositoryProvider` transitively imports
 * `./implementations/dexie/database`, which constructs the Dexie singleton at
 * import time, so this module must never be reachable from a Node `unit`
 * spec (enforced by `src/__tests__/architecture/unitTierImports.test.ts`).
 *
 * ## Why `release` closes `db`, not the provider
 *
 * A `RepositoryProvider` is not itself a resource — `createDexieRepositoryProvider()`
 * only wraps the `db` module singleton exported from `./implementations/dexie/database`;
 * it opens nothing of its own. The genuine acquire/release pair behind this
 * Layer is that Dexie connection, so `release` closes it directly
 * (`db.close()`) rather than doing anything to the returned provider object.
 *
 * ## The footgun: `db` is a process-wide singleton
 *
 * Because `db` is a module singleton, disposing *any* runtime built from
 * `RepositoriesLive` closes the database for the whole process — not just for
 * whichever runtime happened to call `dispose()`. That is correct for the
 * app's single composition-root runtime (`main.ts`, Wave 3), which lives as
 * long as the page and is never disposed in practice. It means **no test may
 * call `dispose()` on a runtime built from this layer** — doing so would
 * close the shared Dexie connection out from under every other test still
 * running against it.
 *
 * ## What this does and does not prove
 *
 * This is the codebase's first non-trivial finalizer — ADR 003 named the
 * Dexie connection as exactly the acquire/release case `Scope` shipped
 * unvalidated against. But because nothing disposes a `RepositoriesLive`
 * runtime in practice today (see the footgun above), `release` is wired up
 * but not exercised: it is reachable code, not yet a case any test drives
 * through `Scope`.
 */
import { db } from './implementations/dexie/database'
import { createDexieRepositoryProvider } from './implementations/dexie'
import { scoped } from '@/lib/di/layer'
import { Repositories } from './services'

export const RepositoriesLive = scoped(
  Repositories,
  () => createDexieRepositoryProvider(),
  () => {
    db.close()
  },
)
