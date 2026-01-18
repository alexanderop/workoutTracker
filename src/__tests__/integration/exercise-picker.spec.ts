/**
 * Integration tests for ExercisePicker component (formerly WorkoutExercisePicker)
 *
 * These tests verify the behavior that must be preserved when consolidating
 * WorkoutAddExerciseDialog and ExercisePicker into a unified component.
 *
 * Key behaviors tested:
 * - Dialog presentation mode (template views)
 * - Overlay presentation mode (timed blocks)
 * - Search and filter functionality
 * - Selection behavior (single vs multi mode)
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { page } from '../helpers/locator'
import { expectElement } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('ExercisePicker', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Dialog presentation mode (template views)', () => {
    it('opens dialog and shows exercise search', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Click to add a block (now uses AddBlockDialog which contains exercise picker)
      await expectElement(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await addButton.click()

      // Dialog should open with search input (Exercises tab is active by default)
      await expectElement(page.getByRole('dialog')).toBeVisible()
      await expectElement(page.getByRole('textbox')).toBeVisible()

      cleanup()
    })

    it('filters exercises by search query', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expectElement(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await addButton.click()

      await expectElement(page.getByRole('dialog')).toBeVisible()

      // Type to search
      const searchInput = page.getByRole('textbox')
      await searchInput.fill('Bench Press')

      // Should show matching exercises (use exact match to avoid matching "Smith Machine Bench Press")
      await expectElement(page.getByText('Bench Press', { exact: true })).toBeVisible()

      cleanup()
    })

    it('closes dialog after selecting exercise', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expectElement(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await addButton.click()

      await expectElement(page.getByRole('dialog')).toBeVisible()

      // Search and select (use full name to avoid ambiguous matches)
      const searchInput = page.getByRole('textbox')
      await searchInput.fill('Bench Press')

      await expectElement(page.getByText('Bench Press', { exact: true })).toBeVisible()

      // Click on exercise using semantic query within dialog
      // The button contains "BP" (avatar initials) + "Bench Press" (name) + "Chest" (muscle)
      // Use a flexible pattern that works in both browser (Playwright) and Happy-DOM modes
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: /bp.*bench press/i }).click()

      // Dialog should close
      await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()

      cleanup()
    })

    it('shows Create Custom Exercise button', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expectElement(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await addButton.click()

      await expectElement(page.getByRole('dialog')).toBeVisible()

      // Should show create button
      const createButton = await page.getByRole('button', { name: /create.*exercise/i }).query()
      expect(createButton).toBeTruthy()

      cleanup()
    })
  })

  describe('Exercise list integrity', () => {
    it('shows each exercise only once (no duplicates)', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Open the add block dialog (contains exercise picker in Exercises tab)
      await expectElement(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await addButton.click()

      await expectElement(page.getByRole('dialog')).toBeVisible()

      // Search for a unique exercise name to test no duplicates
      const searchInput = page.getByRole('textbox')
      await searchInput.fill('Deadlift')

      // Wait for search results (use exact to avoid matching other exercises)
      await expectElement(page.getByText('Deadlift', { exact: true })).toBeVisible()

      // Count exercise buttons - search for "Deadlift" should show all variants
      const dialog = page.getByRole('dialog')
      const deadliftButtons = await dialog.getByRole('button', { name: /deadlift/i }).all()

      // Get exercise names to check for true duplicates
      const exerciseNames = await Promise.all(
        deadliftButtons.map(async (button) => {
          const element = await button.element()
          return element.textContent?.trim()
        })
      )
      const uniqueNames = new Set(exerciseNames)

      // All exercise names should be unique (no duplicates)
      expect(exerciseNames.length).toBe(uniqueNames.size)

      cleanup()
    })
  })

  describe('Equipment filter', () => {
    it('shows equipment filter pills below muscle filter', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Open add block dialog
      await expectElement(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      await page.getByRole('button', { name: /\+ add block/i }).click()

      await expectElement(page.getByRole('dialog')).toBeVisible()

      // Should show equipment filter options (use exact match to avoid matching exercise names)
      await expectElement(page.getByRole('button', { name: 'Barbell', exact: true })).toBeVisible()
      await expectElement(page.getByRole('button', { name: 'Dumbbell', exact: true })).toBeVisible()
      await expectElement(page.getByRole('button', { name: 'Bodyweight', exact: true })).toBeVisible()

      cleanup()
    })

    it('filters exercises by equipment type', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expectElement(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      await page.getByRole('button', { name: /\+ add block/i }).click()

      await expectElement(page.getByRole('dialog')).toBeVisible()

      // Click bodyweight filter (exact match to avoid exercise names)
      await page.getByRole('button', { name: 'Bodyweight', exact: true }).click()

      // Should show bodyweight exercises (use exact match since there are many Push-up variants)
      await expectElement(page.getByText('Push-ups', { exact: true })).toBeVisible()

      // Should NOT show barbell exercises like Bench Press
      await expectElement(page.getByText('Bench Press', { exact: true })).not.toBeInTheDocument()

      cleanup()
    })

    it('combines muscle and equipment filters with AND logic', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expectElement(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      await page.getByRole('button', { name: /\+ add block/i }).click()

      await expectElement(page.getByRole('dialog')).toBeVisible()

      // Filter by Chest muscle (exact match)
      await page.getByRole('button', { name: 'Chest', exact: true }).click()

      // Filter by Barbell equipment (exact match)
      await page.getByRole('button', { name: 'Barbell', exact: true }).click()

      // Should show Bench Press (chest + barbell)
      await expectElement(page.getByText('Bench Press', { exact: true })).toBeVisible()

      // Should NOT show Push-ups (chest + bodyweight, not barbell)
      await expectElement(page.getByText('Push-ups', { exact: true })).not.toBeInTheDocument()

      cleanup()
    })

    it('resets equipment filter when dialog reopens', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // First open - select equipment filter
      await expectElement(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      await page.getByRole('button', { name: /\+ add block/i }).click()

      await expectElement(page.getByRole('dialog')).toBeVisible()
      await page.getByRole('button', { name: 'Bodyweight', exact: true }).click()

      // Search for Push-ups to find it in the filtered list
      const searchInput = page.getByRole('textbox')
      await searchInput.fill('Push-ups')
      await expectElement(page.getByText('Push-ups', { exact: true })).toBeVisible()

      // Close dialog by selecting Push-ups exercise (button name includes abbreviation + muscle)
      const dialog = page.getByRole('dialog')
      await dialog.getByRole('button', { name: /pu.*push-ups/i }).click()

      await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()

      // Reopen dialog
      await page.getByRole('button', { name: /\+ add block/i }).click()
      await expectElement(page.getByRole('dialog')).toBeVisible()

      // Should show Bench Press again (filter reset to 'All')
      await expectElement(page.getByText('Bench Press', { exact: true })).toBeVisible()

      cleanup()
    })
  })

  // Overlay mode tests - these use the existing timed-block test patterns
  // The existing timed-block-exercise-picker.spec.ts already covers this flow
})
