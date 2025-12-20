import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import Icons from 'unplugin-icons/vite'
import { configDefaults, defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

// Shared resolve config for path aliases
const resolve = {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
}

// Pre-bundle dependencies to avoid Vite reloads during browser tests
const optimizeDeps = {
  include: ['workbox-window'],
}

// Shared plugins for all projects
const plugins = [vue(), Icons({ compiler: 'vue3' }), tailwindcss(), VitePWA({ devOptions: { enabled: true } })]

// Shared base configuration for all projects
// All tests run in Playwright browser mode for consistent, real-browser behavior
const sharedTestConfig = {
  root: fileURLToPath(new URL('./', import.meta.url)),
  exclude: [...configDefaults.exclude, 'e2e/**'],
  // Run test files sequentially to prevent module-level singleton state interference
  fileParallelism: false,
  // Stop test execution after first failure
  bail: 1,
  browser: {
    enabled: true,
    provider: playwright(),
    instances: [{ browser: 'chromium' as const }],
    headless: true,
  },
  setupFiles: ['./src/__tests__/setup.ts'],
}

// Note: This file is excluded from tsconfig.vitest.json type checking due to plugin type conflicts
export default defineConfig({
  plugins,
  resolve,
  optimizeDeps,
  test: {
    ...sharedTestConfig,

    // Filter out noisy WakeLock errors in browser tests
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): false | void {
      if (type === 'stderr' && log.includes('[WakeLock]')) {
        return false // Suppress all WakeLock warnings (expected in test environment)
      }
      // Let all other messages through
    },

    // Coverage configuration (applies to default project when using --coverage)
    coverage: {
      provider: 'v8',
      reporter: ['text'],
      include: ['src/**/*.{ts,vue}'],
      exclude: ['src/**/*.d.ts', 'src/__tests__/**', 'src/components/ui/**'],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },

    // Project-based configuration for running different test suites
    projects: [
      // Project 1: Default (main tests)
      {
        plugins,
        resolve,
        test: {
          ...sharedTestConfig,
          name: 'default',
          include: ['src/__tests__/**/*.spec.ts', '!src/__tests__/a11y/**', '!src/__tests__/visual/**'],
        },
      },

      // Project 2: Accessibility tests
      {
        plugins,
        resolve,
        test: {
          ...sharedTestConfig,
          name: 'a11y',
          include: ['src/__tests__/a11y/**/*.spec.ts'],
        },
      },

      // Project 3: Visual regression tests
      {
        plugins,
        resolve,
        test: {
          ...sharedTestConfig,
          name: 'visual',
          include: ['src/__tests__/visual/**/*.spec.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' as const }],
            headless: true,
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
    ],
  },
})
