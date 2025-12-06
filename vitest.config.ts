import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
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

// Define vitest config directly without merging with vite.config.ts
// to avoid type conflicts between rolldown-vite and vitest's vite types
// Note: This file is excluded from tsconfig.vitest.json type checking due to plugin type conflicts
export default defineConfig({
  plugins: [vue(), tailwindcss(), VitePWA({ devOptions: { enabled: true } })],
  resolve,
  test: {
    root: fileURLToPath(new URL('./', import.meta.url)),
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Run test files sequentially to prevent module-level singleton state interference
    fileParallelism: false,
    // Stop test execution after first failure
    bail: 1,

    projects: [
      // Fast unit/composable tests in jsdom
      {
        extends: true,
        test: {
          name: 'unit',
          include: [
            'src/__tests__/composables/**/*.spec.ts',
            'src/__tests__/integration/**/*.spec.ts',
            'src/__tests__/stores/**/*.spec.ts',
          ],
          environment: 'jsdom',
          setupFiles: ['./src/__tests__/setup.ts'],
        },
      },
      // Browser tests for Web APIs - uses custom vite config without devtools
      {
        extends: false,
        plugins: [vue(), tailwindcss(), VitePWA({ devOptions: { enabled: true } })],
        resolve,
        optimizeDeps,
        test: {
          name: 'browser',
          include: ['src/__tests__/browser/**/*.spec.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            headless: true,
          },
          setupFiles: ['./src/__tests__/browser/setup.ts'],
        },
      },
      // Integration tests in real browser - same tests as 'unit' but in Chromium
      {
        extends: false,
        plugins: [vue(), tailwindcss(), VitePWA({ devOptions: { enabled: true } })],
        resolve,
        optimizeDeps,
        test: {
          name: 'integration-browser',
          include: ['src/__tests__/integration/**/*.spec.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
            headless: true,
          },
          setupFiles: ['./src/__tests__/browser/setup.ts'],
        },
      },
    ],

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
  },
})
