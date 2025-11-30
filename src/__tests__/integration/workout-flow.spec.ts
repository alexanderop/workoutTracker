import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'

describe('Workout Flow Integration', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  it('navigates from home, adds exercises, and switches between them', async () => {
    const app = await createTestApp()

    // Navigate to Active Workout by clicking "Get Started"
    expect(app.router.currentRoute.value.path).toBe('/')
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    expect(app.router.currentRoute.value.path).toBe('/workout/active')

    // Add first exercise
    await app.user.click(app.getByRole('button', { name: /add first exercise/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))
    app.assertDialogClosed()
    expect(app.getByRole('heading', { name: /bench press/i })).toBeDefined()

    // Add second exercise via carousel "+" button (using aria-label)
    await app.user.click(app.getByRole('button', { name: /add exercise/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Squat'))
    expect(app.getByRole('heading', { name: /squat/i })).toBeDefined()

    // Verify Squat is selected (aria-pressed="true")
    const squatBtn = app.getByRole('button', { name: /squat/i, pressed: true })
    expect(squatBtn).toBeDefined()

    // Switch to Bench Press (button name includes emoji and truncated name)
    const benchBtn = app.getByRole('button', { name: /bench/i, pressed: false })
    await app.user.click(benchBtn)

    // Verify Bench is now selected
    expect(app.getByRole('button', { name: /bench/i, pressed: true })).toBeDefined()

    app.cleanup()
  })

  it('completes a full workout with sets and views summary', async () => {
    const app = await createTestApp()

    // Navigate to Active Workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    expect(app.router.currentRoute.value.path).toBe('/workout/active')

    // Add an exercise
    await app.user.click(app.getByRole('button', { name: /add first exercise/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))
    app.assertDialogClosed()

    // Fill in set values for first set
    await app.fillSet(0, { kg: 100, reps: 10, rir: 2 })

    // Complete the set
    await app.user.click(app.getSetRow(0).complete)

    // Click Finish Workout button
    await app.user.click(app.getByRole('button', { name: /finish workout/i }))

    // Confirm in dialog
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Finish Workout'))

    // Wait for navigation to summary (async persistence + router push)
    await app.waitForRoute(/^\/workout\/summary\//)

    // Assert summary page displays
    expect(await app.findByRole('heading', { name: /workout complete/i })).toBeDefined()

    // Click Done to return home
    await app.user.click(app.getByRole('button', { name: /done/i }))
    expect(app.router.currentRoute.value.path).toBe('/')

    app.cleanup()
  })

  it('allows user to give workout a custom name before finishing', async () => {
    const app = await createTestApp()

    // Navigate to Active Workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))

    // Add an exercise and complete a set
    await app.user.click(app.getByRole('button', { name: /add first exercise/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))
    await app.fillSet(0, { kg: 100, reps: 10, rir: 2 })
    await app.user.click(app.getSetRow(0).complete)

    // Click Finish Workout button
    await app.user.click(app.getByRole('button', { name: /finish workout/i }))
    await app.waitForDialog()

    // Enter a custom workout name
    const nameInput = app.getByRole('textbox', { name: /workout name/i })
    await app.user.type(nameInput, 'Push Day')

    // Finish the workout
    await app.user.click(app.getDialogButton('Finish Workout'))
    await app.waitForRoute(/^\/workout\/summary\//)

    // Verify the custom name appears on summary
    expect(await app.findByText('Push Day')).toBeDefined()

    app.cleanup()
  })
})
