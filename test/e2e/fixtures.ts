import { expect as playwrightExpect } from '@playwright/test'
import { createBdd, test as base } from 'playwright-bdd'

type AppPath = `/${string}`

type E2EFixtures = {
  goto: (path: AppPath) => Promise<void>
  noPageErrors: void
}

export const test = base.extend<E2EFixtures>({
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
})

export const { Given, When, Then } = createBdd(test)

export { expect } from '@playwright/test'
