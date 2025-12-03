import { screen } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

describe('Complete Set Flow', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  it('advances to the next set after completing a set', async () => {
    const app = await createTestApp()

    // Click "Get Started" on home page to start a new workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))

    // We should now be on the workout builder page
    // Add an exercise by clicking "Add First Block"
    await app.user.click(app.getByRole('button', { name: /add first block/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))
    app.assertDialogClosed()

    // Start the workout (transition from builder to active mode)
    await app.startWorkout()

    // Verify we're on set 1 of 3
    expect(app.getByText('1/3')).toBeDefined()

    // Fill in the first set values using semantic queries
    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
    const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

    await app.user.type(weightInput, '100')
    await app.user.type(repsInput, '8')
    await app.user.type(rirInput, '2')

    // Click Complete Set
    await app.user.click(app.getByRole('button', { name: /complete set/i }))

    // Verify the UI advanced to set 2 of 3 (this would have failed before the fix)
    expect(app.getByText('2/3')).toBeDefined()

    // Verify the completed set appears in the history
    expect(app.getByText(/100kg × 8/)).toBeDefined()

    app.cleanup()
  })

  it('advances through all sets in a block', async () => {
    const app = await createTestApp()

    // Click "Get Started" on home page
    await app.user.click(app.getByRole('button', { name: /get started/i }))

    // Add an exercise
    await app.user.click(app.getByRole('button', { name: /add first block/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))
    app.assertDialogClosed()

    // Start the workout
    await app.startWorkout()

    // Complete set 1 using semantic queries
    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
    const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

    await app.user.type(weightInput, '100')
    await app.user.type(repsInput, '8')
    await app.user.type(rirInput, '2')
    await app.user.click(app.getByRole('button', { name: /complete set/i }))

    expect(app.getByText('2/3')).toBeDefined()

    // Complete set 2 (values should be pre-filled from set 1)
    await app.user.click(app.getByRole('button', { name: /complete set/i }))

    expect(app.getByText('3/3')).toBeDefined()

    // Complete set 3
    await app.user.click(app.getByRole('button', { name: /complete set/i }))

    // Verify all three sets appear in the history (by counting text patterns)
    const completedSets = screen.getAllByText(/100kg × 8/)
    expect(completedSets.length).toBe(3)

    app.cleanup()
  })
})
