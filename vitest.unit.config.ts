import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'

/**
 * Node `unit` tier: pure logic specs that need no DOM, no IndexedDB, and no
 * browser. Kept as its own config file (rather than only an inline project
 * in vitest.config.ts) so it can be run in isolation without paying for the
 * plugin/browser setup the other tiers require.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('src', import.meta.url)),
    },
  },
  test: {
    name: 'unit',
    root: fileURLToPath(new URL('./', import.meta.url)),
    include: ['src/__tests__/unit/**/*.spec.ts'],
    setupFiles: ['./src/__tests__/unit/setup.ts'],
    globals: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
  },
})
