import { expect, test } from './test-utils'

test.describe('Onboarding', () => {
  test('a first-time user can enter the app and stay onboarded after reload', async ({
    page,
    goto,
  }) => {
    await goto('/')

    await expect(page).toHaveURL(/\/onboarding$/)
    await expect(page.getByRole('heading', { name: /welcome/i })).toBeVisible()

    await page.getByRole('button', { name: 'Skip to App', exact: true }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: /start new workout/i })).toBeVisible()

    await page.reload({ waitUntil: 'domcontentloaded' })

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByRole('button', { name: /start new workout/i })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Skip to App', exact: true })).toHaveCount(0)
  })
})
