import type { RepositoryProvider as RepoProvider } from './interfaces'
import { createDexieRepositoryProvider } from './implementations/dexie'

let currentProvider: RepoProvider | null = null

/**
 * Get the current repository provider.
 * Lazily initializes a Dexie-backed provider if none set — the same factory
 * `RepositoriesLive` acquires, called directly so this deprecated accessor
 * stays free of any dependency on the DI kernel it is slated to be deleted
 * for. `main.ts` calls `setRepositoryProvider(runtime.get(Repositories))`
 * with the app runtime's own instance, so in the app both paths hand out the
 * same object; this lazy fallback is only what the remaining
 * `get*Repository()` call sites resolve through before that runs.
 *
 * @deprecated Resolve `Repositories` from the app runtime instead
 * (`src/db/services.ts` / `src/db/services.live.ts`, ADR 004:
 * `brain/decisions/004-db-in-di.md`). 92 call sites still use this accessor;
 * migrating them is a deliberate follow-on, not an oversight.
 */
export function getRepositoryProvider(): RepoProvider {
  currentProvider ??= createDexieRepositoryProvider()
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
