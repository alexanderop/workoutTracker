import type { RepositoryProvider } from './interfaces'
import { createDexieRepositoryProvider } from './implementations/dexie'

let currentProvider: RepositoryProvider | null = null

/**
 * Get the current repository provider.
 * Lazily initializes Dexie provider if none set.
 */
export function getRepositoryProvider(): RepositoryProvider {
  if (!currentProvider) {
    currentProvider = createDexieRepositoryProvider()
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

