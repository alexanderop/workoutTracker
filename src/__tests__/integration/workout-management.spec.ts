import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Workout Management', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Hybrid Workouts', () => {
    it('creates a workout with strength and timed blocks, executes it, and finishes', async () => {
      const { builder, workout, common, router, cleanup } = await createTestApp()

      // Start new workout from home page
      await page.getByRole('button', { name: /start new workout/i }).click()
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add a strength block (Bench Press)
      await page.getByRole('button', { name: /add first block/i }).click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add AMRAP block with exercise
      await page.getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()

      // Switch to Timed Blocks tab
      await page.getByRole('tab', { name: /timed blocks/i }).click()

      // Click AMRAP option
      await userEvent.click(common.getDialogButton('AMRAP'))

      // Configure AMRAP dialog opens - wait for it
      await expect.element(page.getByRole('dialog')).toBeVisible()
      await expect.element(page.getByText(/Configure/)).toBeVisible()

      // Set duration to 8 minutes and add exercise
      await userEvent.click(common.getDialogButton('8'))
      await userEvent.click(common.getDialogButton('Add Exercise'))

      // Use selectExercise helper to search and select (only 10 shown by default)
      await common.selectExercise('Push-ups')

      await userEvent.click(common.getDialogButton('Add Block'))
      await common.waitForDialogClose()

      // Verify both blocks exist and start workout
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Start the workout
      await builder.startWorkout()

      // Verify we're in active mode showing "Block 1 of 2"
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Complete a set in the strength block - wait for table to render
      await expect.element(page.getByRole('table')).toBeVisible()
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Navigate to AMRAP block (block 2)
      await userEvent.click(await workout.getFooterButton('next'))

      // Verify we're on AMRAP block
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()
      await expect.element(page.getByText('Push-ups')).toBeVisible()

      // Verify AMRAP Start button exists
      await expect.element(page.getByRole('button', { name: /start/i })).toBeVisible()

      // Finish the workout via menu
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())

      // Wait for menu to open and click End Workout
      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /end workout/i }).click()

      await common.waitForDialog()
      // Dialog title is "Finish Workout?" - verify dialog is open
      await expect.element(page.getByRole('heading', { name: /finish workout/i })).toBeVisible()

      const nameInput = page.getByRole('textbox', { name: /workout name/i })
      await userEvent.clear(await nameInput.element())
      await userEvent.fill(await nameInput.element(), 'Hybrid Session')

      await userEvent.click(common.getDialogButton('Finish Workout'))

      // Wait for completion screen
      await expect.element(page.getByText(/workout complete/i)).toBeVisible()

      // Wait for View Details button to be clickable (animation needs to complete)
      const viewDetailsButton = page.getByRole('button', { name: /view details/i })
      await expect.element(viewDetailsButton, { timeout: 2000 }).toBeVisible()
      await expect.element(viewDetailsButton).not.toHaveClass('opacity-0')
      // Wait for animation to complete (100ms enter delay + 600ms animation delay + 500ms animation)
      await new Promise((resolve) => setTimeout(resolve, 700))
      await viewDetailsButton.click()

      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })
  })

  describe('Navigation', () => {
    it('navigates back and forth between blocks in active mode', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      // Start workout
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add two strength blocks
      await page.getByRole('button', { name: /add first block/i }).click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      await page.getByRole('button', { name: /add block/i }).click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      // Start workout
      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Navigate to next block
      await userEvent.click(await workout.getFooterButton('next'))

      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()
      await expect.element(page.getByText('Deadlift')).toBeInTheDocument()

      // Navigate back to first block
      await userEvent.click(await workout.getFooterButton('prev'))

      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()
      await expect.element(page.getByText('Bench Press')).toBeInTheDocument()

      cleanup()
    })
  })

  describe('Resume', () => {
    it('shows "Start Workout" with Play icon for fresh workout', async () => {
      const { common, cleanup } = await createTestApp()

      // Navigate to workout builder
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add an exercise block
      await page.getByRole('button', { name: /add first block/i }).click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Verify the button shows "Start Workout" (not "Resume")
      // Button text "Start Workout" indicates fresh workout state
      const startButton = page.getByRole('button', { name: /start workout/i })
      await expect.element(startButton).toBeInTheDocument()

      // Verify no pulsing animation class (indicates fresh workout, not resuming)
      await expect.element(startButton).not.toHaveClass('animate-pulse-ring')

      cleanup()
    })

    it('shows "Resume Workout" with RotateCcw icon after completing a set', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      // Navigate to workout builder
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add an exercise block
      await page.getByRole('button', { name: /add first block/i }).click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Start the workout
      await builder.startWorkout()

      // Fill in set values and complete the first set
      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Go back to builder mode
      await page.getByRole('button', { name: /go back/i }).click()

      // Wait for builder mode to render
      await expect.element(page.getByRole('button', { name: /resume workout/i })).toBeVisible()

      // Verify the button shows "Resume Workout"
      // Button text "Resume Workout" indicates workout in progress
      const resumeButton = page.getByRole('button', { name: /resume workout/i })
      await expect.element(resumeButton).toBeInTheDocument()

      // Verify pulsing animation class indicates workout in progress
      await expect.element(resumeButton).toHaveClass('animate-pulse-ring')

      cleanup()
    })

    it('allows resuming workout from Continue button', async () => {
      const { builder, workout, common, cleanup } =
        await createTestApp()

      // Navigate to workout builder
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add an exercise block
      await page.getByRole('button', { name: /add first block/i }).click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Start workout, complete a set, go back
      await builder.startWorkout()
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Go back to builder mode
      await page.getByRole('button', { name: /go back/i }).click()

      // Wait for builder mode
      await expect.element(page.getByRole('button', { name: /resume workout/i })).toBeVisible()

      // Click Resume Workout
      await page.getByRole('button', { name: /resume workout/i }).click()

      // Verify we're back in active mode by checking for timer badge
      await expect.element(page.getByRole('timer')).toBeVisible()

      // Verify table is visible with the resumed workout data
      await expect.element(page.getByRole('table')).toBeVisible()

      cleanup()
    })

    it('shows duration badge with timer icon and pulsing indicator in active mode', async () => {
      const { builder, common, cleanup } = await createTestApp()

      // Navigate to workout builder
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add an exercise block
      await page.getByRole('button', { name: /add first block/i }).click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      common.assertDialogClosed()

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode to render and verify duration badge appears
      await expect.element(page.getByRole('timer')).toBeVisible()

      // Verify the badge contains a time format (m:ss or mm:ss)
      await expect.poll(async () => {
        const badge = document.querySelector('.tabular-nums')
        return badge?.textContent?.match(/^\d+:\d{2}$/)
      }).toBeTruthy()

      // Verify the pulsing dot indicator exists (animate-ping class)
      await expect.poll(() => {
        const pulsingDot = document.querySelector('.animate-ping')
        return pulsingDot !== null
      }).toBe(true)

      cleanup()
    })
  })

  describe('Cancel', () => {
    it('can cancel a workout and return to home', async () => {
      const { builder, workout, common, router, cleanup } = await createTestApp()

      // Start and add a block
      await page.getByRole('button', { name: /start new workout/i }).click()
      await page.getByRole('button', { name: /add first block/i }).click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Start workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Open menu and cancel - wait for the menu trigger to be available
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())

      // Wait for menu to open and click Cancel Workout
      await expect.element(page.getByRole('menuitem', { name: /cancel workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /cancel workout/i }).click()

      // Confirm cancel dialog (button is "Delete Workout")
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Delete Workout'))

      // Verify we're back at home
      await common.waitForRoute(/^\/$/)
      expect(router.currentRoute.value.path).toBe('/')

      cleanup()
    })
  })
})
