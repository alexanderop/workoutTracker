import { afterEach, beforeEach, describe, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { page, userEvent } from '../helpers/locator'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { RouteNames } from '@/router'

describe('SegmentedControl', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('EMOM Configuration', () => {
    it('displays rotation options as tabs instead of dropdown', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()

      // Open EMOM config dialog
      await userEvent.click(common.getDialogButton('EMOM'))
      await expectElement(page.getByText('Configure')).toBeVisible()

      // Verify rotation tabs are visible (not a dropdown)
      const fullRoundTab = page.getByRole('tab', { name: /full round each minute/i })
      const onePerMinuteTab = page.getByRole('tab', { name: /one exercise per minute/i })

      await expectElement(fullRoundTab).toBeVisible()
      await expectElement(onePerMinuteTab).toBeVisible()

      // Verify Full Round is selected by default
      await expectElement(fullRoundTab).toHaveAttribute('aria-selected', 'true')
      await expectElement(onePerMinuteTab).toHaveAttribute('aria-selected', 'false')

      cleanup()
    })

    it('allows switching between rotation modes', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()

      // Open EMOM config dialog
      await userEvent.click(common.getDialogButton('EMOM'))
      await expectElement(page.getByText('Configure')).toBeVisible()

      const fullRoundTab = page.getByRole('tab', { name: /full round each minute/i })
      const onePerMinuteTab = page.getByRole('tab', { name: /one exercise per minute/i })

      // Click One Exercise Per Minute tab
      await onePerMinuteTab.click()

      // Verify One Per Minute is now selected
      await expectElement(onePerMinuteTab).toHaveAttribute('aria-selected', 'true')
      await expectElement(fullRoundTab).toHaveAttribute('aria-selected', 'false')

      // Click Full Round tab to switch back
      await fullRoundTab.click()

      // Verify Full Round is selected again
      await expectElement(fullRoundTab).toHaveAttribute('aria-selected', 'true')
      await expectElement(onePerMinuteTab).toHaveAttribute('aria-selected', 'false')

      cleanup()
    })
  })

  describe('Workouts Page', () => {
    it('displays templates and benchmarks as tabs', async () => {
      const { router, cleanup } = await createTestApp()

      // Navigate to workouts page
      router.push({ name: RouteNames.Workouts })
      await expectPoll(() => router.currentRoute.value.name).toBe(RouteNames.Workouts)

      // Verify both tabs are visible
      const templatesTab = page.getByRole('tab', { name: /templates/i })
      const benchmarksTab = page.getByRole('tab', { name: /benchmarks/i })

      await expectElement(templatesTab).toBeVisible()
      await expectElement(benchmarksTab).toBeVisible()

      // Verify Templates tab is selected by default
      await expectElement(templatesTab).toHaveAttribute('aria-selected', 'true')

      cleanup()
    })

    it('switches between templates and benchmarks tabs', async () => {
      const { router, cleanup } = await createTestApp()

      // Navigate to workouts page
      router.push({ name: RouteNames.Workouts })
      await expectPoll(() => router.currentRoute.value.name).toBe(RouteNames.Workouts)

      const templatesTab = page.getByRole('tab', { name: /templates/i })
      const benchmarksTab = page.getByRole('tab', { name: /benchmarks/i })

      // Verify Templates is selected initially
      await expectElement(templatesTab).toHaveAttribute('aria-selected', 'true')

      // Click Benchmarks tab
      await benchmarksTab.click()

      // Verify Benchmarks is now selected
      await expectElement(benchmarksTab).toHaveAttribute('aria-selected', 'true')
      await expectElement(templatesTab).toHaveAttribute('aria-selected', 'false')

      // Verify Benchmarks content is visible (Create Benchmark button)
      await expectElement(page.getByRole('button', { name: /create benchmark/i })).toBeVisible()

      // Switch back to Templates
      await templatesTab.click()

      // Verify Templates is selected and content visible
      await expectElement(templatesTab).toHaveAttribute('aria-selected', 'true')
      await expectElement(page.getByRole('button', { name: /create template/i })).toBeVisible()

      cleanup()
    })
  })
})
