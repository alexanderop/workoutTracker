import { expect, test } from '@playwright/test'

test('user can toggle dark mode theme in settings', async ({ page }) => {
  // Navigate to settings page
  await page.goto('/settings')

  // Check that the settings page is loaded
  await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible()

  // Find the theme toggle
  const themeToggle = page.locator('[data-testid="theme-toggle"]')
  await expect(themeToggle).toBeVisible()

  // Initially, the page should be in light mode (default)
  const html = page.locator('html')
  await expect(html).not.toHaveClass('dark')

  // Click the toggle to switch to dark mode
  await page.locator('[data-testid="theme-toggle"]').click()
  await page.waitForTimeout(500)

  // Verify dark mode is applied
  await expect(html).toHaveClass('dark')

  // Click toggle again to switch back to light mode
  await page.locator('[data-testid="theme-toggle"]').click()
  await page.waitForTimeout(500)

  // Verify light mode is applied
  await expect(html).not.toHaveClass('dark')

  // Verify theme persists on page reload
  await page.reload()
  await expect(html).not.toHaveClass('dark')
})
