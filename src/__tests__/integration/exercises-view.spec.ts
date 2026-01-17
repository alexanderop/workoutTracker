/**
 * Integration tests for TheExercisesView (Exercise Library page)
 *
 * Tests verify equipment filter functionality matching the exercise picker dialogs.
 */
import { afterEach, beforeEach, describe, it } from 'vitest'
import { RouteNames } from '@/router'
import { page } from '../helpers/locator'
import { expectElement } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('ExercisesView', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Exercise progress navigation', () => {
    it('shows exercise name in header when viewing progress for pre-populated exercise', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Click on a pre-populated exercise (Bench Press)
      await page.getByText('Bench Press', { exact: true }).click()

      // Should navigate to exercise progress and show the exercise name in header
      await expectElement(page.getByRole('heading', { name: 'Bench Press' })).toBeVisible()

      // Should NOT show "Unknown Exercise"
      await expectElement(page.getByText('Unknown Exercise')).not.toBeInTheDocument()

      cleanup()
    })
  })

  describe('Equipment filter', () => {
    it('shows equipment filter pills below muscle filter', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Should show muscle filter
      await expectElement(page.getByRole('button', { name: 'Chest', exact: true })).toBeVisible()

      // Should show equipment filter options
      await expectElement(page.getByRole('button', { name: 'Barbell', exact: true })).toBeVisible()
      await expectElement(page.getByRole('button', { name: 'Dumbbell', exact: true })).toBeVisible()
      await expectElement(page.getByRole('button', { name: 'Bodyweight', exact: true })).toBeVisible()

      cleanup()
    })

    it('filters exercises by equipment type', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Click bodyweight filter
      await page.getByRole('button', { name: 'Bodyweight', exact: true }).click()

      // Should show bodyweight exercises
      await expectElement(page.getByText('Push-ups', { exact: true })).toBeVisible()

      // Should NOT show barbell exercises
      await expectElement(page.getByText('Bench Press', { exact: true })).not.toBeInTheDocument()

      cleanup()
    })

    it('combines muscle and equipment filters with AND logic', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Filter by Chest muscle
      await page.getByRole('button', { name: 'Chest', exact: true }).click()

      // Filter by Barbell equipment
      await page.getByRole('button', { name: 'Barbell', exact: true }).click()

      // Should show Bench Press (chest + barbell)
      await expectElement(page.getByText('Bench Press', { exact: true })).toBeVisible()

      // Should NOT show Push-ups (chest + bodyweight, not barbell)
      await expectElement(page.getByText('Push-ups', { exact: true })).not.toBeInTheDocument()

      cleanup()
    })

    it('resets to all when clicking All button', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Click bodyweight filter
      await page.getByRole('button', { name: 'Bodyweight', exact: true }).click()

      // Verify filter is active (Bench Press hidden)
      await expectElement(page.getByText('Bench Press', { exact: true })).not.toBeInTheDocument()

      // Click "All" to reset equipment filter (second "All" button is for equipment)
      const allButtons = page.getByRole('button', { name: 'All', exact: true })
      await allButtons.nth(1).click()

      // Should show all exercises again
      await expectElement(page.getByText('Bench Press', { exact: true })).toBeVisible()
      await expectElement(page.getByText('Push-ups', { exact: true })).toBeVisible()

      cleanup()
    })
  })
})
