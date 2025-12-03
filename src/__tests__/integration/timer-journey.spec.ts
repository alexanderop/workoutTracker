import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

// Helper to add a timed block to workout
async function addTimedBlock(
  app: Awaited<ReturnType<typeof createTestApp>>,
  blockType: 'AMRAP' | 'EMOM' | 'Tabata' | 'For Time',
) {
  // Click add block button
  const addBlockButton =
    app.queryByRole('button', { name: /add first block/i }) ??
    app.getByRole('button', { name: /add block/i })
  await app.user.click(addBlockButton)
  await app.waitForDialog()

  // Switch to Timed Blocks tab
  await app.user.click(app.getByRole('tab', { name: /timed blocks/i }))

  // Click the block type
  await app.user.click(app.getDialogButton(blockType))

  // Configure dialog opens - wait for it
  await waitFor(() => {
    const dialog = app.getByRole('dialog')
    expect(dialog.textContent).toContain('Configure')
  })

  // Add an exercise - Tabata uses "Select Exercise", others use "Add Exercise"
  const exerciseButtonText = blockType === 'Tabata' ? 'Select Exercise' : 'Add Exercise'
  await app.user.click(app.getDialogButton(exerciseButtonText))
  await app.user.click(app.getDialogButton('Push-ups'))

  // Click Add Block to confirm
  await app.user.click(app.getDialogButton('Add Block'))

  // Wait for dialog to close
  await waitFor(() => {
    expect(app.queryByRole('dialog')).toBeNull()
  })
}

// Helper to end workout via menu
async function endWorkoutViaMenu(app: Awaited<ReturnType<typeof createTestApp>>) {
  await waitFor(() => {
    expect(app.getMenuTrigger()).toBeTruthy()
  })
  await app.user.click(app.getMenuTrigger())

  await waitFor(() => {
    expect(app.queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
  })
  await app.user.click(app.getByRole('menuitem', { name: /end workout/i }))

  await app.waitForDialog()
  await app.user.click(app.getDialogButton('Finish Workout'))

  await app.waitForRoute(/^\/workout\/summary\//)
}

describe('Timer Journey', () => {
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

  it('completes AMRAP workout with rounds recorded', async () => {
    const app = await createTestApp()

    // Start new workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    expect(app.router.currentRoute.value.path).toBe('/workout/active')

    // Add AMRAP block
    await addTimedBlock(app, 'AMRAP')

    // Start the workout
    await app.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Verify AMRAP UI shows
    expect(app.queryByRole('heading', { name: /amrap/i })).toBeTruthy()
    expect(app.queryByText(/rounds/i)).toBeTruthy()

    // Start the timer
    await app.user.click(app.getByRole('button', { name: /start/i }))

    // Wait for +1 button to be enabled (timer must be running)
    await waitFor(() => {
      const plusButton = app.queryByRole('button', { name: /\+1/i })
      expect(plusButton).toBeTruthy()
      expect(plusButton).toHaveProperty('disabled', false)
    })

    // Click +1 to record rounds
    await app.user.click(app.getByRole('button', { name: /\+1/i }))
    await app.user.click(app.getByRole('button', { name: /\+1/i }))
    await app.user.click(app.getByRole('button', { name: /\+1/i }))

    // Verify rounds count shows 3
    await waitFor(() => {
      expect(app.queryByText('3')).toBeTruthy()
    })

    // End workout via menu and verify summary page
    await endWorkoutViaMenu(app)
    expect(app.router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

    // Verify summary page shows the workout completed
    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /workout complete/i })).toBeTruthy()
    })

    app.cleanup()
  })

  it('runs EMOM workout and completes full journey', async () => {
    const app = await createTestApp()

    // Start new workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))

    // Add EMOM block
    await addTimedBlock(app, 'EMOM')

    // Start workout
    await app.startWorkout()

    // Wait for active mode with EMOM
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Verify EMOM view shows minute info and exercise
    expect(app.queryByText(/minute 1 of/i)).toBeTruthy()
    expect(app.queryByText('Push-ups')).toBeTruthy()

    // Verify Start button is available
    expect(app.queryByRole('button', { name: /start/i })).toBeTruthy()

    // End workout via menu and verify we reach summary
    await endWorkoutViaMenu(app)
    expect(app.router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

    // Verify summary page shows workout completed
    await waitFor(() => {
      expect(app.queryByRole('heading', { name: /workout complete/i })).toBeTruthy()
    })

    app.cleanup()
  })
})
