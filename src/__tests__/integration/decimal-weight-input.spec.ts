import { flushPromises } from '@vue/test-utils'
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Decimal Weight Input', () => {
  beforeEach(setupIntegrationTest)

  afterEach(async () => {
    await flushPromises()
    await cleanupIntegrationTest()
  })

  it('allows entering decimal weight values like 12.5', async () => {
    const app = await createTestApp()
    const { builder, workout } = app

    await builder.addStrengthBlock('Bench Press')
    await builder.startWorkout()
    await expect.element(page.getByRole('table')).toBeVisible()

    // Get the first set row
    const setRow = await workout.getSetRow(0)

    // Try entering a decimal value
    await userEvent.clear(setRow.kg)
    await userEvent.fill(setRow.kg, '12.5')

    // Assert the value is 12.5, not 12 (which would mean decimals were rejected)
    expect(setRow.kg).toHaveValue('12.5')

    app.cleanup()
  })

  it('allows entering weight with 2 decimal places like 12.25', async () => {
    const app = await createTestApp()
    const { builder, workout } = app

    await builder.addStrengthBlock('Squat')
    await builder.startWorkout()
    await expect.element(page.getByRole('table')).toBeVisible()

    const setRow = await workout.getSetRow(0)

    await userEvent.clear(setRow.kg)
    await userEvent.fill(setRow.kg, '12.25')

    expect(setRow.kg).toHaveValue('12.25')

    app.cleanup()
  })

  it('preserves decimal weight after completing set', async () => {
    const app = await createTestApp()
    const { builder, workout } = app

    await builder.addStrengthBlock('Deadlift')
    await builder.startWorkout()
    await expect.element(page.getByRole('table')).toBeVisible()

    // Fill set with decimal weight and complete
    const setRow = await workout.getSetRow(0)
    await userEvent.clear(setRow.kg)
    await userEvent.fill(setRow.kg, '12.5')
    await userEvent.clear(setRow.reps)
    await userEvent.fill(setRow.reps, '8')
    await userEvent.clear(setRow.rir)
    await userEvent.fill(setRow.rir, '2')
    await userEvent.click(setRow.complete)

    // Verify set completed
    await expect.poll(() => workout.isSetCompleted(0)).toBe(true)

    // Verify the weight value is preserved with decimal
    const completedRow = await workout.getSetRow(0)
    expect(completedRow.kg).toHaveValue('12.5')

    app.cleanup()
  })
})
