import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

describe('Strength Set Editing', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  it('displays strength block UI and allows completing all sets', async () => {
    const { builder, user, queryByRole, queryByText, getByText, getByRole, cleanup } =
      await createTestApp()

    // Setup: add strength block and start workout
    await builder.addStrengthBlock('Bench Press')
    await builder.startWorkout()

    // Verify initial UI state (grouped assertions)
    await waitFor(() => {
      expect(queryByRole('heading', { name: /bench press/i })).toBeTruthy()
    })
    expect(queryByText('Strength')).toBeTruthy()
    expect(queryByText('1/3')).toBeTruthy()

    // Fill the first set values using semantic queries
    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
    const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

    await user.type(weightInput, '80')
    await user.type(repsInput, '10')
    await user.type(rirInput, '2')

    // Complete set 1
    await user.click(getByRole('button', { name: /complete set/i }))

    // Verify advancement to set 2
    expect(getByText('2/3')).toBeDefined()

    // Verify the completed set appears in the history
    expect(getByText(/80kg × 10/)).toBeDefined()

    // Complete set 2 (values should be pre-filled from set 1)
    await user.click(getByRole('button', { name: /complete set/i }))

    // Verify advancement to set 3
    expect(getByText('3/3')).toBeDefined()

    // Complete set 3
    await user.click(getByRole('button', { name: /complete set/i }))

    // Verify all three sets appear in the history
    const completedSets = screen.getAllByText(/80kg × 10/)
    expect(completedSets.length).toBe(3)

    cleanup()
  })

  it('prefills values from previous set when advancing', async () => {
    const { builder, user, queryByRole, getByText, getByRole, cleanup } = await createTestApp()

    await builder.addStrengthBlock('Squat')
    await builder.startWorkout()

    // Wait for UI to be ready
    await waitFor(() => {
      expect(queryByRole('heading', { name: /squat/i })).toBeTruthy()
    })

    // Fill first set with specific values
    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
    const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

    await user.type(weightInput, '100')
    await user.type(repsInput, '5')
    await user.type(rirInput, '1')

    // Complete first set
    await user.click(getByRole('button', { name: /complete set/i }))

    // Wait for advancement to set 2
    expect(getByText('2/3')).toBeDefined()

    // Get fresh references to inputs for set 2
    const weightInput2 = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput2 = screen.getByRole('spinbutton', { name: /reps$/i })

    // Verify prefilled values in next set
    expect(weightInput2).toHaveProperty('value', '100')
    expect(repsInput2).toHaveProperty('value', '5')

    cleanup()
  })
})
