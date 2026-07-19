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
import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'

describe('ExercisePicker', () => {
  describe('Dialog presentation mode (template views)', () => {
    it('opens dialog and shows exercise search', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Click to add a block (now uses AddBlockDialog which contains exercise picker)
      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await userEvent.click(addButton)

      // Dialog should open with search input (Exercises tab is active by default)
      await expect.element(page.getByRole('dialog')).toBeVisible()
      await expect.element(page.getByRole('textbox')).toBeVisible()
    })

    it('filters exercises by search query', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await userEvent.click(addButton)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Type to search
      const searchInput = page.getByRole('textbox')
      await userEvent.fill(searchInput, 'Bench Press')

      // Should show matching exercises (use exact match to avoid matching "Smith Machine Bench Press")
      await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()
    })

    it('closes dialog after selecting exercise', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await userEvent.click(addButton)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Search and select (use full name to avoid ambiguous matches)
      const searchInput = page.getByRole('textbox')
      await userEvent.fill(searchInput, 'Bench Press')

      await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()

      // Click on exercise using semantic query within dialog
      // Use "BP Bench Press" prefix (includes the abbreviation shown in the UI)
      const dialog = page.getByRole('dialog')
      await userEvent.click(dialog.getByRole('button', { name: /^bp bench press/i }))

      // Dialog should close
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
    })

    it('shows Create Custom Exercise button', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await userEvent.click(addButton)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Should show create button
      const createButton = await page.getByRole('button', { name: /create.*exercise/i }).query()
      expect(createButton).toBeTruthy()
    })
  })

  describe('Exercise list integrity', () => {
    it('shows each exercise only once (no duplicates)', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Open the add block dialog (contains exercise picker in Exercises tab)
      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await userEvent.click(addButton)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Search for a unique exercise name to test no duplicates
      const searchInput = page.getByRole('textbox')
      await userEvent.fill(searchInput, 'Deadlift')

      // Wait for search results (use exact to avoid matching other exercises)
      await expect.element(page.getByText('Deadlift', { exact: true })).toBeVisible()

      // Count exercise buttons - search for "Deadlift" should show all variants
      const dialog = page.getByRole('dialog')
      const deadliftButtons = await dialog.getByRole('button', { name: /deadlift/i }).all()

      // Get exercise names to check for true duplicates
      const exerciseNames = await Promise.all(
        deadliftButtons.map(async (button) => {
          const element = await button.element()
          return element.textContent?.trim()
        }),
      )
      const uniqueNames = new Set(exerciseNames)

      // All exercise names should be unique (no duplicates)
      expect(exerciseNames).toHaveLength(uniqueNames.size)
    })
  })

  describe('Equipment filter', () => {
    it('shows equipment filter pills below muscle filter', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Open add block dialog
      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /\+ add block/i }))

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Should show equipment filter options (use exact match to avoid matching exercise names)
      await expect.element(page.getByRole('button', { name: 'Barbell', exact: true })).toBeVisible()
      await expect
        .element(page.getByRole('button', { name: 'Dumbbell', exact: true }))
        .toBeVisible()
      await expect
        .element(page.getByRole('button', { name: 'Bodyweight', exact: true }))
        .toBeVisible()
    })

    it('filters exercises by equipment type', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /\+ add block/i }))

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Click bodyweight filter (exact match to avoid exercise names)
      await userEvent.click(page.getByRole('button', { name: 'Bodyweight', exact: true }))

      // Should show bodyweight exercises (use exact match since there are many Push-up variants)
      await expect.element(page.getByText('Push-ups', { exact: true })).toBeVisible()

      // Should NOT show barbell exercises like Bench Press
      await expect.element(page.getByText('Bench Press', { exact: true })).not.toBeInTheDocument()
    })

    it('combines muscle and equipment filters with AND logic', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /\+ add block/i }))

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Filter by Chest muscle (exact match)
      await userEvent.click(page.getByRole('button', { name: 'Chest', exact: true }))

      // Filter by Barbell equipment (exact match)
      await userEvent.click(page.getByRole('button', { name: 'Barbell', exact: true }))

      // Should show Bench Press (chest + barbell)
      await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()

      // Should NOT show Push-ups (chest + bodyweight, not barbell)
      await expect.element(page.getByText('Push-ups', { exact: true })).not.toBeInTheDocument()
    })

    it('resets equipment filter when dialog reopens', async ({ createTestApp }) => {
      const { navigateTo } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // First open - select equipment filter
      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /\+ add block/i }))

      await expect.element(page.getByRole('dialog')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: 'Bodyweight', exact: true }))

      // Search for Push-ups to find it in the filtered list
      const searchInput = page.getByRole('textbox')
      await userEvent.fill(searchInput, 'Push-ups')
      await expect.element(page.getByText('Push-ups', { exact: true })).toBeVisible()

      // Close dialog by selecting Push-ups exercise (button name includes abbreviation + muscle)
      const dialog = page.getByRole('dialog')
      await userEvent.click(dialog.getByRole('button', { name: /pu.*push-ups/i }))

      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

      // Reopen dialog
      await userEvent.click(page.getByRole('button', { name: /\+ add block/i }))
      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Should show Bench Press again (filter reset to 'All')
      await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()
    })
  })

  // Overlay mode tests - these use the existing timed-block test patterns
  // The existing timed-block-exercise-picker.spec.ts already covers this flow
})
