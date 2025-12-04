import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

// Helper to wait for debounced auto-save to complete
// The useWorkoutPersistence composable has a 1000ms debounced auto-save
const waitForDebouncedSave = () => new Promise((r) => setTimeout(r, 1100))

describe('Full Workout Flow', () => {
  beforeEach(async () => {
    // Wait for any pending debounced saves from previous test suite
    await waitForDebouncedSave()
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
    const app = await createTestApp()

    // ==================================================
    // PHASE 1: Start new workout from home page
    // ==================================================
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    expect(app.router.currentRoute.value.path).toBe('/workout/active')

    // ==================================================
    // PHASE 2: Add a strength block (Bench Press)
    // ==================================================
    await app.user.click(app.getByRole('button', { name: /add first block/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))

    // Wait for dialog to close
    await waitFor(() => {
      expect(app.queryByRole('dialog')).toBeNull()
    })

    // ==================================================
    // PHASE 3: Add AMRAP block with exercise
    // ==================================================
    await app.user.click(app.getByRole('button', { name: /add block/i }))
    await app.waitForDialog()

    // Switch to Timed Blocks tab
    await app.user.click(app.getByRole('tab', { name: /timed blocks/i }))

    // Click AMRAP option
    await app.user.click(app.getDialogButton('AMRAP'))

    // Configure AMRAP dialog opens - wait for it
    await waitFor(() => {
      const dialog = app.getByRole('dialog')
      expect(dialog.textContent).toContain('Configure')
    })

    // Set duration to 8 minutes and add exercise
    await app.user.click(app.getDialogButton('8'))
    await app.user.click(app.getDialogButton('Add Exercise'))
    await app.user.click(app.getDialogButton('Push-ups'))
    await app.user.click(app.getDialogButton('Add Block'))

    // Wait for dialog to close
    await waitFor(() => {
      expect(app.queryByRole('dialog')).toBeNull()
    })

    // ==================================================
    // PHASE 4: Verify both blocks exist and start workout
    // ==================================================
    const playlistButtons = app.getPlaylistBlockButtons()
    expect(playlistButtons.length).toBe(2)

    // Start the workout
    await app.startWorkout()

    // Verify we're in active mode showing "Block 1 of 2"
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 2/i)).toBeTruthy()
    })

    // ==================================================
    // PHASE 5: Complete a set in the strength block
    // ==================================================
    expect(app.getByText('1/3')).toBeTruthy()

    const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
    const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
    const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

    await app.user.type(weightInput, '80')
    await app.user.type(repsInput, '10')
    await app.user.type(rirInput, '2')

    await app.user.click(app.getByRole('button', { name: /complete set/i }))

    // Verify advanced to set 2/3
    expect(app.getByText('2/3')).toBeTruthy()
    expect(app.getByText(/80kg × 10/)).toBeTruthy()

    // ==================================================
    // PHASE 6: Navigate to AMRAP block (block 2)
    // ==================================================
    await app.user.click(app.getFooterButton('next'))

    // Verify we're on AMRAP block
    await waitFor(() => {
      expect(app.queryByText(/block 2 of 2/i)).toBeTruthy()
    })
    expect(app.queryByText('Push-ups')).toBeTruthy()

    // ==================================================
    // PHASE 7: Verify AMRAP Start button exists
    // ==================================================
    // The Start button exists for timed blocks
    expect(app.queryByRole('button', { name: /start/i })).toBeTruthy()

    // ==================================================
    // PHASE 8: Finish the workout via menu
    // ==================================================
    // Wait for the dropdown menu trigger to appear and click it
    await waitFor(() => {
      expect(app.getMenuTrigger()).toBeTruthy()
    })
    await app.user.click(app.getMenuTrigger())

    // Wait for menu to open and click End Workout
    await waitFor(() => {
      expect(app.queryByRole('menuitem', { name: /end workout/i })).toBeTruthy()
    })
    await app.user.click(app.getByRole('menuitem', { name: /end workout/i }))

    await app.waitForDialog()
    // Dialog title is "Finish Workout?" - verify dialog is open
    expect(app.queryByRole('heading', { name: /finish workout/i })).toBeTruthy()

    const nameInput = app.getByRole('textbox', { name: /workout name/i })
    await app.user.clear(nameInput)
    await app.user.type(nameInput, 'Hybrid Session')

    await app.user.click(app.getDialogButton('Finish Workout'))

    await app.waitForRoute(/^\/workout\/summary\//)
    expect(app.router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

    app.cleanup()
  })

  it('navigates back and forth between blocks in active mode', async () => {
    const app = await createTestApp()

    // Start workout
    await app.user.click(app.getByRole('button', { name: /get started/i }))

    // Add two strength blocks
    await app.user.click(app.getByRole('button', { name: /add first block/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))
    await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

    await app.user.click(app.getByRole('button', { name: /add block/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Deadlift'))
    await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

    // Start workout
    await app.startWorkout()
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 2/i)).toBeTruthy()
    })

    // Navigate to next block
    await app.user.click(app.getFooterButton('next'))

    await waitFor(() => {
      expect(app.queryByText(/block 2 of 2/i)).toBeTruthy()
    })
    expect(app.queryByText('Deadlift')).toBeTruthy()

    // Navigate back to first block
    await app.user.click(app.getFooterButton('prev'))

    await waitFor(() => {
      expect(app.queryByText(/block 1 of 2/i)).toBeTruthy()
    })
    expect(app.queryByText('Bench Press')).toBeTruthy()

    app.cleanup()
  })

  it('can cancel a workout and return to home', async () => {
    const app = await createTestApp()

    // Start and add a block
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    await app.user.click(app.getByRole('button', { name: /add first block/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))
    await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

    // Start workout
    await app.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
    })

    // Open menu and cancel - wait for the menu trigger to be available
    await waitFor(() => {
      expect(app.getMenuTrigger()).toBeTruthy()
    })
    await app.user.click(app.getMenuTrigger())

    // Wait for menu to open and click Cancel Workout
    await waitFor(() => {
      expect(app.queryByRole('menuitem', { name: /cancel workout/i })).toBeTruthy()
    })
    await app.user.click(app.getByRole('menuitem', { name: /cancel workout/i }))

    // Confirm cancel dialog (button is "Delete Workout")
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Delete Workout'))

    // Verify we're back at home
    await app.waitForRoute(/^\/$/)
    expect(app.router.currentRoute.value.path).toBe('/')

    app.cleanup()
  })

  it('completes all sets in a strength block', async () => {
    const app = await createTestApp()

    // Start workout with one exercise
    await app.user.click(app.getByRole('button', { name: /get started/i }))
    await app.user.click(app.getByRole('button', { name: /add first block/i }))
    await app.waitForDialog()
    await app.user.click(app.getDialogButton('Bench Press'))
    await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

    await app.startWorkout()

    // Wait for active mode
    await waitFor(() => {
      expect(app.getByText('1/3')).toBeTruthy()
    })

    // Complete all 3 sets
    for (let setNum = 1; setNum <= 3; setNum++) {
      expect(app.getByText(`${setNum}/3`)).toBeTruthy()

      if (setNum === 1) {
        // First set needs initial values
        const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
        const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
        const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

        await app.user.type(weightInput, '100')
        await app.user.type(repsInput, '8')
        await app.user.type(rirInput, '2')
      }
      // Subsequent sets use pre-filled values from previous set

      await app.user.click(app.getByRole('button', { name: /complete set/i }))
    }

    // All 3 sets should appear in history (verify by counting completed set text patterns)
    await waitFor(() => {
      const completedSets = screen.getAllByText(/100kg × 8/)
      expect(completedSets.length).toBe(3)
    })

    app.cleanup()
  })
})
