/* eslint-disable vitest/no-conditional-in-test -- Validation feedback is conditionally rendered. */
/**
 * Integration tests for exercise duplicate-name validation.
 *
 * FINDING 7 (High, UX review 2026-07-04): Creating an exercise with a name
 * that already exists (case-insensitive, whitespace-trimmed) silently saved
 * both entries, so the library then showed indistinguishable duplicates.
 * Exercises are picked by name everywhere, so this is a correctness bug,
 * not just a cosmetic one.
 *
 * Required behavior:
 * - Block saving a new exercise whose trimmed, case-insensitive name matches
 *   an existing exercise; show an inline validation error near the name field.
 * - When editing an existing exercise, its own (unchanged) name must not
 *   count as a duplicate.
 */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { getCustomExercisesRepository } from '@/db'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Exercise Duplicate Name Validation', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('should block saving a new exercise whose name matches an existing one, case-insensitive and trimmed', async () => {
    const { common, exercises, router, cleanup } = await createTestApp()

    // Create the first exercise
    await exercises.navigateTo()
    await exercises.clickCreateCustomExercise()
    await exercises.fillName('Test Curl QA')
    await exercises.selectMuscle('Arms')
    await userEvent.click(page.getByRole('button', { name: /save/i }))
    await common.waitForRoute(/^\/exercises$/)

    // Attempt to create a duplicate with different casing and surrounding whitespace
    await exercises.navigateTo()
    await exercises.clickCreateCustomExercise()
    await exercises.fillName('  test curl qa  ')
    await exercises.selectMuscle('Arms')

    // Assert: inline validation error is visible near the name field
    await expect.element(page.getByText(/exercise with this name already exists/i)).toBeVisible()

    // Assert: save is blocked (button disabled, still on create page)
    const saveButton = page.getByRole('button', { name: /save/i })
    await expect.element(saveButton).toBeDisabled()
    expect(router.currentRoute.value.path).toBe('/create-exercise')

    // Assert: only one exercise with that name exists in the database
    const allExercises = await getCustomExercisesRepository().getAll()
    const matches = allExercises.filter((e) => e.name.trim().toLowerCase() === 'test curl qa')
    expect(matches).toHaveLength(1)

    cleanup()
  })

  it('should allow saving an edited exercise when the name is left unchanged', async () => {
    const { router, navigateTo, cleanup } = await createTestApp()

    const allExercises = await getCustomExercisesRepository().getAll()
    const benchPress = allExercises.find((e) => e.name === 'Bench Press')
    if (!benchPress) throw new Error('Seeded "Bench Press" exercise not found')

    const editPath = `/exercises/${benchPress.id}/edit`
    await navigateTo({ name: RouteNames.EditExercise, params: { id: benchPress.id } })

    // No duplicate error for the exercise's own name, and save stays enabled
    expect(page.getByText(/exercise with this name already exists/i).query()).toBeNull()

    const saveButton = page.getByRole('button', { name: /save/i })
    await expect.element(saveButton).not.toBeDisabled()

    await userEvent.click(saveButton)

    // Saving succeeds: the update goes through (not blocked) and the user leaves the edit page.
    // (Where exactly router.back() lands isn't the point of this test -- only that save wasn't blocked.)
    await expect.poll(() => router.currentRoute.value.path).not.toBe(editPath)

    // The exercise's own name is unchanged in the database (update succeeded, no corruption)
    const updated = await getCustomExercisesRepository().getById(benchPress.id)
    expect(updated?.name).toBe('Bench Press')

    cleanup()
  })

  it('should block saving when editing an exercise into a name that collides with another exercise', async () => {
    const { navigateTo, cleanup } = await createTestApp()

    const allExercises = await getCustomExercisesRepository().getAll()
    const benchPress = allExercises.find((e) => e.name === 'Bench Press')
    const deadlift = allExercises.find((e) => e.name === 'Deadlift')
    if (!benchPress || !deadlift) throw new Error('Expected seeded exercises not found')

    await navigateTo({ name: RouteNames.EditExercise, params: { id: benchPress.id } })

    const nameInput = page.getByPlaceholder(/name.*e\.g\./i)
    await userEvent.clear(nameInput)
    await userEvent.fill(nameInput, deadlift.name.toUpperCase())

    await expect.element(page.getByText(/exercise with this name already exists/i)).toBeVisible()

    const saveButton = page.getByRole('button', { name: /save/i })
    await expect.element(saveButton).toBeDisabled()

    cleanup()
  })
})
