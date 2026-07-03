import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { configDefaults, defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// Shared resolve config for path aliases
const resolve = {
  alias: {
    '@': fileURLToPath(new URL('src', import.meta.url)),
  },
}

// Pre-bundle dependencies to avoid Vite reloads during browser tests
const optimizeDependencies = {
  include: ['web-vitals', 'workbox-window'],
}

function browserConfig(name: string) {
  return {
    enabled: true,
    provider: playwright(),
    instances: [{ browser: 'chromium' as const, name }],
    headless: true,
  }
}

// Shared plugins for all projects
const plugins = [vue(), tailwindcss(), VitePWA({ devOptions: { enabled: true } })]

// Shared base configuration for all projects
// All tests run in Playwright browser mode for consistent, real-browser behavior
const sharedTestConfig = {
  root: fileURLToPath(new URL('./', import.meta.url)),
  exclude: [...configDefaults.exclude, 'e2e/**'],
  // Run test files in parallel - resetDatabase() resets all singleton state
  fileParallelism: true,
  // Stop test execution after first failure
  bail: 1,
  // Required for ArchUnitTS custom matchers
  globals: true,
  setupFiles: ['./src/__tests__/setup.ts'],
  // Filter out noisy WakeLock errors in browser tests
  onConsoleLog(log: string, type: 'stdout' | 'stderr'): false | void {
    if (type === 'stderr' && log.includes('[WakeLock]')) {
      return false // Suppress all WakeLock warnings (expected in test environment)
    }
    // Let all other messages through
  },
}

const coverageConfig = {
  provider: 'v8' as const,
  reporter: ['text'],
  include: ['src/**/*.{ts,vue}'],
  exclude: ['src/**/*.d.ts', 'src/__tests__/**', 'src/components/ui/**'],
  thresholds: {
    lines: 86,
    functions: 84,
    branches: 73,
    statements: 84,
  },
}

// Note: This file is excluded from tsconfig.vitest.json type checking due to plugin type conflicts
export default defineConfig({
  plugins,
  resolve,
  optimizeDeps: optimizeDependencies,
  test: {
    // Coverage configuration (applies to default project when using --coverage)
    coverage: coverageConfig,

    // Project-based configuration for running different test suites
    projects: [
      // Project 1: Default (main tests)
      {
        plugins,
        resolve,
        optimizeDeps: optimizeDependencies,
        test: {
          ...sharedTestConfig,
          name: 'default',
          include: ['src/__tests__/**/*.spec.ts'],
          exclude: [
            ...sharedTestConfig.exclude,
            'src/__tests__/a11y/**',
            'src/__tests__/visual/**',
          ],
          browser: browserConfig('default-browser'),
        },
      },

      // Project 2: Accessibility tests
      {
        plugins,
        resolve,
        optimizeDeps: optimizeDependencies,
        test: {
          ...sharedTestConfig,
          name: 'a11y',
          include: ['src/__tests__/a11y/**/*.spec.ts'],
          browser: browserConfig('a11y-browser'),
        },
      },

      // Project 3: Visual regression tests
      {
        plugins,
        resolve,
        optimizeDeps: optimizeDependencies,
        test: {
          ...sharedTestConfig,
          name: 'visual',
          include: ['src/__tests__/visual/**/*.spec.ts'],
          browser: {
            ...browserConfig('visual-browser'),
            expect: {
              toMatchScreenshot: {
                comparatorOptions: {
                  threshold: 0.2,
                  allowedMismatchedPixelRatio: 0.02,
                },
              },
            },
          },
        },
      },

      // Project 4: Architecture tests (ArchUnitTS)
      // Runs in Node.js (not browser) for filesystem analysis
      {
        resolve,
        test: {
          name: 'arch',
          globals: true,
          include: ['src/__tests__/architecture/**/*.test.ts'],
          // No browser config - runs in Node for filesystem access
        },
      },
    ],
  },
})
