import { expect as playwrightExpect, test as base } from '@playwright/test'
import type {
  Fixtures,
  PlaywrightTestArgs,
  PlaywrightTestOptions,
  PlaywrightWorkerArgs,
  PlaywrightWorkerOptions,
} from '@playwright/test'

type AppPath = `/${string}`

export type E2EFixtures = {
  goto: (path: AppPath) => Promise<void>
  noPageErrors: void
}

/**
 * The fixture record itself, kept separate from the `test` object below so the
 * BDD runner can extend its own base with the same fixtures — see
 * `test/e2e/fixtures.ts`. `playwright-bdd` requires steps to be bound to a
 * `test` derived from *its* base, so the two `test` objects cannot be merged;
 * only what they add can be shared.
 */
export const e2eFixtures: Fixtures<
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

export const test = base.extend<E2EFixtures>(e2eFixtures)

export { expect } from '@playwright/test'
