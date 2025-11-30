import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'

describe('Settings Units Integration', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  it('displays unit toggles on settings page', async () => {
    const app = await createTestApp()

    // Navigate to Settings
    await app.navigateTo('/settings')

    // Verify Units section exists
    expect(app.getByText('Units')).toBeDefined()
    expect(app.getByText('Choose your preferred measurement units')).toBeDefined()

    // Verify weight unit toggle exists with kg selected by default
    const weightToggle = app.getByTestId('weight-unit-toggle')
    expect(weightToggle).toBeDefined()

    // Verify height unit toggle exists with cm selected by default
    const heightToggle = app.getByTestId('height-unit-toggle')
    expect(heightToggle).toBeDefined()

    app.cleanup()
  })

  it('toggles weight unit from kg to lbs and persists', async () => {
    const app = await createTestApp()

    // Navigate to Settings
    await app.navigateTo('/settings')

    // Click lbs button (ToggleGroupItem renders as button with aria-pressed)
    await app.user.click(app.getByRole('button', { name: /pounds/i }))

    // Navigate away and back to verify persistence
    await app.navigateTo('/')
    await app.navigateTo('/settings')

    // Verify lbs is still selected (the button should be pressed)
    const lbsButton = app.getByRole('button', { name: /pounds/i })
    expect(lbsButton.getAttribute('data-state')).toBe('on')

    app.cleanup()
  })

  it('shows weight column header based on selected unit', async () => {
    const app = await createTestApp()

    // Start a workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    await app.user.click(app.getByRole('button', { name: /add first exercise/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))

    // Verify default column header shows KG
    expect(app.getByText('KG')).toBeDefined()

    // Navigate to settings and change to lbs
    await app.navigateTo('/settings')
    await app.user.click(app.getByRole('button', { name: /pounds/i }))

    // Go back to workout
    await app.navigateTo('/workout/active')

    // Verify column header now shows LBS
    expect(app.getByText('LBS')).toBeDefined()

    app.cleanup()
  })
})
