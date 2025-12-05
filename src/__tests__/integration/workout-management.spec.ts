import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

describe('Workout Management', () => {
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

      // Wait for dialog to close
      await waitFor(() => {
        expect(queryByRole('dialog')).toBeNull()
      })

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
      await user.click(common.getDialogButton('Push-ups'))
      await user.click(common.getDialogButton('Add Block'))

      // Wait for dialog to close
      await waitFor(() => {
        expect(queryByRole('dialog')).toBeNull()
      })

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

      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })
  })

  describe('Navigation', () => {
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
      const startButton = getByRole('button', { name: /start workout/i })
      expect(startButton).toBeDefined()

      // Verify Play icon is present (not RotateCcw)
      const playIcon = startButton.querySelector('svg.lucide-play')
      const rotateIcon = startButton.querySelector('svg.lucide-rotate-ccw')
      expect(playIcon).toBeTruthy()
      expect(rotateIcon).toBeFalsy()

      // Verify no pulsing animation class
      expect(startButton.className).not.toContain('animate-pulse-ring')

      cleanup()
    })

    it('shows "Resume Workout" with RotateCcw icon after completing a set', async () => {
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

      // Fill in set values and complete the first set
      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
      const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

      await user.type(weightInput, '100')
      await user.type(repsInput, '8')
      await user.type(rirInput, '2')
      await user.click(getByRole('button', { name: /complete set/i }))

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
      const resumeButton = getByRole('button', { name: /resume workout/i })
      expect(resumeButton).toBeDefined()

      // Verify RotateCcw icon is present (not Play)
      const rotateIcon = resumeButton.querySelector('svg.lucide-rotate-ccw')
      const playIcon = resumeButton.querySelector('svg.lucide-play')
      expect(rotateIcon).toBeTruthy()
      expect(playIcon).toBeFalsy()

      // Verify pulsing animation class is applied
      expect(resumeButton.className).toContain('animate-pulse-ring')

      cleanup()
    })

    it('allows resuming workout from Continue button', async () => {
      const { builder, common, user, getByRole, queryByRole, getByText, cleanup } =
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
      const weightInput = screen.getByRole('spinbutton', { name: /weight/i })
      const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
      const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })
      await user.type(weightInput, '100')
      await user.type(repsInput, '8')
      await user.type(rirInput, '2')
      await user.click(getByRole('button', { name: /complete set/i }))

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
        const timerIcon = document.querySelector('svg[class*="lucide-timer"]')
        expect(timerIcon).toBeTruthy()
      })

      // Verify completed set is still visible in history
      expect(getByText(/100kg × 8/)).toBeDefined()

      cleanup()
    })

    it('shows duration badge with timer icon and pulsing indicator in active mode', async () => {
      const { builder, common, user, getByRole, cleanup } = await createTestApp()

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
        // Look for the duration badge with timer icon (lucide-timer-icon class)
        const timerIcon = document.querySelector('svg[class*="lucide-timer"]')
        expect(timerIcon).toBeTruthy()
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
  })
})
