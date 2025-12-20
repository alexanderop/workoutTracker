/**
 * Integration tests for TheExercisesView (Exercise Library page)
 *
 * Tests verify equipment filter functionality matching the exercise picker dialogs.
 */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('ExercisesView', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Equipment filter', () => {
    it('shows equipment filter pills below muscle filter', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Should show muscle filter
      await expect.element(page.getByRole('button', { name: 'Chest', exact: true })).toBeVisible()

      // Should show equipment filter options
      await expect.element(page.getByRole('button', { name: 'Barbell', exact: true })).toBeVisible()
      await expect.element(page.getByRole('button', { name: 'Dumbbell', exact: true })).toBeVisible()
      await expect.element(page.getByRole('button', { name: 'Bodyweight', exact: true })).toBeVisible()

      cleanup()
    })

    it('filters exercises by equipment type', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Click bodyweight filter
      await userEvent.click(page.getByRole('button', { name: 'Bodyweight', exact: true }))

      // Should show bodyweight exercises
      await expect.element(page.getByText('Push-ups', { exact: true })).toBeVisible()

      // Should NOT show barbell exercises
      await expect.element(page.getByText('Bench Press', { exact: true })).not.toBeInTheDocument()

      cleanup()
    })

    it('combines muscle and equipment filters with AND logic', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Filter by Chest muscle
      await userEvent.click(page.getByRole('button', { name: 'Chest', exact: true }))

      // Filter by Barbell equipment
      await userEvent.click(page.getByRole('button', { name: 'Barbell', exact: true }))

      // Should show Bench Press (chest + barbell)
      await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()

      // Should NOT show Push-ups (chest + bodyweight, not barbell)
      await expect.element(page.getByText('Push-ups', { exact: true })).not.toBeInTheDocument()

      cleanup()
    })

    it('resets to all when clicking All button', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Click bodyweight filter
      await userEvent.click(page.getByRole('button', { name: 'Bodyweight', exact: true }))

      // Verify filter is active (Bench Press hidden)
      await expect.element(page.getByText('Bench Press', { exact: true })).not.toBeInTheDocument()

      // Click "All" to reset equipment filter (second "All" button is for equipment)
      const allButtons = page.getByRole('button', { name: 'All', exact: true })
      await userEvent.click(allButtons.nth(1))

      // Should show all exercises again
      await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()
      await expect.element(page.getByText('Push-ups', { exact: true })).toBeVisible()

      cleanup()
    })
  })
})
