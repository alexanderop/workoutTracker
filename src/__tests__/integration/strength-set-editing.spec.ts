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
    const app = await createTestApp()

    // Setup: add strength block and start workout
    await app.addStrengthBlock('Bench Press')
    await app.startWorkout()

    // Verify initial UI state (grouped assertions)
    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /bench press/i })).toBeTruthy()
    })
    expect(app.queryByText('Strength')).toBeTruthy()
    expect(app.queryByText('1/3')).toBeTruthy()

    // Fill the first set values using semantic queries
    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
    const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

    await app.user.type(weightInput, '80')
    await app.user.type(repsInput, '10')
    await app.user.type(rirInput, '2')

    // Complete set 1
    await app.user.click(app.getByRole('button', { name: /complete set/i }))

    // Verify advancement to set 2
    expect(app.getByText('2/3')).toBeDefined()

    // Verify the completed set appears in the history
    expect(app.getByText(/80kg × 10/)).toBeDefined()

    // Complete set 2 (values should be pre-filled from set 1)
    await app.user.click(app.getByRole('button', { name: /complete set/i }))

    // Verify advancement to set 3
    expect(app.getByText('3/3')).toBeDefined()

    // Complete set 3
    await app.user.click(app.getByRole('button', { name: /complete set/i }))

    // Verify all three sets appear in the history
    const completedSets = screen.getAllByText(/80kg × 10/)
    expect(completedSets.length).toBe(3)

    app.cleanup()
  })

  it('prefills values from previous set when advancing', async () => {
    const app = await createTestApp()

    await app.addStrengthBlock('Squat')
    await app.startWorkout()

    // Wait for UI to be ready
    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /squat/i })).toBeTruthy()
    })

    // Fill first set with specific values
    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
    const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

    await app.user.type(weightInput, '100')
    await app.user.type(repsInput, '5')
    await app.user.type(rirInput, '1')

    // Complete first set
    await app.user.click(app.getByRole('button', { name: /complete set/i }))

    // Wait for advancement to set 2
    expect(app.getByText('2/3')).toBeDefined()

    // Get fresh references to inputs for set 2
    const weightInput2 = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput2 = screen.getByRole('spinbutton', { name: /reps$/i })

    // Verify prefilled values in next set
    expect(weightInput2).toHaveProperty('value', '100')
    expect(repsInput2).toHaveProperty('value', '5')

    app.cleanup()
  })
})
