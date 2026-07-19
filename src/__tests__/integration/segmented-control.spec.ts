import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'

describe('SegmentedControl', () => {
  describe('EMOM Configuration', () => {
    it('displays rotation options as tabs instead of dropdown', async ({ createTestApp }) => {
      const { builder, common } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()

      // Open EMOM config dialog
      await userEvent.click(common.getDialogButton('EMOM'))
      await expect.element(page.getByText('Configure')).toBeVisible()

      // Verify rotation tabs are visible (not a dropdown)
      const fullRoundTab = page.getByRole('tab', { name: /full round each minute/i })
      const onePerMinuteTab = page.getByRole('tab', { name: /one exercise per minute/i })

      await expect.element(fullRoundTab).toBeVisible()
      await expect.element(onePerMinuteTab).toBeVisible()

      // Verify Full Round is selected by default
      await expect.element(fullRoundTab).toHaveAttribute('aria-selected', 'true')
      await expect.element(onePerMinuteTab).toHaveAttribute('aria-selected', 'false')
    })

    it('allows switching between rotation modes', async ({ createTestApp }) => {
      const { builder, common } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()

      // Open EMOM config dialog
      await userEvent.click(common.getDialogButton('EMOM'))
      await expect.element(page.getByText('Configure')).toBeVisible()

      const fullRoundTab = page.getByRole('tab', { name: /full round each minute/i })
      const onePerMinuteTab = page.getByRole('tab', { name: /one exercise per minute/i })

      // Click One Exercise Per Minute tab
      await userEvent.click(onePerMinuteTab)

      // Verify One Per Minute is now selected
      await expect.element(onePerMinuteTab).toHaveAttribute('aria-selected', 'true')
      await expect.element(fullRoundTab).toHaveAttribute('aria-selected', 'false')

      // Click Full Round tab to switch back
      await userEvent.click(fullRoundTab)

      // Verify Full Round is selected again
      await expect.element(fullRoundTab).toHaveAttribute('aria-selected', 'true')
      await expect.element(onePerMinuteTab).toHaveAttribute('aria-selected', 'false')
    })
  })

  describe('Workouts Page', () => {
    it('displays templates and benchmarks as tabs', async ({ createTestApp }) => {
      const { router } = await createTestApp()

      // Navigate to workouts page
      router.push({ name: RouteNames.Workouts })
      await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.Workouts)

      // Verify both tabs are visible
      const templatesTab = page.getByRole('tab', { name: /templates/i })
      const benchmarksTab = page.getByRole('tab', { name: /benchmarks/i })

      await expect.element(templatesTab).toBeVisible()
      await expect.element(benchmarksTab).toBeVisible()

      // Verify Templates tab is selected by default
      await expect.element(templatesTab).toHaveAttribute('aria-selected', 'true')
    })

    it('switches between templates and benchmarks tabs', async ({ createTestApp }) => {
      const { router } = await createTestApp()

      // Navigate to workouts page
      router.push({ name: RouteNames.Workouts })
      await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.Workouts)

      const templatesTab = page.getByRole('tab', { name: /templates/i })
      const benchmarksTab = page.getByRole('tab', { name: /benchmarks/i })

      // Verify Templates is selected initially
      await expect.element(templatesTab).toHaveAttribute('aria-selected', 'true')

      // Click Benchmarks tab
      await userEvent.click(benchmarksTab)

      // Verify Benchmarks is now selected
      await expect.element(benchmarksTab).toHaveAttribute('aria-selected', 'true')
      await expect.element(templatesTab).toHaveAttribute('aria-selected', 'false')

      // Verify Benchmarks content is visible (Create Benchmark button)
      await expect.element(page.getByRole('button', { name: /create benchmark/i })).toBeVisible()

      // Switch back to Templates
      await userEvent.click(templatesTab)

      // Verify Templates is selected and content visible
      await expect.element(templatesTab).toHaveAttribute('aria-selected', 'true')
      await expect.element(page.getByRole('button', { name: /create template/i })).toBeVisible()
    })
  })
})
