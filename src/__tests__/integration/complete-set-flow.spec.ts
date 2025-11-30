import { afterEach, describe, expect, it } from 'vitest'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

describe('Complete Set Flow', () => {
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

    // Fill in the first set values using the spinbuttons
    // The inputs don't have accessible names, so we get all spinbuttons
    const [weightInput, repsInput, rirInput] = [
      ...document.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
    ]
    if (!weightInput || !repsInput || !rirInput) {
      throw new Error('Expected spinbutton elements not found')
    }

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

    // Complete set 1
    const [weightInput, repsInput, rirInput] = [
      ...document.querySelectorAll<HTMLElement>('[role="spinbutton"]'),
    ]
    if (!weightInput || !repsInput || !rirInput) {
      throw new Error('Expected spinbutton elements not found')
    }
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

    // Verify all three sets appear in the history
    const historyPills = document.querySelectorAll('[class*="bg-primary/10"]')
    expect(historyPills.length).toBe(3)

    app.cleanup()
  })
})
