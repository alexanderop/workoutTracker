/* eslint-disable vitest/no-conditional-in-test -- Error controls are conditionally rendered by the form. */
/* eslint-disable vitest/expect-expect -- Page-object actions include their own visible-state assertions. */
/**
 * Integration tests for Exercise Form Error Handling
 *
 * Tests verify proper error feedback when save operations fail:
 * - ErrorDialog shown on addExercise failure
 * - ErrorDialog shown on updateExercise failure
 * - Button disabled during save operation
 * - User can dismiss error and retry
 */
import { page, userEvent } from 'vitest/browser'
import { describe, expect, vi } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { useExercisesStore } from '@/stores/exercises'

describe('Exercise Form Error Handling', () => {
  describe('Create exercise', () => {
    it('shows error dialog when addExercise fails', async ({ createTestApp }) => {
      const { common, exercises, router } = await createTestApp()

      // Navigate to create form
      await exercises.navigateTo()
      await exercises.clickCreateCustomExercise()

      // Fill valid name and required muscle group (Finding M5)
      await exercises.fillName('Test Exercise')
      await exercises.selectMuscle('Chest')

      // Mock store to return null (failure)
      const store = useExercisesStore()
      vi.spyOn(store, 'addExercise').mockResolvedValueOnce(null)

      // Click save
      const saveButton = page.getByRole('button', { name: /save/i })
      await userEvent.click(saveButton)

      // Assert: ErrorDialog is visible
      await common.waitForDialog()
      await expect.element(page.getByText(/failed to save exercise/i)).toBeVisible()

      // Assert: Still on create page (didn't navigate)
      expect(router.currentRoute.value.path).toBe('/create-exercise')
    })

    it('allows dismissing error and retrying save successfully', async ({ createTestApp }) => {
      const { common, exercises } = await createTestApp()

      await exercises.navigateTo()
      await exercises.clickCreateCustomExercise()
      await exercises.fillName('Retry Exercise')
      await exercises.selectMuscle('Back')

      // First attempt fails
      const store = useExercisesStore()
      const spy = vi.spyOn(store, 'addExercise')
      spy.mockResolvedValueOnce(null)

      await userEvent.click(page.getByRole('button', { name: /save/i }))
      await common.waitForDialog()

      // Dismiss error dialog
      const okButton = page.getByRole('button', { name: /ok/i })
      await userEvent.click(okButton)
      await common.waitForDialogClose()

      // Second attempt succeeds (spy no longer mocked)
      await userEvent.click(page.getByRole('button', { name: /save/i }))

      // Should navigate back to exercises list
      await common.waitForRoute(/^\/exercises$/)
    })
  })

  describe('Edit exercise', () => {
    it('shows error dialog when updateExercise fails', async ({ createTestApp }) => {
      const { common, navigateTo, router } = await createTestApp()

      // Get existing exercise from store
      const store = useExercisesStore()
      const exercise = store.customExercises[0]
      if (!exercise) throw new Error('No custom exercise found in store')

      // Navigate to edit page
      await navigateTo({ name: RouteNames.EditExercise, params: { id: exercise.id } })

      // Mock update to fail
      vi.spyOn(store, 'updateExercise').mockResolvedValueOnce(false)

      // Update name and save
      const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Updated Name')

      await userEvent.click(page.getByRole('button', { name: /save/i }))

      // Assert: ErrorDialog shown
      await common.waitForDialog()
      await expect.element(page.getByText(/failed to save exercise/i)).toBeVisible()

      // Assert: Still on edit page
      expect(router.currentRoute.value.path).toBe(`/exercises/${exercise.id}/edit`)
    })
  })

  describe('Button state during save', () => {
    it('disables save button and shows saving text during operation', async ({ createTestApp }) => {
      const { exercises } = await createTestApp()

      await exercises.navigateTo()
      await exercises.clickCreateCustomExercise()
      await exercises.fillName('Loading Test')
      await exercises.selectMuscle('Core')

      // Mock addExercise with delayed resolution
      const store = useExercisesStore()
      const deferred: { resolve: ((value: null) => void) | null } = { resolve: null }
      vi.spyOn(store, 'addExercise').mockImplementation(
        () =>
          new Promise((resolve) => {
            deferred.resolve = resolve
          }),
      )

      // Click save
      await userEvent.click(page.getByRole('button', { name: /save/i }))

      // Assert: Button shows "Saving..." and is disabled
      const savingButton = page.getByRole('button', { name: /saving/i })
      await expect.element(savingButton).toBeVisible()
      await expect.element(savingButton).toBeDisabled()

      // Resolve the promise to complete the test
      deferred.resolve?.(null)
    })
  })
})
