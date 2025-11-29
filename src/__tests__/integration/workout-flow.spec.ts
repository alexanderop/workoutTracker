import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'

describe('Workout Flow Integration', () => {
  afterEach(() => {
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
})
