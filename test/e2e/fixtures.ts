import { expect as playwrightExpect } from '@playwright/test'
import type {
  Fixtures,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test'
import { createBdd, test as base } from 'playwright-bdd'

type AppPath = `/${string}`

export type E2EFixtures = {
  goto: (path: AppPath) => Promise<void>
  noPageErrors: void
}

const e2eFixtures: Fixtures<
  E2EFixtures,
  object,
  PlaywrightTestArgs & PlaywrightTestOptions,
  PlaywrightWorkerArgs & PlaywrightWorkerOptions
> = {
  goto: async ({ page }, use) => {
    await use(async (path: AppPath) => {
      await page.goto(path, { waitUntil: 'domcontentloaded' })
    })
  },

  noPageErrors: [
    async ({ page }, use) => {
      const errors: Array<string> = []
      page.on('pageerror', (error) => errors.push(error.message))

      await use()

      playwrightExpect(errors, `Unexpected page errors:\n${errors.join('\n')}`).toEqual([])
    },
    { auto: true },
  ],
}

// Every e2e scenario is Gherkin, so there is one `test` object: playwright-bdd's
// base plus our fixtures. `createBdd` only accepts a test derived from that base,
// which is why the fixtures are layered on here rather than on `@playwright/test`.
export const test = base.extend<E2EFixtures>(e2eFixtures)

export const { Given, When, Then } = createBdd(test)

export { expect } from '@playwright/test'
