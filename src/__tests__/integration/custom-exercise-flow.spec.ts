import { screen, waitFor } from '@testing-library/vue'
import { afterEach, describe, expect, it } from 'vitest'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

/**
 * Helper to navigate to Create Exercise view
 */
async function navigateToCreateExercise(
  app: Awaited<ReturnType<typeof createTestApp>>,
): Promise<void> {
  await app.user.click(app.getByRole('button', { name: /exercises/i }))
  await app.waitForRoute(/^\/exercises$/)
  await app.user.click(app.getByRole('button', { name: /create custom exercise/i }))
  await app.waitForRoute(/^\/create-exercise$/)
}

describe('Custom Exercise Flow Integration', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  it('creates a custom exercise with all fields and returns to exercises list', async () => {
    const app = await createTestApp()

    // Navigate to Create Exercise view
    await navigateToCreateExercise(app)

    // Fill in exercise name
    const nameInput = screen.getByPlaceholderText(/name/i)
    await app.user.type(nameInput, 'Bulgarian Split Squat')

    // Select equipment - click the settings item, then select from dialog
    await app.user.click(app.getByText('Equipment'))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Dumbbell'))
    await waitFor(() => app.assertDialogClosed())

    // Select muscle group
    await app.user.click(app.getByText('Muscle'))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Legs'))
    await waitFor(() => app.assertDialogClosed())

    // Select exercise type
    await app.user.click(app.getByText('Exercise Type'))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Compound'))
    await waitFor(() => app.assertDialogClosed())

    // Metrics defaults to Weight + Reps, verify it shows
    expect(app.getByText('Weight + Reps')).toBeDefined()

    // Click Save button
    const saveButton = app.getByRole('button', { name: /save/i })
    expect(saveButton.hasAttribute('disabled')).toBe(false)
    await app.user.click(saveButton)

    // Verify navigation back to exercises view
    await app.waitForRoute(/^\/exercises$/)

    // Verify the page shows exercises heading
    expect(app.getByRole('heading', { name: /exercises/i })).toBeDefined()

    app.cleanup()
  })

  it('disables save button when exercise name is empty', async () => {
    const app = await createTestApp()

    // Navigate to Create Exercise view
    await navigateToCreateExercise(app)

    // Verify Save button is disabled initially
    const saveButton = app.getByRole('button', { name: /save/i })
    expect(saveButton.hasAttribute('disabled')).toBe(true)

    // Type a name
    const nameInput = screen.getByPlaceholderText(/name/i)
    await app.user.type(nameInput, 'My Exercise')

    // Verify Save button is now enabled
    expect(saveButton.hasAttribute('disabled')).toBe(false)

    // Clear the name
    await app.user.clear(nameInput)

    // Verify Save button is disabled again
    expect(saveButton.hasAttribute('disabled')).toBe(true)

    app.cleanup()
  })

  it('creates exercise with default values when only name is provided', async () => {
    const app = await createTestApp()

    // Navigate to Create Exercise view
    await navigateToCreateExercise(app)

    // Fill in only the exercise name
    const nameInput = screen.getByPlaceholderText(/name/i)
    await app.user.type(nameInput, 'Simple Exercise')

    // Verify default values are displayed
    // Equipment and Muscle both show "Please select" placeholder
    const placeholders = screen.getAllByText('Please select')
    expect(placeholders.length).toBe(2) // Equipment and Muscle
    expect(app.getByText('Isolation Movement')).toBeDefined() // Default type
    expect(app.getByText('Weight + Reps')).toBeDefined() // Default metrics

    // Click Save
    await app.user.click(app.getByRole('button', { name: /save/i }))

    // Verify navigation back
    await app.waitForRoute(/^\/exercises$/)

    app.cleanup()
  })
})
