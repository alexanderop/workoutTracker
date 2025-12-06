import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { configDefaults, defineConfig, mergeConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'
import viteConfig from './vite.config'

// Shared resolve config for path aliases
const resolve = {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
}

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      root: fileURLToPath(new URL('./', import.meta.url)),
      exclude: [...configDefaults.exclude, 'e2e/**'],
      // Run test files sequentially to prevent module-level singleton state interference
      fileParallelism: false,

      projects: [
        // Fast unit/composable tests in jsdom
        {
          extends: true,
          test: {
            name: 'unit',
            include: [
              'src/__tests__/composables/**/*.spec.ts',
              'src/__tests__/integration/**/*.spec.ts',
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
          test: {
            name: 'browser',
            include: ['src/__tests__/browser/**/*.spec.ts'],
            browser: {
              enabled: true,
              provider: 'playwright',
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
      },
    },
  }),
)
