import { waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Workout Management', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Hybrid Workouts', () => {
    it('creates a workout with strength and timed blocks, executes it, and finishes', async () => {
      const { builder, workout, common, user, router, getByRole, queryByRole, getByText, queryByText, cleanup } = await createTestApp()

      // Start new workout from home page
      await user.click(getByRole('button', { name: /get started/i }))
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add a strength block (Bench Press)
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add AMRAP block with exercise
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

      // Use selectExercise helper to search and select (only 10 shown by default)
      await common.selectExercise('Push-ups')

      await user.click(common.getDialogButton('Add Block'))
      await common.waitForDialogClose()

      // Verify both blocks exist and start workout
      const playlistButtons = builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Start the workout
      await builder.startWorkout()

      // Verify we're in active mode showing "Block 1 of 2"
      await waitFor(() => {
        expect(queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Complete a set in the strength block
      expect(getByText('1/3')).toBeTruthy()
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Verify advanced to set 2/3
      expect(getByText('2/3')).toBeTruthy()
      expect(getByText(/80kg × 10/)).toBeTruthy()

      // Navigate to AMRAP block (block 2)
      await user.click(workout.getFooterButton('next'))

      // Verify we're on AMRAP block
      await waitFor(() => {
        expect(queryByText(/block 2 of 2/i)).toBeTruthy()
      })
      expect(queryByText('Push-ups')).toBeTruthy()

      // Verify AMRAP Start button exists
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      // Finish the workout via menu
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

      // Wait for completion screen
      await waitFor(() => {
        expect(queryByText(/workout complete/i)).toBeTruthy()
      })

      // Wait for View Details button to be clickable (animation needs to complete)
      const viewDetailsButton = await waitFor(
        () => {
          const button = getByRole('button', { name: /view details/i })
          // Ensure button animation has started (not opacity-0)
          if (button.classList.contains('opacity-0')) {
            throw new Error('Button still has opacity-0')
          }
          return button
        },
        { timeout: 2000 },
      )
      // Wait for animation to complete (100ms enter delay + 600ms animation delay + 500ms animation)
      await new Promise((resolve) => setTimeout(resolve, 700))
      await user.click(viewDetailsButton)

      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })
  })

  describe('Navigation', () => {
    it('navigates back and forth between blocks in active mode', async () => {
      const { builder, workout, common, user, getByRole, queryByText, cleanup } = await createTestApp()

      // Start workout
      await user.click(getByRole('button', { name: /get started/i }))

      // Add two strength blocks
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      await user.click(getByRole('button', { name: /add block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

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
  })

  describe('Resume', () => {
    it('shows "Start Workout" with Play icon for fresh workout', async () => {
      const { common, user, getByRole, cleanup } = await createTestApp()

      // Navigate to workout builder
      await user.click(getByRole('button', { name: /get started/i }))

      // Add an exercise block
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Verify the button shows "Start Workout" (not "Resume")
      // Button text "Start Workout" indicates fresh workout state
      const startButton = getByRole('button', { name: /start workout/i })
      expect(startButton).toBeDefined()

      // Verify no pulsing animation class (indicates fresh workout, not resuming)
      expect(startButton.className).not.toContain('animate-pulse-ring')

      cleanup()
    })

    it('shows "Resume Workout" with RotateCcw icon after completing a set', async () => {
      const { builder, workout, common, user, getByRole, queryByRole, cleanup } = await createTestApp()

      // Navigate to workout builder
      await user.click(getByRole('button', { name: /get started/i }))

      // Add an exercise block
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Start the workout
      await builder.startWorkout()

      // Fill in set values and complete the first set
      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Go back to builder mode - find back button by chevron icon
      const backButton = document.querySelector('header button')
      if (!(backButton instanceof HTMLElement)) {
        throw new Error('Back button not found')
      }
      await user.click(backButton)

      // Wait for builder mode to render
      await waitFor(() => {
        expect(queryByRole('button', { name: /resume workout/i })).toBeTruthy()
      })

      // Verify the button shows "Resume Workout"
      // Button text "Resume Workout" indicates workout in progress
      const resumeButton = getByRole('button', { name: /resume workout/i })
      expect(resumeButton).toBeDefined()

      // Verify pulsing animation class indicates workout in progress
      expect(resumeButton.className).toContain('animate-pulse-ring')

      cleanup()
    })

    it('allows resuming workout from Continue button', async () => {
      const { builder, workout, common, user, getByRole, queryByRole, getByText, cleanup } =
        await createTestApp()

      // Navigate to workout builder
      await user.click(getByRole('button', { name: /get started/i }))

      // Add an exercise block
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Start workout, complete a set, go back
      await builder.startWorkout()
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Go back to builder mode - find back button in header
      const backButton = document.querySelector('header button')
      if (!(backButton instanceof HTMLElement)) {
        throw new Error('Back button not found')
      }
      await user.click(backButton)

      // Wait for builder mode
      await waitFor(() => {
        expect(queryByRole('button', { name: /resume workout/i })).toBeTruthy()
      })

      // Click Resume Workout
      await user.click(getByRole('button', { name: /resume workout/i }))

      // Verify we're back in active mode by checking for timer badge
      await waitFor(() => {
        expect(queryByRole('timer')).toBeTruthy()
      })

      // Verify completed set is still visible in history
      expect(getByText(/100kg × 8/)).toBeDefined()

      cleanup()
    })

    it('shows duration badge with timer icon and pulsing indicator in active mode', async () => {
      const { builder, common, user, getByRole, queryByRole, cleanup } = await createTestApp()

      // Navigate to workout builder
      await user.click(getByRole('button', { name: /get started/i }))

      // Add an exercise block
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode to render and verify duration badge appears
      await waitFor(() => {
        expect(queryByRole('timer')).toBeTruthy()
      })

      // Verify the badge contains a time format (m:ss or mm:ss)
      const badge = document.querySelector('.tabular-nums')
      expect(badge).toBeTruthy()
      expect(badge?.textContent).toMatch(/^\d+:\d{2}$/)

      // Verify the pulsing dot indicator exists (animate-ping class)
      const pulsingDot = document.querySelector('.animate-ping')
      expect(pulsingDot).toBeTruthy()

      cleanup()
    })
  })

  describe('Cancel', () => {
    it('can cancel a workout and return to home', async () => {
      const { builder, workout, common, user, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start and add a block
      await user.click(getByRole('button', { name: /get started/i }))
      await user.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await user.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

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
  })
})
