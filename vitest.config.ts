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

// All tests run in Playwright browser mode for consistent, real-browser behavior
// Note: This file is excluded from tsconfig.vitest.json type checking due to plugin type conflicts
export default defineConfig({
  plugins: [vue(), tailwindcss(), VitePWA({ devOptions: { enabled: true } })],
  resolve,
  optimizeDeps,
  test: {
    root: fileURLToPath(new URL('./', import.meta.url)),
    exclude: [...configDefaults.exclude, 'e2e/**'],
    // Run test files sequentially to prevent module-level singleton state interference
    fileParallelism: false,
    // Stop test execution after first failure
    bail: 1,
    include: ['src/__tests__/**/*.spec.ts', '!src/__tests__/a11y/**', '!src/__tests__/visual/**'],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
    setupFiles: ['./src/__tests__/setup.ts'],

    // Filter out noisy WakeLock video fallback errors in browser tests
    onConsoleLog(log: string, type: 'stdout' | 'stderr'): false | void {
      if (type === 'stderr' && log.includes('[WakeLock] Video fallback play failed')) {
        return false // Suppress this message
      }
      // Let all other messages through
    },

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
