import process from 'node:process'
import { defineConfig, devices } from '@playwright/test'
import { defineBddConfig } from 'playwright-bdd'

const baseURL = 'http://127.0.0.1:5678'

// Must run before defineConfig(): it resolves and caches the BDD config (in
// an env var) so workers can read it back, and returns the generated
// directory of Playwright spec files produced from test/e2e/features/**.
const bddTestDir = defineBddConfig({
  features: 'test/e2e/features/**/*.feature',
  steps: ['test/e2e/steps/**/*.ts', 'test/e2e/fixtures.ts'],
})

export default defineConfig({
  globalSetup: './test/e2e/bddGuard.ts',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['html', { open: 'never' }]] : 'html',
  timeout: 60_000,
  outputDir: 'test-results/e2e',
  webServer: {
    command: 'pnpm start:playwright:webserver',
    url: baseURL,
    reuseExistingServer: false,
    timeout: 60_000,
  },
  use: {
    baseURL,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'bdd',
      testDir: bddTestDir,
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'chromium',
      testDir: './test/e2e',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-webkit-critical',
      testDir: './test/e2e',
      grep: /first-time user can enter|active workout and completed set survive/,
      use: { ...devices['iPhone 13'] },
    },
  ],
})
