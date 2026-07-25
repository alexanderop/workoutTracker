import type { RepositoryProvider as RepoProvider } from './interfaces'
import { makeRuntime } from '@/lib/di/runtime'
import { Repositories } from './services'
import { RepositoriesLive } from './services.live'

let currentProvider: RepoProvider | null = null

/**
 * Get the current repository provider.
 * Lazily initializes a Dexie-backed provider if none set, resolved through
 * the `RepositoriesLive` DI layer rather than calling
 * `createDexieRepositoryProvider()` directly, so this legacy accessor path
 * and the DI path (`ctx.get(Repositories)`) agree on the same kind of
 * instance.
 *
 * The one-layer runtime built here is intentionally never disposed — see the
 * "process-wide singleton" footgun documented on `RepositoriesLive` in
 * `services.live.ts`. Wave 3's `main.ts` calls
 * `setRepositoryProvider(runtime.get(Repositories))` with the app's own
 * runtime instance once it exists, so both paths end up handing out the same
 * object; until then, this lazy fallback is what the 92 remaining
 * `get*Repository()` call sites resolve through.
 *
 * @deprecated Resolve `Repositories` from the app runtime instead
 * (`src/db/services.ts` / `src/db/services.live.ts`, ADR 004:
 * `brain/decisions/004-db-in-di.md`). 92 call sites still use this accessor;
 * migrating them is a deliberate follow-on, not an oversight.
 */
export function getRepositoryProvider(): RepoProvider {
  currentProvider ??= makeRuntime([RepositoriesLive]).get(Repositories)
  return currentProvider
}

/**
 * Explicitly set the repository provider.
 * Used to inject alternative implementations (e.g. mocks in tests, or a
 * future non-Dexie persistence backend) without touching call sites that
 * resolve repositories via the `get*Repository()` functions in `db/index.ts`.
 */
export function setRepositoryProvider(provider: RepoProvider): void {
  currentProvider = provider
}

/**
 * Reset the repository provider cache.
 * Used in tests to ensure clean state between test files.
 */
export function resetRepositoryProvider(): void {
  currentProvider = null
}
