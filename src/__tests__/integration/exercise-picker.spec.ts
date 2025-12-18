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
      await userEvent.fill(searchInput, 'Bench')

      // Should show matching exercises
      await expect.element(page.getByText(/Bench Press/i)).toBeVisible()

      cleanup()
    })

    it('closes dialog after selecting exercise', async () => {
      const { navigateTo, getByRole, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      await expect.element(page.getByRole('button', { name: /\+ add block/i })).toBeVisible()
      const addButton = page.getByRole('button', { name: /\+ add block/i })
      await userEvent.click(addButton)

      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Search and select
      const searchInput = page.getByRole('textbox')
      await userEvent.fill(searchInput, 'Bench')

      await expect.element(page.getByText(/Bench Press/i)).toBeVisible()

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

      // Search for a common exercise that should exist
      const searchInput = page.getByRole('textbox')
      await userEvent.fill(searchInput, 'Bench Press')

      // Wait for search results
      await expect.element(page.getByText(/Bench Press/i)).toBeVisible()

      // Count exercise buttons containing "Bench Press"
      const dialog = await page.getByRole('dialog').element()
      const benchButtons = Array.from(dialog.querySelectorAll('button')).filter((btn: HTMLButtonElement) =>
        btn.textContent?.includes('Bench Press')
      )

      // Should only have one button for Bench Press, not duplicates
      expect(benchButtons.length).toBe(1)

      cleanup()
    })
  })

  // Overlay mode tests - these use the existing timed-block test patterns
  // The existing timed-block-exercise-picker.spec.ts already covers this flow
})
