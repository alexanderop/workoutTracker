import { screen, waitFor } from '@testing-library/vue'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { userEvent } from '@vitest/browser/context'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Workout Set Editing - Any Set', () => {
  beforeEach(setupIntegrationTest)

  afterEach(async () => {
    await flushPromises()
    await cleanupIntegrationTest()
  })

  it('allows editing a completed (past) set', async () => {
    const app = await createTestApp()
    const { builder, workout} = app

    await builder.addStrengthBlock('Bench Press')
    await builder.startWorkout()
    await screen.findByRole('table')

    // Complete first set
    await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })
    await waitFor(() => expect(workout.isSetCompleted(0)).toBe(true))

    // Try editing the completed set (set 0)
    const completedRow = workout.getSetRow(0)
    await userEvent.clear(completedRow.kg)
    await userEvent.fill(completedRow.kg, '110')

    // Verify value changed
    expect(completedRow.kg).toHaveValue('110')

    app.cleanup()
  })

  it('allows editing a pending (future) set', async () => {
    const app = await createTestApp()
    const { builder, workout} = app

    await builder.addStrengthBlock('Squat')
    await builder.startWorkout()
    await screen.findByRole('table')

    // Set 0 is active, try editing set 2 (pending/future)
    const pendingRow = workout.getSetRow(2)
    await userEvent.clear(pendingRow.kg)
    await userEvent.fill(pendingRow.kg, '150')

    expect(pendingRow.kg).toHaveValue('150')

    app.cleanup()
  })

  it('allows completing a pending set out of order', async () => {
    const app = await createTestApp()
    const { builder, workout} = app

    await builder.addStrengthBlock('Deadlift')
    await builder.startWorkout()
    await screen.findByRole('table')

    // Fill pending set 2 and mark complete (skip sets 0 and 1)
    const pendingRow = workout.getSetRow(2)
    await userEvent.clear(pendingRow.kg)
    await userEvent.fill(pendingRow.kg, '200')
    await userEvent.clear(pendingRow.reps)
    await userEvent.fill(pendingRow.reps, '5')
    await userEvent.clear(pendingRow.rir)
    await userEvent.fill(pendingRow.rir, '2')
    await userEvent.click(pendingRow.complete)

    await waitFor(() => expect(workout.isSetCompleted(2)).toBe(true))

    app.cleanup()
  })
})
