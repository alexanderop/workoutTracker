import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

describe('Full Workout Flow', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    // Reset body styles that might have been set by dialogs
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  it('creates a workout with strength and timed blocks, executes it, and finishes', async () => {
    const { builder, workout, common, user, router, getByRole, queryByRole, getByText, queryByText, cleanup } = await createTestApp()

    // ==================================================
    // PHASE 1: Start new workout from home page
    // ==================================================
    await user.click(getByRole('button', { name: /get started/i }))
    expect(router.currentRoute.value.path).toBe('/workout/active')

    // ==================================================
    // PHASE 2: Add a strength block (Bench Press)
    // ==================================================
    await user.click(getByRole('button', { name: /add first block/i }))
    await common.waitForDialog()
    await user.click(common.getDialogButton('Bench Press'))

    // Wait for dialog to close
    await waitFor(() => {
      expect(queryByRole('dialog')).toBeNull()
    })

    // ==================================================
    // PHASE 3: Add AMRAP block with exercise
    // ==================================================
    await user.click(getByRole('button', { name: /add block/i }))
    await common.waitForDialog()

    // Switch to Timed Blocks tab
    await user.click(getByRole('tab', { name: /timed blocks/i }))

    // Click AMRAP option
    await user.click(common.getDialogButton('AMRAP'))

    // Configure AMRAP dialog opens - wait for it
    await waitFor(() => {
      const dialog = getByRole('dialog')
      expect(dialog.textContent).toContain('Configure')
    })

    // Set duration to 8 minutes and add exercise
    await user.click(common.getDialogButton('8'))
    await user.click(common.getDialogButton('Add Exercise'))
    await user.click(common.getDialogButton('Push-ups'))
    await user.click(common.getDialogButton('Add Block'))

    // Wait for dialog to close
    await waitFor(() => {
      expect(queryByRole('dialog')).toBeNull()
    })

    // ==================================================
    // PHASE 4: Verify both blocks exist and start workout
    // ==================================================
    const playlistButtons = builder.getPlaylistBlockButtons()
    expect(playlistButtons.length).toBe(2)

    // Start the workout
    await builder.startWorkout()

    // Verify we're in active mode showing "Block 1 of 2"
    await waitFor(() => {
      expect(queryByText(/block 1 of 2/i)).toBeTruthy()
    })

    // ==================================================
    // PHASE 5: Complete a set in the strength block
    // ==================================================
    expect(getByText('1/3')).toBeTruthy()

    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
    const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

    await user.type(weightInput, '80')
    await user.type(repsInput, '10')
    await user.type(rirInput, '2')

    await user.click(getByRole('button', { name: /complete set/i }))

    // Verify advanced to set 2/3
    expect(getByText('2/3')).toBeTruthy()
    expect(getByText(/80kg × 10/)).toBeTruthy()

    // ==================================================
    // PHASE 6: Navigate to AMRAP block (block 2)
    // ==================================================
    await user.click(workout.getFooterButton('next'))

    // Verify we're on AMRAP block
    await waitFor(() => {
      expect(queryByText(/block 2 of 2/i)).toBeTruthy()
    })
    expect(queryByText('Push-ups')).toBeTruthy()

    // ==================================================
    // PHASE 7: Verify AMRAP Start button exists
    // ==================================================
    // The Start button exists for timed blocks
    expect(queryByRole('button', { name: /start/i })).toBeTruthy()

    // ==================================================
    // PHASE 8: Finish the workout via menu
    // ==================================================
    // Wait for the dropdown menu trigger to appear and click it
    await waitFor(() => {
      expect(workout.getMenuTrigger()).toBeTruthy()
    })
    await user.click(workout.getMenuTrigger())

    // Wait for menu to open and click End Workout
    await waitFor(() => {
      expect(queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
    })
    await user.click(getByRole('menuitem', { name: /end workout/i }))

    await common.waitForDialog()
    // Dialog title is "Finish Workout?" - verify dialog is open
    expect(queryByRole('heading', { name: /finish workout/i })).toBeTruthy()

    const nameInput = getByRole('textbox', { name: /workout name/i })
    await user.clear(nameInput)
    await user.type(nameInput, 'Hybrid Session')

    await user.click(common.getDialogButton('Finish Workout'))

    await common.waitForRoute(/^\/workout\/summary\//)
    expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

    cleanup()
  })

  it('navigates back and forth between blocks in active mode', async () => {
    const { builder, workout, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

    // Start workout
    await user.click(getByRole('button', { name: /get started/i }))

    // Add two strength blocks
    await user.click(getByRole('button', { name: /add first block/i }))
    await common.waitForDialog()
    await user.click(common.getDialogButton('Bench Press'))
    await waitFor(() => expect(queryByRole('dialog')).toBeNull())

    await user.click(getByRole('button', { name: /add block/i }))
    await common.waitForDialog()
    await user.click(common.getDialogButton('Deadlift'))
    await waitFor(() => expect(queryByRole('dialog')).toBeNull())

    // Start workout
    await builder.startWorkout()
    await waitFor(() => {
      expect(queryByText(/block 1 of 2/i)).toBeTruthy()
    })

    // Navigate to next block
    await user.click(workout.getFooterButton('next'))

    await waitFor(() => {
      expect(queryByText(/block 2 of 2/i)).toBeTruthy()
    })
    expect(queryByText('Deadlift')).toBeTruthy()

    // Navigate back to first block
    await user.click(workout.getFooterButton('prev'))

    await waitFor(() => {
      expect(queryByText(/block 1 of 2/i)).toBeTruthy()
    })
    expect(queryByText('Bench Press')).toBeTruthy()

    cleanup()
  })

  it('can cancel a workout and return to home', async () => {
    const { builder, workout, common, user, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

    // Start and add a block
    await user.click(getByRole('button', { name: /get started/i }))
    await user.click(getByRole('button', { name: /add first block/i }))
    await common.waitForDialog()
    await user.click(common.getDialogButton('Bench Press'))
    await waitFor(() => expect(queryByRole('dialog')).toBeNull())

    // Start workout
    await builder.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Open menu and cancel - wait for the menu trigger to be available
    await waitFor(() => {
      expect(workout.getMenuTrigger()).toBeTruthy()
    })
    await user.click(workout.getMenuTrigger())

    // Wait for menu to open and click Cancel Workout
    await waitFor(() => {
      expect(queryByRole('menuitem', { name: /cancel workout/i })).toBeTruthy()
    })
    await user.click(getByRole('menuitem', { name: /cancel workout/i }))

    // Confirm cancel dialog (button is "Delete Workout")
    await common.waitForDialog()
    await user.click(common.getDialogButton('Delete Workout'))

    // Verify we're back at home
    await common.waitForRoute(/^\/$/)
    expect(router.currentRoute.value.path).toBe('/')

    cleanup()
  })

  it('completes all sets in a strength block', async () => {
    const { builder, common, user, getByRole, getByText, queryByRole, cleanup } = await createTestApp()

    // Start workout with one exercise
    await user.click(getByRole('button', { name: /get started/i }))
    await user.click(getByRole('button', { name: /add first block/i }))
    await common.waitForDialog()
    await user.click(common.getDialogButton('Bench Press'))
    await waitFor(() => expect(queryByRole('dialog')).toBeNull())

    await builder.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(getByText('1/3')).toBeTruthy()
    })

    // Complete all 3 sets
    for (let setNum = 1; setNum <= 3; setNum++) {
      expect(getByText(`${setNum}/3`)).toBeTruthy()

      if (setNum === 1) {
        // First set needs initial values
        const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
        const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
        const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

        await user.type(weightInput, '100')
        await user.type(repsInput, '8')
        await user.type(rirInput, '2')
      }
      // Subsequent sets use pre-filled values from previous set

      await user.click(getByRole('button', { name: /complete set/i }))
    }

    // All 3 sets should appear in history (verify by counting completed set text patterns)
    await waitFor(() => {
      const completedSets = screen.getAllByText(/100kg × 8/)
      expect(completedSets.length).toBe(3)
    })

    cleanup()
  })
})
