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
 * Reset the repository provider cache.
 * Used in tests to ensure clean state between test files.
 */
export function resetRepositoryProvider(): void {
  currentProvider = null
}

