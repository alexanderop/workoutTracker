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
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
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
      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await userEvent.click(addButton)

      // Dialog should open with search input (Exercises tab is active by default)
      await expect.element(page.getByRole('dialog')).toBeVisible()
      await expect.element(page.getByRole('textbox')).toBeVisible()

      cleanup()
    })

    it('filters exercises by search query', async () => {
      const { navigateTo, cleanup } = await createTestApp()
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

      cleanup()
    })

    it('closes dialog after selecting exercise', async () => {
      const { navigateTo, getByRole, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await userEvent.click(addButton)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Search and select (use full name to avoid ambiguous matches)
      const searchInput = page.getByRole('textbox')
      await userEvent.fill(searchInput, 'Bench Press')

      await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()

      // Click on exercise
      const dialog = await getByRole('dialog').element()
      const benchButton = Array.from(dialog.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Bench Press')
      )
      if (benchButton) await userEvent.click(benchButton)

      // Dialog should close
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

      cleanup()
    })

    it('shows Create Custom Exercise button', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await userEvent.click(addButton)

      await expect.element(page.getByRole('dialog')).toBeVisible()

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
      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await userEvent.click(addButton)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Search for a unique exercise name to test no duplicates
      const searchInput = page.getByRole('textbox')
      await userEvent.fill(searchInput, 'Deadlift')

      // Wait for search results (use exact to avoid matching other exercises)
      await expect.element(page.getByText('Deadlift', { exact: true })).toBeVisible()

      // Count exercise buttons containing "Deadlift"
      const dialog = await page.getByRole('dialog').element()
      const deadliftButtons = Array.from(dialog.querySelectorAll('button')).filter((btn: HTMLButtonElement) =>
        btn.textContent?.includes('Deadlift')
      )

      // Should only have one button for Deadlift, not duplicates
      // (Note: Smith Machine Romanian Deadlift is a different exercise, so filter to exact match)
      const exactMatches = deadliftButtons.filter((btn) => btn.textContent?.includes('Deadlift') && !btn.textContent?.includes('Romanian'))
      expect(exactMatches.length).toBe(1)

      cleanup()
    })
  })

  describe('Equipment filter', () => {
    it('shows equipment filter pills below muscle filter', async () => {
      const { navigateTo, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Open add block dialog
      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /\+ add block/i }))

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Should show equipment filter options (use exact match to avoid matching exercise names)
      await expect.element(page.getByRole('button', { name: 'Barbell', exact: true })).toBeVisible()
      await expect.element(page.getByRole('button', { name: 'Dumbbell', exact: true })).toBeVisible()
      await expect.element(page.getByRole('button', { name: 'Bodyweight', exact: true })).toBeVisible()

      cleanup()
    })

    it('filters exercises by equipment type', async () => {
      const { navigateTo, cleanup } = await createTestApp()
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

      cleanup()
    })

    it('combines muscle and equipment filters with AND logic', async () => {
      const { navigateTo, cleanup } = await createTestApp()
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

      cleanup()
    })

    it('resets equipment filter when dialog reopens', async () => {
      const { navigateTo, getByRole, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // First open - select equipment filter
      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: /\+ add block/i }))

      await expect.element(page.getByRole('dialog')).toBeVisible()
      await userEvent.click(page.getByRole('button', { name: 'Bodyweight', exact: true }))

      // Close dialog by selecting an exercise (use exact match for "Push-ups")
      const dialog = await getByRole('dialog').element()
      const exerciseBtn = Array.from(dialog.querySelectorAll('button')).find(
        (btn) => btn.textContent?.trim() === '🏃Push-upsChest'
      ) || Array.from(dialog.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Push-ups') && !btn.textContent?.includes('Clap')
      )
      if (exerciseBtn) await userEvent.click(exerciseBtn)

      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()

      // Reopen dialog
      await userEvent.click(page.getByRole('button', { name: /\+ add block/i }))
      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Should show Bench Press again (filter reset to 'All')
      await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()

      cleanup()
    })
  })

  // Overlay mode tests - these use the existing timed-block test patterns
  // The existing timed-block-exercise-picker.spec.ts already covers this flow
})
