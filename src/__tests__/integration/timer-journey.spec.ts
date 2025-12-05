import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

// Helper to add a timed block to workout
async function addTimedBlock(
  common: Awaited<ReturnType<typeof createTestApp>>['common'],
  user: Awaited<ReturnType<typeof createTestApp>>['user'],
  getByRole: Awaited<ReturnType<typeof createTestApp>>['getByRole'],
  queryByRole: Awaited<ReturnType<typeof createTestApp>>['queryByRole'],
  blockType: 'AMRAP' | 'EMOM' | 'Tabata' | 'For Time',
) {
  // Click add block button
  const addBlockButton =
    queryByRole('button', { name: /add first block/i }) ??
    getByRole('button', { name: /add block/i })
  await user.click(addBlockButton)
  await common.waitForDialog()

  // Switch to Timed Blocks tab
  await user.click(getByRole('tab', { name: /timed blocks/i }))

  // Click the block type
  await user.click(common.getDialogButton(blockType))

  // Configure dialog opens - wait for it
  await waitFor(() => {
    const dialog = getByRole('dialog')
    expect(dialog.textContent).toContain('Configure')
  })

  // Add an exercise - Tabata uses "Select Exercise", others use "Add Exercise"
  const exerciseButtonText = blockType === 'Tabata' ? 'Select Exercise' : 'Add Exercise'
  await user.click(common.getDialogButton(exerciseButtonText))
  await user.click(common.getDialogButton('Push-ups'))

  // Click Add Block to confirm
  await user.click(common.getDialogButton('Add Block'))

  // Wait for dialog to close
  await waitFor(() => {
    expect(queryByRole('dialog')).toBeNull()
  })
}

// Helper to end workout via menu
async function endWorkoutViaMenu(
  workout: Awaited<ReturnType<typeof createTestApp>>['workout'],
  common: Awaited<ReturnType<typeof createTestApp>>['common'],
  user: Awaited<ReturnType<typeof createTestApp>>['user'],
  getByRole: Awaited<ReturnType<typeof createTestApp>>['getByRole'],
  queryByRole: Awaited<ReturnType<typeof createTestApp>>['queryByRole'],
) {
  await waitFor(() => {
    expect(workout.getMenuTrigger()).toBeTruthy()
  })
  await user.click(workout.getMenuTrigger())

  await waitFor(() => {
    expect(queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
  })
  await user.click(getByRole('menuitem', { name: /end workout/i }))

  await common.waitForDialog()
  await user.click(common.getDialogButton('Finish Workout'))

  await common.waitForRoute(/^\/workout\/summary\//)
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
    const { builder, workout, common, user, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

    // Start new workout
    await user.click(getByRole('button', { name: /get started/i }))
    expect(router.currentRoute.value.path).toBe('/workout/active')

    // Add AMRAP block
    await addTimedBlock(common, user, getByRole, queryByRole, 'AMRAP')

    // Start the workout
    await builder.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Verify AMRAP UI shows
    expect(queryByRole('heading', { name: /amrap/i })).toBeTruthy()
    expect(queryByText(/rounds/i)).toBeTruthy()

    // Start the timer
    await user.click(getByRole('button', { name: /start/i }))

    // Wait for +1 button to be enabled (timer must be running)
    await waitFor(() => {
      const plusButton = queryByRole('button', { name: /\+1/i })
      expect(plusButton).toBeTruthy()
      expect(plusButton).toHaveProperty('disabled', false)
    })

    // Click +1 to record rounds
    await user.click(getByRole('button', { name: /\+1/i }))
    await user.click(getByRole('button', { name: /\+1/i }))
    await user.click(getByRole('button', { name: /\+1/i }))

    // Verify rounds count shows 3
    await waitFor(() => {
      expect(queryByText('3')).toBeTruthy()
    })

    // End workout via menu and verify summary page
    await endWorkoutViaMenu(workout, common, user, getByRole, queryByRole)
    expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

    // Verify summary page shows the workout completed
    await waitFor(() => {
      expect(queryByRole('heading', { name: /workout complete/i })).toBeTruthy()
    })

    cleanup()
  })

  it('runs EMOM workout and completes full journey', async () => {
    const { builder, workout, common, user, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

    // Start new workout
    await user.click(getByRole('button', { name: /get started/i }))

    // Add EMOM block
    await addTimedBlock(common, user, getByRole, queryByRole, 'EMOM')

    // Start workout
    await builder.startWorkout()

    // Wait for active mode with EMOM
    await waitFor(() => {
      expect(queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Verify EMOM view shows minute info and exercise
    expect(queryByText(/minute 1 of/i)).toBeTruthy()
    expect(queryByText('Push-ups')).toBeTruthy()

    // Verify Start button is available
    expect(queryByRole('button', { name: /start/i })).toBeTruthy()

    // End workout via menu and verify we reach summary
    await endWorkoutViaMenu(workout, common, user, getByRole, queryByRole)
    expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

    // Verify summary page shows workout completed
    await waitFor(() => {
      expect(queryByRole('heading', { name: /workout complete/i })).toBeTruthy()
    })

    cleanup()
  })
})
