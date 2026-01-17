import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { page } from '../helpers/locator'
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
    await expectElement(page.getByRole('table')).toBeVisible()

    // Use Locator API directly for environment-agnostic interactions
    const kgInput = page.getByRole('spinbutton', { name: /weight for set 1/i })
    await kgInput.clear()
    await kgInput.fill('12.5')

    // Get the set row for assertions
    const setRow = await workout.getSetRow(0)
    expect(setRow.kg).toHaveValue('12.5')

    app.cleanup()
  })

  it('allows entering weight with 2 decimal places like 12.25', async () => {
    const app = await createTestApp()
    const { builder, workout } = app

    await builder.addStrengthBlock('Squat')
    await builder.startWorkout()
    await expectElement(page.getByRole('table')).toBeVisible()

    // Use Locator API directly for environment-agnostic interactions
    const kgInput = page.getByRole('spinbutton', { name: /weight for set 1/i })
    await kgInput.clear()
    await kgInput.fill('12.25')

    const setRow = await workout.getSetRow(0)
    expect(setRow.kg).toHaveValue('12.25')

    app.cleanup()
  })

  it('preserves decimal weight after completing set', async () => {
    const app = await createTestApp()
    const { builder, workout } = app

    await builder.addStrengthBlock('Deadlift')
    await builder.startWorkout()
    await expectElement(page.getByRole('table')).toBeVisible()

    // Fill set with decimal weight and complete using Locator API
    const kgInput = page.getByRole('spinbutton', { name: /weight for set 1/i })
    const repsInput = page.getByRole('spinbutton', { name: /^reps for set 1/i })
    const rirInput = page.getByRole('spinbutton', { name: /reps in reserve for set 1/i })
    const completeBtn = page.getByRole('button', { name: /mark set 1 complete/i })

    await kgInput.clear()
    await kgInput.fill('12.5')
    await repsInput.clear()
    await repsInput.fill('8')
    await rirInput.clear()
    await rirInput.fill('2')
    await completeBtn.click()

    // Verify set completed
    await expectPoll(() => workout.isSetCompleted(0)).toBe(true)

    // Verify the weight value is preserved with decimal
    const completedRow = await workout.getSetRow(0)
    expect(completedRow.kg).toHaveValue('12.5')

    app.cleanup()
  })
})
