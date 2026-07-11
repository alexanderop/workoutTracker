import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { getAllCustomExercises } from '../helpers/dbAssertions'

/**
 * Choosing a non-default exercise type and metrics when creating a custom
 * exercise. Existing custom-exercise specs keep the compound/weight-reps
 * defaults, so the type and metrics selector dialogs were never exercised —
 * yet they are exactly how a user creates e.g. a Plank (isometric, duration).
 */
describe('Custom exercise with type and metrics selection', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('creates an isometric duration-based exercise via the selector dialogs', async () => {
    const { common, exercises, getByRole, cleanup } = await createTestApp()

    await common.navigateToExercises()
    await userEvent.click(getByRole('button', { name: /create.*custom/i }))
    await common.waitForRoute(/^\/create-exercise$/)

    await userEvent.fill(page.getByPlaceholder(/name.*e\.g\./i), 'Weighted Plank Hold')
    await exercises.selectMuscle('Core')

    // Change the exercise type from the default (Compound) to Isometric
    await userEvent.click(page.getByRole('button', { name: /exercise type/i }))
    await common.waitForDialog()
    await userEvent.click(page.getByRole('button', { name: /static holds like planks/i }))
    await expect.element(page.getByText('Isometric')).toBeVisible()

    // Change the metrics from Weight + Reps to Duration
    await userEvent.click(page.getByRole('button', { name: /metrics/i }))
    await common.waitForDialog()
    await userEvent.click(page.getByRole('button', { name: /time-based/i }))
    await expect.element(page.getByText('Duration')).toBeVisible()

    await userEvent.click(getByRole('button', { name: /save/i }))
    await common.waitForRoute(/^\/exercises$/)
    await expect.element(page.getByText('Weighted Plank Hold')).toBeVisible()

    // The chosen type and metrics are persisted
    const saved = await getAllCustomExercises()
    const plank = saved.find((exercise) => exercise.name === 'Weighted Plank Hold')
    expect(plank?.type).toBe('isometric')
    expect(plank?.metrics).toBe('duration')

    cleanup()
  })
})
