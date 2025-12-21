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
      await builder.navigateTo()
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add a strength block (Bench Press)
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add AMRAP block with exercise
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()
      await userEvent.click(common.getDialogButton('AMRAP'))

      // Configure AMRAP dialog opens - wait for it
      await expect.element(page.getByRole('dialog')).toBeVisible()
      await expect.element(page.getByText(/Configure/)).toBeVisible()

      // Set duration to 8 minutes and add exercise
      await userEvent.click(common.getDialogButton('8'))
      await userEvent.click(common.getDialogButton('Add Exercise'))
      await common.selectExercise('Push-ups')

      await userEvent.click(common.getDialogButton('Add Block'))
      await common.waitForDialogClose()

      // Verify both blocks exist and start workout
      await builder.startWorkoutAndVerifyBlocks(2)

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

      // Finish the workout via menu (needs custom name so can't use endWorkoutAndNavigateToSummary)
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())

      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /end workout/i }).click()

      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /finish workout/i })).toBeVisible()

      const nameInput = page.getByRole('textbox', { name: /workout name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Hybrid Session')

      await userEvent.click(common.getDialogButton('Finish Workout'))

      // Wait for completion screen
      await expect.element(page.getByText(/workout complete/i)).toBeVisible()

      // Wait for View Details button to be clickable (animation needs to complete)
      const viewDetailsButton = page.getByRole('button', { name: /view details/i })
      await expect.element(viewDetailsButton, { timeout: 2000 }).toBeVisible()
      await expect.element(viewDetailsButton).not.toHaveClass('opacity-0')
      await new Promise((resolve) => setTimeout(resolve, 700))
      await viewDetailsButton.click()

      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })
  })

  describe('Navigation', () => {
    it('navigates back and forth between blocks in active mode', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      // Setup workout with two strength blocks and start
      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Deadlift'])
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
      const { builder, common, cleanup } = await createTestApp()

      // Navigate to workout builder and add an exercise block
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      expect(common.isDialogOpen()).toBe(false)

      // Verify the button shows "Start Workout" (not "Resume")
      const startButton = page.getByRole('button', { name: /start workout/i })
      await expect.element(startButton).toBeInTheDocument()

      // Verify no pulsing animation class (indicates fresh workout, not resuming)
      await expect.element(startButton).not.toHaveClass('animate-pulse-ring')

      cleanup()
    })

    it('shows "Resume Workout" with RotateCcw icon after completing a set', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      // Navigate to workout builder and add an exercise block
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      expect(common.isDialogOpen()).toBe(false)

      // Start the workout and complete a set
      await builder.startWorkout()
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Go back to builder mode
      await page.getByRole('button', { name: /go back/i }).click()

      // Wait for builder mode to render
      await expect.element(page.getByRole('button', { name: /resume workout/i })).toBeVisible()

      // Verify the button shows "Resume Workout"
      const resumeButton = page.getByRole('button', { name: /resume workout/i })
      await expect.element(resumeButton).toBeInTheDocument()

      // Verify pulsing animation class indicates workout in progress
      await expect.element(resumeButton).toHaveClass('animate-pulse-ring')

      cleanup()
    })

    it('allows resuming workout from Continue button', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      // Navigate to workout builder and add an exercise block
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      expect(common.isDialogOpen()).toBe(false)

      // Start workout, complete a set
      await builder.startWorkout()
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Go back to builder mode
      await page.getByRole('button', { name: /go back/i }).click()
      await expect.element(page.getByRole('button', { name: /resume workout/i })).toBeVisible()

      // Click Resume Workout
      await page.getByRole('button', { name: /resume workout/i }).click()

      // Verify we're back in active mode by checking for timer badge
      await expect.element(page.getByRole('timer')).toBeVisible()
      await expect.element(page.getByRole('table')).toBeVisible()

      cleanup()
    })

    it('shows duration badge with timer icon and pulsing indicator in active mode', async () => {
      const { builder, common, cleanup } = await createTestApp()

      // Navigate to workout builder and add an exercise block
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      expect(common.isDialogOpen()).toBe(false)

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

      // Navigate to builder, add a block, and start workout
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      await builder.startWorkout()
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
