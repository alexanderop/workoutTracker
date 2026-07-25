import type { Page } from '@playwright/test'
import { expect, Given, Then, When } from '../fixtures'

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}

async function createDailyHabit(page: Page, name: string): Promise<void> {
  await page.getByRole('button', { name: /^add habit$/i }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toBeVisible()
  await dialog.getByRole('textbox', { name: /^name$/i }).fill(name)
  await dialog.getByRole('button', { name: /^save$/i }).click()
  await expect(dialog).toBeHidden()
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

// Toggling writes to IndexedDB before the button's accessible name flips, so
// waiting for the resulting label is what guarantees the write has landed --
// not just that the click was dispatched. This matters most right before a
// reload, the local-first guarantee this feature file exists to protect.
When('they check off {string} for today', async ({ page }, name: string) => {
  const toggleButton = page.getByRole('button', {
    name: new RegExp(`^Mark ${escapeRegExp(name)}`, 'i'),
  })
  await toggleButton.click()
  const completedButton = page.getByRole('button', {
    name: new RegExp(`^Mark ${escapeRegExp(name)} incomplete$`, 'i'),
  })
  await expect(completedButton).toBeVisible()
})

When('they uncheck {string} for today', async ({ page }, name: string) => {
  const toggleButton = page.getByRole('button', {
    name: new RegExp(`^Mark ${escapeRegExp(name)}`, 'i'),
  })
  await toggleButton.click()
  const incompleteButton = page.getByRole('button', {
    name: new RegExp(`^Mark ${escapeRegExp(name)} complete$`, 'i'),
  })
  await expect(incompleteButton).toBeVisible()
})

When('they reload the page', async ({ page }) => {
  await page.reload({ waitUntil: 'domcontentloaded' })
})

Then("{string} appears in today's habits", async ({ page }, name: string) => {
  await expect(page.getByText(name, { exact: true })).toBeVisible()
})

Then('{string} is marked complete', async ({ page }, name: string) => {
  const buttonName = new RegExp(`^Mark ${escapeRegExp(name)} incomplete$`, 'i')
  await expect(page.getByRole('button', { name: buttonName })).toBeVisible()
})

Then('{string} is marked incomplete', async ({ page }, name: string) => {
  const buttonName = new RegExp(`^Mark ${escapeRegExp(name)} complete$`, 'i')
  await expect(page.getByRole('button', { name: buttonName })).toBeVisible()
})
