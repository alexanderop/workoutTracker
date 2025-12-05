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

describe('Timed Block Workflows', () => {
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

  describe('Configuration', () => {
    it('allows user to add timed blocks from the dialog and start workout', async () => {
      const { builder, user, getByRole, queryByText, queryByRole, common, cleanup } =
        await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      // Verify exercises tab is default (check aria-selected attribute)
      const exercisesTab = getByRole('tab', { name: /exercises/i })
      expect(exercisesTab.getAttribute('aria-selected')).toBe('true')

      // Switch to timed blocks tab
      await builder.switchToTimedBlocksTab()

      // Verify all block types are available
      expect(queryByText('AMRAP')).toBeTruthy()
      expect(queryByText('EMOM')).toBeTruthy()
      expect(queryByText('Tabata')).toBeTruthy()
      expect(queryByText('For Time')).toBeTruthy()

      // Select AMRAP - this opens a configuration dialog
      await user.click(common.getDialogButton('AMRAP'))

      // Wait for configuration dialog
      await waitFor(() => {
        const dialog = getByRole('dialog')
        expect(dialog.textContent).toContain('Configure')
      })

      // Add an exercise to the AMRAP
      await user.click(common.getDialogButton('Add Exercise'))
      await user.click(common.getDialogButton('Push-ups'))

      // Confirm the block by clicking "Add Block"
      await user.click(common.getDialogButton('Add Block'))

      // Wait for dialog to close
      await waitFor(() => {
        expect(queryByRole('dialog')).toBeNull()
      })

      // Verify AMRAP block appears in builder
      const playlistButtons = builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      // Start workout and verify timer UI
      await builder.startWorkout()

      // Wait for active mode
      await waitFor(() => {
        expect(queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Timer should display (verify Start button appears)
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      cleanup()
    })

    it('filters exercises when searching in add block dialog', async () => {
      const { builder, user, getByRole, queryByText, queryByRole, common, cleanup } =
        await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      // Multiple exercises should be visible initially
      expect(queryByText('Bench Press')).toBeTruthy()
      expect(queryByText('Squat')).toBeTruthy()

      // Type in search input
      const searchInput = getByRole('textbox')
      await user.type(searchInput, 'bench')

      // Only matching exercise should remain
      await waitFor(() => {
        expect(queryByText('Bench Press')).toBeTruthy()
        expect(queryByText('Squat')).toBeFalsy()
      })

      // Select the filtered exercise and verify it adds to workout
      await user.click(common.getDialogButton('Bench Press'))

      // Dialog should close after selecting exercise
      await waitFor(() => {
        expect(queryByRole('dialog')).toBeNull()
      })

      // Verify exercise was added to builder
      const playlistButtons = builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      cleanup()
    })
  })

  describe('Execution', () => {
    it('creates AMRAP block and shows timer UI', async () => {
      const { builder, workout, common, user, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await user.click(getByRole('button', { name: /get started/i }))
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add AMRAP block
      await addTimedBlock(common, user, getByRole, queryByRole, 'AMRAP')

      // Verify block was added
      const playlistButtons = builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode
      await waitFor(() => {
        expect(queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Verify AMRAP view is shown with Start button
      expect(queryByRole('heading', { name: /amrap/i })).toBeTruthy()
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      // Verify rounds section exists
      expect(queryByText(/rounds/i)).toBeTruthy()

      // Verify +1 button exists
      expect(queryByRole('button', { name: /\+1/i })).toBeTruthy()

      // End workout via menu
      await endWorkoutViaMenu(workout, common, user, getByRole, queryByRole)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })

    it('creates EMOM block and shows minute display', async () => {
      const { builder, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

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

      // Verify EMOM view shows minute info
      expect(queryByText(/minute 1 of/i)).toBeTruthy()

      // Verify Start button exists
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      // Verify exercise is displayed
      expect(queryByText('Push-ups')).toBeTruthy()

      cleanup()
    })

    it('creates Tabata block and shows round/phase info', async () => {
      const { builder, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await user.click(getByRole('button', { name: /get started/i }))

      // Add Tabata block
      await addTimedBlock(common, user, getByRole, queryByRole, 'Tabata')

      // Start workout
      await builder.startWorkout()

      // Wait for active mode with Tabata
      await waitFor(() => {
        expect(queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Verify Tabata view shows round info
      expect(queryByText(/round 1/i)).toBeTruthy()

      // Verify Start button exists
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      cleanup()
    })

    it('creates For Time block and completes with Done button', async () => {
      const { builder, common, user, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await user.click(getByRole('button', { name: /get started/i }))

      // Add For Time block
      await addTimedBlock(common, user, getByRole, queryByRole, 'For Time')

      // Start workout
      await builder.startWorkout()

      // Wait for active mode
      await waitFor(() => {
        expect(queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Verify For Time view is shown with Done button (not Start/Pause)
      expect(queryByRole('heading', { name: /for time/i })).toBeTruthy()
      const doneButton = queryByRole('button', { name: /done/i })
      expect(doneButton).toBeTruthy()

      // Click Done to complete the block
      await user.click(doneButton!)

      // Should show finish workout dialog
      await common.waitForDialog()
      await user.click(common.getDialogButton('Finish Workout'))

      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })

    it('navigates between strength and timed blocks in hybrid workout', async () => {
      const { builder, workout, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await user.click(getByRole('button', { name: /get started/i }))

      // Add strength block first
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await waitFor(() => expect(queryByRole('dialog')).toBeNull())

      // Add AMRAP block
      await addTimedBlock(common, user, getByRole, queryByRole, 'AMRAP')

      // Verify both blocks exist
      const playlistButtons = builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Start workout
      await builder.startWorkout()

      // Wait for active mode on first block (strength)
      await waitFor(() => {
        expect(queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Verify strength view shows Complete Set button
      expect(queryByRole('button', { name: /complete set/i })).toBeTruthy()

      // Navigate to AMRAP block
      await user.click(workout.getFooterButton('next'))

      await waitFor(() => {
        expect(queryByText(/block 2 of 2/i)).toBeTruthy()
      })

      // Verify AMRAP view shows Start button
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      // Navigate back to strength block
      await user.click(workout.getFooterButton('prev'))

      await waitFor(() => {
        expect(queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Verify back on strength view
      expect(queryByRole('button', { name: /complete set/i })).toBeTruthy()

      cleanup()
    })

    it('AMRAP block allows incrementing rounds with +1 button', async () => {
      const { builder, workout, common, user, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await user.click(getByRole('button', { name: /get started/i }))

      // Add AMRAP block
      await addTimedBlock(common, user, getByRole, queryByRole, 'AMRAP')

      // Verify block was added
      expect(builder.getPlaylistBlockButtons().length).toBe(1)

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode
      await waitFor(() => {
        expect(queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Verify AMRAP UI elements
      expect(queryByRole('heading', { name: /amrap/i })).toBeTruthy()
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()
      expect(queryByText(/rounds/i)).toBeTruthy()

      // Start the timer by clicking Start
      await user.click(getByRole('button', { name: /start/i }))

      // Wait for +1 button to be enabled (timer must be running)
      await waitFor(() => {
        const plusButton = queryByRole('button', { name: /\+1/i })
        expect(plusButton).toBeTruthy()
        expect(plusButton).toHaveProperty('disabled', false)
      })

      // Increment rounds
      await user.click(getByRole('button', { name: /\+1/i }))
      await user.click(getByRole('button', { name: /\+1/i }))

      // End workout via menu
      await endWorkoutViaMenu(workout, common, user, getByRole, queryByRole)

      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })

    it('timer button changes to Pause when running', async () => {
      const { builder, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await user.click(getByRole('button', { name: /get started/i }))

      // Add EMOM block
      await addTimedBlock(common, user, getByRole, queryByRole, 'EMOM')
      await builder.startWorkout()

      // Wait for active mode
      await waitFor(() => {
        expect(queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Verify Start button exists
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()
      expect(queryByRole('button', { name: /pause/i })).toBeNull()

      // Click Start
      await user.click(getByRole('button', { name: /start/i }))

      // Verify button changed to Pause
      await waitFor(() => {
        expect(queryByRole('button', { name: /pause/i })).toBeTruthy()
      })
      expect(queryByRole('button', { name: /start/i })).toBeNull()

      cleanup()
    })
  })

  describe('Complete Journeys', () => {
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
})
