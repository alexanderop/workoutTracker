/**
 * Integration tests for exercise muscle-group requirement.
 *
 * FINDING M5 (Medium, UX review 2026-07-04): Equipment/Muscle selectors on
 * the Create Exercise form looked required but weren't -- save enabled on
 * name alone. The resulting exercise had no muscle badge and was invisible
 * in every filtered exercise-library tab (muscle and equipment filters both
 * use strict equality against a concrete value, see
 * `src/composables/useExerciseSearch.ts`), reappearing only under "All".
 *
 * Decision: require a muscle group at save (data integrity) rather than just
 * labeling it optional, since a muscle-less exercise is a dead end in every
 * filtered view. Equipment stays optional but is now labeled "(optional)".
 */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { getCustomExercisesRepository } from '@/db'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Exercise Muscle Group Requirement', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('should keep save disabled when a name is entered but no muscle group is selected', async () => {
    const { exercises, cleanup } = await createTestApp()

    await exercises.navigateTo()
    await exercises.clickCreateCustomExercise()
    await exercises.fillName('Muscle-less Curl')

    const saveButton = page.getByRole('button', { name: /save/i })
    await expect.element(saveButton).toBeDisabled()

    cleanup()
  })

  it('should show an inline hint explaining why save is blocked when no muscle group is selected', async () => {
    const { exercises, cleanup } = await createTestApp()

    await exercises.navigateTo()
    await exercises.clickCreateCustomExercise()
    await exercises.fillName('Muscle-less Curl')

    await expect.element(page.getByText(/select a muscle group/i)).toBeVisible()

    cleanup()
  })

  it('should enable save once a muscle group is selected', async () => {
    const { exercises, cleanup } = await createTestApp()

    await exercises.navigateTo()
    await exercises.clickCreateCustomExercise()
    await exercises.fillName('Curl With Muscle')

    const saveButton = page.getByRole('button', { name: /save/i })
    await expect.element(saveButton).toBeDisabled()

    await exercises.selectMuscle('Arms')

    await expect.element(saveButton).not.toBeDisabled()

    cleanup()
  })

  it('should persist the selected muscle group so the exercise is discoverable by filter', async () => {
    const { exercises, cleanup } = await createTestApp()

    await exercises.navigateTo()
    await exercises.clickCreateCustomExercise()
    await exercises.fillName('Filterable Curl')
    await exercises.selectMuscle('Arms')

    const saveButton = page.getByRole('button', { name: /save/i })
    await userEvent.click(saveButton)

    const all = await getCustomExercisesRepository().getAll()
    const created = all.find((e) => e.name === 'Filterable Curl')
    expect(created?.muscle).toBe('arms')

    cleanup()
  })

  it('should label the equipment selector as optional', async () => {
    const { exercises, cleanup } = await createTestApp()

    await exercises.navigateTo()
    await exercises.clickCreateCustomExercise()

    await expect.element(page.getByRole('button', { name: /equipment.*optional/i })).toBeVisible()

    cleanup()
  })
})
