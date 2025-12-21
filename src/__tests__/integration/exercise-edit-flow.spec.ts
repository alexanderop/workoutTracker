/**
 * Integration tests for Exercise Edit Flow
 *
 * Tests verify the ability to edit exercises:
 * - Navigate to edit page from exercise progress view
 * - Form pre-populated with existing exercise data
 * - Update and save exercise changes
 */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { getCustomExercisesRepository } from '@/db'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Exercise Edit Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('navigation', () => {
    it('navigates to edit page from exercise progress view', async () => {
      const { navigateTo, router, cleanup } = await createTestApp()

      // Get a seeded exercise
      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')!

      // Navigate to exercise progress view
      await navigateTo({ name: RouteNames.ExerciseProgress, params: { id: benchPress.id } })

      // Click edit button
      const editButton = page.getByRole('button', { name: /edit exercise/i })
      await userEvent.click(editButton)

      // Should navigate to edit page
      await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.EditExercise)
      expect(router.currentRoute.value.params.id).toBe(benchPress.id)

      cleanup()
    })
  })

  describe('form pre-population', () => {
    it('pre-fills form with existing exercise data', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Get a seeded exercise
      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')!

      // Navigate directly to edit page
      await navigateTo({ name: RouteNames.EditExercise, params: { id: benchPress.id } })

      // Check form is pre-filled using locator's inputValue method
      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      const nameElement = await nameInput.element()
      if (nameElement instanceof HTMLInputElement) {
        expect(nameElement.value).toBe('Bench Press')
      }

      cleanup()
    })

    it('shows Edit Exercise as page title', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')!

      await navigateTo({ name: RouteNames.EditExercise, params: { id: benchPress.id } })

      await expect.element(page.getByRole('heading', { name: /edit exercise/i })).toBeVisible()

      cleanup()
    })
  })

  describe('editing and saving', () => {
    it('updates exercise name and persists changes', async () => {
      const { navigateTo, common, cleanup } = await createTestApp()

      // Get a seeded exercise
      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')!

      // Navigate to edit page
      await navigateTo({ name: RouteNames.EditExercise, params: { id: benchPress.id } })

      // Update name
      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Incline Bench Press')

      // Save
      const saveButton = page.getByRole('button', { name: /save/i })
      await userEvent.click(saveButton)

      // Should navigate back
      await common.waitForRoute(/^\/exercises/)

      // Verify changes persisted in database
      const updatedExercise = await getCustomExercisesRepository().getById(benchPress.id)
      expect(updatedExercise?.name).toBe('Incline Bench Press')

      cleanup()
    })

  })

  describe('form validation', () => {
    it('keeps save button disabled when name is cleared', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const exercises = await getCustomExercisesRepository().getAll()
      const benchPress = exercises.find((e) => e.name === 'Bench Press')!

      await navigateTo({ name: RouteNames.EditExercise, params: { id: benchPress.id } })

      // Clear the name
      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await userEvent.clear(nameInput)

      // Save button should be disabled
      const saveButton = page.getByRole('button', { name: /save/i })
      await expect.element(saveButton).toBeDisabled()

      cleanup()
    })
  })
})
