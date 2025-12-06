import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { playwright } from '@vitest/browser-playwright'
import { configDefaults, defineConfig } from 'vitest/config'
import { VitePWA } from 'vite-plugin-pwa'

const resolve = {
  alias: {
    '@': fileURLToPath(new URL('./src', import.meta.url)),
  },
}

const optimizeDeps = {
  include: ['workbox-window'],
}

export default defineConfig({
  plugins: [vue(), tailwindcss(), VitePWA({ devOptions: { enabled: true } })],
  resolve,
  optimizeDeps,
  test: {
    root: fileURLToPath(new URL('./', import.meta.url)),
    exclude: [...configDefaults.exclude, 'e2e/**'],
    fileParallelism: false,
    bail: 1,
    include: ['src/__tests__/a11y/**/*.spec.ts'],
    browser: {
      enabled: true,
      provider: playwright(),
      instances: [{ browser: 'chromium' }],
      headless: true,
    },
    setupFiles: ['./src/__tests__/setup.ts'],
  },
})
