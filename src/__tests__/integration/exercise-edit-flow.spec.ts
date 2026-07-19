/**
 * Integration tests for Exercise Edit Flow
 *
 * Tests verify the ability to edit exercises through cohesive user flows:
 * - Navigate to edit page, verify pre-populated form, update and save
 * - Form validation prevents saving with invalid data
 */
import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { RouteNames } from '@/router'
import { getCustomExercisesRepository } from '@/db'

describe('Exercise Edit Flow', () => {
  it('allows editing exercise from progress view and saves changes', async ({ createTestApp }) => {
    const { navigateTo, common } = await createTestApp()

    // Get a seeded exercise
    const exercises = await getCustomExercisesRepository().getAll()
    const benchPress = exercises.find((e) => e.name === 'Bench Press')!

    // Navigate to exercise progress view
    await navigateTo({ name: RouteNames.ExerciseProgress, params: { id: benchPress.id } })

    // Click edit button
    const editButton = page.getByRole('button', { name: /edit exercise/i })
    await userEvent.click(editButton)

    // Verify we're on the edit page by checking user-visible elements
    await expect.element(page.getByRole('heading', { name: /edit exercise/i })).toBeVisible()

    // Check form is pre-filled with existing data
    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await expect.element(nameInput).toHaveValue('Bench Press')

    // Update name
    await userEvent.clear(nameInput)
    await userEvent.fill(nameInput, 'Incline Bench Press')

    // Save
    const saveButton = page.getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)

    // Should navigate back and show updated name in UI
    await common.waitForRoute(/^\/exercises/)

    // Verify changes persisted in database
    const updatedExercise = await getCustomExercisesRepository().getById(benchPress.id)
    expect(updatedExercise?.name).toBe('Incline Bench Press')
  })

  it('keeps save button disabled when name is cleared', async ({ createTestApp }) => {
    const { navigateTo } = await createTestApp()

    const exercises = await getCustomExercisesRepository().getAll()
    const benchPress = exercises.find((e) => e.name === 'Bench Press')!

    await navigateTo({ name: RouteNames.EditExercise, params: { id: benchPress.id } })

    // Verify form is pre-filled
    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await expect.element(nameInput).toHaveValue('Bench Press')

    // Clear the name
    await userEvent.clear(nameInput)

    // Save button should be disabled
    const saveButton = page.getByRole('button', { name: /save/i })
    await expect.element(saveButton).toBeDisabled()
  })
})
