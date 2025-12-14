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
import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('ExercisePicker', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Dialog presentation mode (template views)', () => {
    it('opens dialog and shows exercise search', async () => {
      const { navigateTo, getByRole, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Click to add an exercise
      const addButton = await screen.findByRole('button', { name: /\+ add exercise/i })
      await userEvent.click(addButton)

      // Dialog should open with search input
      await waitFor(() => {
        expect(getByRole('dialog')).toBeDefined()
        expect(screen.getByRole('textbox')).toBeDefined()
      })

      cleanup()
    })

    it('filters exercises by search query', async () => {
      const { navigateTo, getByRole, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      const addButton = await screen.findByRole('button', { name: /\+ add exercise/i })
      await userEvent.click(addButton)

      await waitFor(() => {
        expect(getByRole('dialog')).toBeDefined()
      })

      // Type to search
      const searchInput = screen.getByRole('textbox')
      await userEvent.fill(searchInput, 'Bench')

      // Should show matching exercises
      await waitFor(() => {
        expect(screen.queryAllByText(/Bench Press/i).length).toBeGreaterThan(0)
      })

      cleanup()
    })

    it('closes dialog after selecting exercise', async () => {
      const { navigateTo, getByRole, queryByRole, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      const addButton = await screen.findByRole('button', { name: /\+ add exercise/i })
      await userEvent.click(addButton)

      await waitFor(() => {
        expect(getByRole('dialog')).toBeDefined()
      })

      // Search and select
      const searchInput = screen.getByRole('textbox')
      await userEvent.fill(searchInput, 'Bench')

      await waitFor(() => {
        expect(screen.queryAllByText(/Bench Press/i).length).toBeGreaterThan(0)
      })

      // Click on exercise
      const dialog = getByRole('dialog')
      const benchButton = Array.from(dialog.querySelectorAll('button')).find((btn) =>
        btn.textContent?.includes('Bench Press')
      )
      if (benchButton) await userEvent.click(benchButton)

      // Dialog should close
      await waitFor(() => {
        expect(queryByRole('dialog')).toBeNull()
      })

      cleanup()
    })

    it('shows Create Custom Exercise button', async () => {
      const { navigateTo, getByRole, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      const addButton = await screen.findByRole('button', { name: /\+ add exercise/i })
      await userEvent.click(addButton)

      await waitFor(() => {
        expect(getByRole('dialog')).toBeDefined()
      })

      // Should show create button
      expect(screen.queryByRole('button', { name: /create.*exercise/i })).toBeTruthy()

      cleanup()
    })
  })

  describe('Exercise list integrity', () => {
    it('shows each exercise only once (no duplicates)', async () => {
      const { navigateTo, getByRole, cleanup } = await createTestApp()
      await navigateTo({ name: RouteNames.CreateTemplate })

      // Open the exercise picker dialog
      const addButton = await screen.findByRole('button', { name: /\+ add exercise/i })
      await userEvent.click(addButton)

      await waitFor(() => {
        expect(getByRole('dialog')).toBeDefined()
      })

      // Search for a common exercise that should exist
      const searchInput = screen.getByRole('textbox')
      await userEvent.fill(searchInput, 'Bench Press')

      // Wait for search results
      await waitFor(() => {
        expect(screen.queryAllByText(/Bench Press/i).length).toBeGreaterThan(0)
      })

      // Count exercise buttons containing "Bench Press"
      const dialog = getByRole('dialog')
      const benchButtons = Array.from(dialog.querySelectorAll('button')).filter((btn) =>
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
