import type { Page } from '@playwright/test'
import { expect, Given, Then, When } from '../fixtures'

/**
 * Steps for `progressions.feature`. Like `habits.steps.ts`, all data is created
 * through the UI — no seeding and no `page.evaluate` — so the scenarios exercise
 * the same path a real user walks, including the IndexedDB writes the
 * local-first guarantee depends on.
 *
 * The EMOM timer is deliberately out of scope here: a progression created
 * through the UI runs a 10-minute EMOM, and the browser tier's trick for
 * shortening it (writing `currentMinutes: 1/30` straight to the repository)
 * needs a repository handle an e2e does not have. Session behaviour is covered
 * in the Node and browser tiers instead.
 */

/** Reaches the progressions list the way a user does: bottom nav -> Workouts,
 *  then the Progressions tab. There is no direct nav entry for it. */
async function openProgressionsList(page: Page): Promise<void> {
  await page.getByRole('button', { name: /^workouts$/i }).click()
  await expect(page).toHaveURL(/\/workouts$/)
  await page.getByRole('tab', { name: /progressions/i }).click()
}

/**
 * Saving navigates to the new progression's detail page, so this walks back to
 * the list afterwards. Awaiting the detail URL first is what proves the write
 * landed — the router only moves once `save()` has resolved with a persisted
 * progression, which matters most right before a reload.
 */
async function createProgression(
  page: Page,
  name: string,
  weights: ReadonlyArray<number>,
): Promise<void> {
  await page.getByRole('button', { name: /^create progression$/i }).click()
  await expect(page).toHaveURL(/\/progressions\/create$/)

  await page.getByLabel(/^name$/i).fill(name)
  for (const weight of weights) {
    await page.getByRole('button', { name: `${weight}kg`, exact: true }).click()
  }

  await page.getByRole('button', { name: /^save$/i }).click()
  await expect(page).toHaveURL(/\/progressions\/[^/]+$/)

  await page.getByRole('button', { name: /^go back$/i }).click()
  await expect(page).toHaveURL(/\/progressions$/)
}

Given('a first-time user has opened the progressions list', async ({ page, goto }) => {
  await goto('/')
  await expect(page).toHaveURL(/\/onboarding$/)

  await page.getByRole('button', { name: 'Skip to App', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)

  await openProgressionsList(page)
})

When(
  'they create a progression named {string} with the {int}kg and {int}kg kettlebells',
  async ({ page }, name: string, first: number, second: number) => {
    await createProgression(page, name, [first, second])
  },
)

// `When they reload the page` is intentionally not redefined here — steps share
// one registry across the `test/e2e/steps/**` glob, so habits.steps.ts's
// definition already serves this feature and a second one would collide.

// Asserts against `ProgressionCard`'s aria-label (`progressions.card.ariaCurrent`
// in src/i18n/messages/en/progressions.ts), which carries the name *and* the
// level in one accessible name. A page-wide getByText would also pass on the
// name rendering anywhere on the route, and would not check the level at all.
Then(
  '{string} appears in the progressions list at {int}kg, {int} reps, {int} min',
  async ({ page }, name: string, weight: number, reps: number, minutes: number) => {
    const card = page.getByRole('button', {
      name: `${name} - ${weight}kg, ${reps} reps, ${minutes} min EMOM`,
      exact: true,
    })
    await expect(card).toBeVisible()
  },
)
