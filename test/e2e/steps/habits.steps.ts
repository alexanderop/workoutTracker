import type { Locator, Page } from '@playwright/test'
import { expect, Given, Then, When } from '../fixtures'

/** The toggle's accessible name is the literal `Mark {name} complete` /
 *  `Mark {name} incomplete` from `src/i18n/messages/en/habits.ts`, so an exact
 *  string match is enough — and it avoids "incomplete" matching a prefix of
 *  "complete"'s label, which a loose match would. */
function toggle(page: Page, name: string, state: 'complete' | 'incomplete'): Locator {
  return page.getByRole('button', { name: `Mark ${name} ${state}`, exact: true })
}

async function createDailyHabit(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: /^add habit$/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: /^name$/i }).fill(name)
  await dialog.getByRole('button', { name: /^save$/i }).click()
  await expect(dialog).toBeHidden()
}

// Toggling writes to IndexedDB before the button's accessible name flips, so
// waiting for the resulting label is what guarantees the write has landed --
// not just that the click was dispatched. This matters most right before a
// reload, the local-first guarantee this feature file exists to protect.
async function toggleHabit(
  page: Page,
  name: string,
  from: 'complete' | 'incomplete',
): Promise<void> {
  const to = from === 'complete' ? 'incomplete' : 'complete'
  await toggle(page, name, from).click()
  await expect(toggle(page, name, to)).toBeVisible()
}

Given('a first-time user has entered the app', async ({ page, goto }) => {
  await goto('/')
  await expect(page).toHaveURL(/\/onboarding$/)

  await page.getByRole('button', { name: 'Skip to App', exact: true }).click()
  await expect(page).toHaveURL(/\/$/)

  await page.getByRole('button', { name: /^habits$/i }).click()
  await expect(page).toHaveURL(/\/habits$/)
})

When('they add a new daily habit named {string}', async ({ page }, name: string) => {
  await createDailyHabit(page, name)
})

Given('a daily habit named {string} exists', async ({ page }, name: string) => {
  await createDailyHabit(page, name)
})

When('they check off {string} for today', async ({ page }, name: string) => {
  await toggleHabit(page, name, 'complete')
})

When('they uncheck {string} for today', async ({ page }, name: string) => {
  await toggleHabit(page, name, 'incomplete')
})

When('they reload the page', async ({ page }) => {
  await page.reload({ waitUntil: 'domcontentloaded' })
})

// Scoped to the `habit-today-` testid -- the one HabitDashboardCard.vue puts
// on the Today list's card -- so this asserts "in today's habits" rather than
// "somewhere on /habits" (which a page-wide getByText would also satisfy if
// the name rendered in, say, the archived list).
Then("{string} appears in today's habits", async ({ page }, name: string) => {
  const card = page.getByTestId(`habit-today-${name}`)
  await expect(card).toBeVisible()
  await expect(card.getByText(name, { exact: true })).toBeVisible()
})

Then('{string} is marked complete', async ({ page }, name: string) => {
  await expect(toggle(page, name, 'incomplete')).toBeVisible()
})

Then('{string} is marked incomplete', async ({ page }, name: string) => {
  await expect(toggle(page, name, 'complete')).toBeVisible()
})
