/**
 * Integration tests for Exercise Edit Flow
 *
 * Tests verify the ability to edit exercises through cohesive user flows:
 * - Navigate to edit page, verify pre-populated form, update and save
 * - Form validation prevents saving with invalid data
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { getCustomExercisesRepository } from '@/db'
import { page, userEvent } from '../helpers/locator'
import { expectElement } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Exercise Edit Flow', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('allows editing exercise from progress view and saves changes', async () => {
    const { navigateTo, common, cleanup } = await createTestApp()

    // Get a seeded exercise
    const exercises = await getCustomExercisesRepository().getAll()
    const benchPress = exercises.find((e) => e.name === 'Bench Press')!

    // Navigate to exercise progress view
    await navigateTo({ name: RouteNames.ExerciseProgress, params: { id: benchPress.id } })

    // Click edit button
    const editButton = page.getByRole('button', { name: /edit exercise/i })
    await editButton.click()

    // Verify we're on the edit page by checking user-visible elements
    await expectElement(page.getByRole('heading', { name: /edit exercise/i })).toBeVisible()

    // Check form is pre-filled with existing data
    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await expectElement(nameInput).toHaveValue('Bench Press')

    // Update name
    await userEvent.clear(nameInput)
    await nameInput.fill('Incline Bench Press')

    // Save
    const saveButton = page.getByRole('button', { name: /save/i })
    await saveButton.click()

    // Should navigate back and show updated name in UI
    await common.waitForRoute(/^\/exercises/)

    // Verify changes persisted in database
    const updatedExercise = await getCustomExercisesRepository().getById(benchPress.id)
    expect(updatedExercise?.name).toBe('Incline Bench Press')

    cleanup()
  })

  it('keeps save button disabled when name is cleared', async () => {
    const { navigateTo, cleanup } = await createTestApp()

    const exercises = await getCustomExercisesRepository().getAll()
    const benchPress = exercises.find((e) => e.name === 'Bench Press')!

    await navigateTo({ name: RouteNames.EditExercise, params: { id: benchPress.id } })

    // Verify form is pre-filled
    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await expectElement(nameInput).toHaveValue('Bench Press')

    // Clear the name
    await userEvent.clear(nameInput)

    // Save button should be disabled
    const saveButton = page.getByRole('button', { name: /save/i })
    await expectElement(saveButton).toBeDisabled()

    cleanup()
  })
})
