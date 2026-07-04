import type { RepositoryProvider as RepoProvider } from './interfaces'
import { createDexieRepositoryProvider as createDexieRepoProvider } from './implementations/dexie'

let currentProvider: RepoProvider | null = null

/**
 * Get the current repository provider.
 * Lazily initializes Dexie provider if none set.
 */
export function getRepositoryProvider(): RepoProvider {
  if (!currentProvider) {
    currentProvider = createDexieRepoProvider()
  }
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
