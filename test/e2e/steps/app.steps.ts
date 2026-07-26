import type { Locator, Page } from '@playwright/test'
import { expect, Given, Then, When } from '../fixtures'

/**
 * App-shell steps shared by every feature: getting past onboarding, reloading,
 * and asserting which screen the user is on. Steps live here — rather than
 * being redeclared per feature — because playwright-bdd's step registry is
 * global, so two features declaring the same sentence would be an ambiguous
 * step rather than a shared one.
 */

/** Exact match: the button's label is the literal `Skip to App`. */
function skipOnboardingButton(page: Page): Locator {
  return page.getByRole('button', { name: 'Skip to App', exact: true })
}

/** The home screen's primary action — the cheapest proof we are on `/`. */
function startWorkoutButton(page: Page): Locator {
  return page.getByRole('button', { name: /start new workout/i })
}

async function skipOnboarding(page: Page): Promise<void> {
  await skipOnboardingButton(page).click()
  await expect(page).toHaveURL(/\/$/)
}

Given('a first-time user opens the app', async ({ goto }) => {
  await goto('/')
})

Given('a first-time user has entered the app', async ({ page, goto }) => {
  await goto('/')
  await expect(page).toHaveURL(/\/onboarding$/)
  await skipOnboarding(page)
})

When('they skip onboarding', async ({ page }) => {
  await skipOnboarding(page)
})

When('they reload the page', async ({ page }) => {
  await page.reload({ waitUntil: 'domcontentloaded' })
})

Then('they are welcomed on the onboarding screen', async ({ page }) => {
  await expect(page).toHaveURL(/\/onboarding$/)
  await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()
})

Then('they are on the workout home screen', async ({ page }) => {
  await expect(page).toHaveURL(/\/$/)
  await expect(startWorkoutButton(page)).toBeVisible()
})

// `toHaveCount(0)` rather than `not.toBeVisible()`: the guarantee is that the
// onboarding route never rendered at all, not merely that its button is hidden.
Then('onboarding is not offered again', async ({ page }) => {
  await expect(skipOnboardingButton(page)).toHaveCount(0)
})
