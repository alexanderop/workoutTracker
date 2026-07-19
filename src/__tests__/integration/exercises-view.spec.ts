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

  describe('Exercise progress navigation', () => {
    it('shows exercise name in header when viewing progress for pre-populated exercise', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Click on a pre-populated exercise (Bench Press)
      await userEvent.click(page.getByText('Bench Press', { exact: true }))

      // Should navigate to exercise progress and show the exercise name in header
      await expect.element(page.getByRole('heading', { name: 'Bench Press' })).toBeVisible()

      // Should NOT show "Unknown Exercise"
      await expect.element(page.getByText('Unknown Exercise')).not.toBeInTheDocument()

      cleanup()
    })
  })

  describe('Equipment filter', () => {
    it('shows equipment filter pills below muscle filter', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      // Should show muscle filter
      await expect.element(page.getByRole('button', { name: 'Chest', exact: true })).toBeVisible()

      // Should show equipment filter options
      await expect.element(page.getByRole('button', { name: 'Barbell', exact: true })).toBeVisible()
      await expect
        .element(page.getByRole('button', { name: 'Dumbbell', exact: true }))
        .toBeVisible()
      await expect
        .element(page.getByRole('button', { name: 'Bodyweight', exact: true }))
        .toBeVisible()

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

    // QA finding on PR #174: the chip list was hardcoded, so exercises with
    // newer equipment types (egym, battle-rope) were unreachable via filtering.
    it('shows a filter chip for every equipment type', async () => {
      const { navigateTo, exercises, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      await exercises.assertEquipmentFilterVisible('EGYM')
      await exercises.assertEquipmentFilterVisible('Battle Rope')

      cleanup()
    })

    it('filters exercises by EGYM equipment type', async () => {
      const { navigateTo, exercises, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      await exercises.clickEquipmentFilter('EGYM')

      // Should show EGYM machine exercises
      await exercises.assertExerciseVisible('EGYM Leg Press')
      await exercises.assertExerciseVisible('EGYM Chest Press')

      // Should NOT show non-EGYM exercises
      await exercises.assertExerciseNotVisible('Bench Press')

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

  describe('Search input', () => {
    it('should keep the search placeholder short enough and truncated to avoid clipping on narrow screens', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.Exercises })

      const search = page.getByRole('textbox', { name: /search exercises/i })
      const input = await search.element()

      // Old copy ("Search by name, muscle, or equipment...") clipped without
      // an ellipsis at 390px (UX review finding) -- kept short instead.
      expect(input.getAttribute('placeholder')).toBe('Search by name or muscle...')
      // Defense in depth: even if the copy grows again, `truncate` ensures
      // any overflow ends in an ellipsis rather than an abrupt cutoff.
      expect(input.className).toContain('truncate')

      cleanup()
    })
  })
})
