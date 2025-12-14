import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'


describe('Timed Block Workflows', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Configuration', () => {
    it('allows user to add timed blocks from the dialog and start workout', async () => {
      const { builder, common, cleanup } =
        await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      // Verify exercises tab is default (check aria-selected attribute)
      await expect.element(page.getByRole('tab', { name: /exercises/i })).toHaveAttribute('aria-selected', 'true')

      // Switch to timed blocks tab
      await builder.switchToTimedBlocksTab()

      // Verify all block types are available
      await expect.element(page.getByText('AMRAP')).toBeInTheDocument()
      await expect.element(page.getByText('EMOM')).toBeInTheDocument()
      await expect.element(page.getByText('Tabata')).toBeInTheDocument()
      await expect.element(page.getByText('For Time')).toBeInTheDocument()

      // Select AMRAP - this opens a configuration dialog
      await userEvent.click(common.getDialogButton('AMRAP'))

      // Wait for configuration dialog
      await expect.element(page.getByRole('dialog')).toBeVisible()
      await expect.element(page.getByText(/Configure/)).toBeVisible()

      // Add an exercise to the AMRAP
      await userEvent.click(common.getDialogButton('Add Exercise'))
      await common.selectExercise('Push-ups')

      // Confirm the block by clicking "Add Block"
      await userEvent.click(common.getDialogButton('Add Block'))

      // Wait for dialog AND overlay to fully close
      await common.waitForDialogClose()

      // Verify AMRAP block appears in builder
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      // Start workout and verify timer UI
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Timer should display (verify Start button appears)
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()

      cleanup()
    })

    it('filters exercises when searching in add block dialog', async () => {
      const { builder, common, cleanup } =
        await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      // Multiple exercises should be visible initially
      await expect.element(page.getByText('Bench Press')).toBeInTheDocument()
      await expect.element(page.getByText('Squat', { exact: true })).toBeInTheDocument()

      // Type in search input
      await userEvent.fill(page.getByRole('textbox'), 'bench')

      // Only matching exercise should remain
      await expect.element(page.getByText('Bench Press')).toBeVisible()
      await expect.element(page.getByText('Squat', { exact: true })).not.toBeInTheDocument()

      // Select the filtered exercise and verify it adds to workout
      await userEvent.click(common.getDialogButton('Bench Press'))

      // Wait for dialog AND overlay to fully close
      await common.waitForDialogClose()

      // Verify exercise was added to builder
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      cleanup()
    })
  })

  describe('Execution', () => {
    it('creates AMRAP block and shows timer UI', async () => {
      const { builder, workout, common, router, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add AMRAP block
      await builder.addTimedBlock('AMRAP')

      // Verify block was added
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify AMRAP view is shown with Start button
      await expect.element(page.getByRole('heading', { name: /amrap/i })).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()

      // Verify rounds section exists
      await expect.element(page.getByText(/rounds/i)).toBeInTheDocument()

      // Verify +1 button exists
      await expect.element(page.getByRole('button', { name: /\+1/i })).toBeInTheDocument()

      // End workout via menu
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())

      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /end workout/i }).click()

      await common.waitForDialog()
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

    it('creates EMOM block and shows minute display', async () => {
      const { builder, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add EMOM block
      await builder.addTimedBlock('EMOM')

      // Start workout
      await builder.startWorkout()

      // Wait for active mode with EMOM
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify EMOM view shows minute counter (format: "1 / 10 MIN")
      await expect.element(page.getByText(/min/i)).toBeVisible()

      // Verify Start button exists
      await expect.element(page.getByRole('button', { name: /start/i })).toBeVisible()

      // Verify exercise is displayed
      await expect.element(page.getByText('Push-ups')).toBeVisible()

      cleanup()
    })

    it('creates Tabata block and shows round/phase info', async () => {
      const { builder, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add Tabata block
      await builder.addTimedBlock('Tabata')

      // Start workout
      await builder.startWorkout()

      // Wait for active mode with Tabata
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify Tabata view shows phase badge (exact uppercase match)
      await expect.element(page.getByText('WORK', { exact: true })).toBeInTheDocument()

      // Verify Start button exists
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()

      cleanup()
    })

    it('creates For Time block and completes with Done button', async () => {
      const { builder, common, router, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add For Time block
      await builder.addTimedBlock('For Time')

      // Start workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify For Time view is shown with Done button (not Start/Pause)
      await expect.element(page.getByRole('heading', { name: /for time/i })).toBeInTheDocument()
      const doneButton = page.getByRole('button', { name: /done/i })
      await expect.element(doneButton).toBeInTheDocument()

      // Click Done to complete the block
      await doneButton.click()

      // Should show finish workout dialog
      await common.waitForDialog()
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

    it('navigates between strength and timed blocks in hybrid workout', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add strength block first
      await page.getByRole('button', { name: /add first block/i }).click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add AMRAP block
      await builder.addTimedBlock('AMRAP')

      // Verify both blocks exist
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Start workout
      await builder.startWorkout()

      // Wait for active mode on first block (strength)
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Verify strength view shows Complete Set button
      await expect.element(page.getByRole('button', { name: /complete set/i })).toBeInTheDocument()

      // Navigate to AMRAP block
      await userEvent.click(await workout.getFooterButton('next'))

      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()

      // Verify AMRAP view shows Start button
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()

      // Navigate back to strength block
      await userEvent.click(await workout.getFooterButton('prev'))

      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Verify back on strength view
      await expect.element(page.getByRole('button', { name: /complete set/i })).toBeInTheDocument()

      cleanup()
    })

    it('AMRAP block allows incrementing rounds with +1 button', async () => {
      const { builder, workout, common, router, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add AMRAP block
      await builder.addTimedBlock('AMRAP')

      // Verify block was added
      expect((await builder.getPlaylistBlockButtons()).length).toBe(1)

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify AMRAP UI elements
      await expect.element(page.getByRole('heading', { name: /amrap/i })).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()
      await expect.element(page.getByText(/rounds/i)).toBeInTheDocument()

      // Start the timer by clicking Start
      await page.getByRole('button', { name: /start/i }).click()

      // Wait for +1 button to be enabled (timer must be running)
      await expect.poll(async () => {
        const plusButton = await page.getByRole('button', { name: /\+1/i }).element()
        if (plusButton instanceof HTMLButtonElement) {
          return !plusButton.disabled
        }
        return false
      }).toBe(true)

      // Increment rounds
      await page.getByRole('button', { name: /\+1/i }).click()
      await page.getByRole('button', { name: /\+1/i }).click()

      // End workout via menu
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())

      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /end workout/i }).click()

      await common.waitForDialog()
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

    it('timer button changes to Pause when running', async () => {
      const { builder, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add EMOM block
      await builder.addTimedBlock('EMOM')
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify Start button exists
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /pause/i })).not.toBeInTheDocument()

      // Click Start
      await page.getByRole('button', { name: /start/i }).click()

      // Verify button changed to Pause
      await expect.element(page.getByRole('button', { name: /pause/i })).toBeVisible()
      await expect.element(page.getByRole('button', { name: /start/i })).not.toBeInTheDocument()

      cleanup()
    })
  })

  describe('Complete Journeys', () => {
    it('completes AMRAP workout with rounds recorded', async () => {
      const { builder, workout, common, router, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add AMRAP block
      await builder.addTimedBlock('AMRAP')

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify AMRAP UI shows
      await expect.element(page.getByRole('heading', { name: /amrap/i })).toBeInTheDocument()
      await expect.element(page.getByText(/rounds/i)).toBeInTheDocument()

      // Start the timer
      await page.getByRole('button', { name: /start/i }).click()

      // Wait for +1 button to be enabled (timer must be running)
      await expect.poll(async () => {
        const plusButton = await page.getByRole('button', { name: /\+1/i }).element()
        if (plusButton instanceof HTMLButtonElement) {
          return !plusButton.disabled
        }
        return false
      }).toBe(true)

      // Click +1 to record rounds
      await page.getByRole('button', { name: /\+1/i }).click()
      await page.getByRole('button', { name: /\+1/i }).click()
      await page.getByRole('button', { name: /\+1/i }).click()

      // Verify rounds count shows 3
      await expect.element(page.getByText('3')).toBeVisible()

      // End workout via menu and verify summary page
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())

      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /end workout/i }).click()

      await common.waitForDialog()
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

      // Verify summary page shows the workout completed
      await expect.element(page.getByRole('heading', { name: /workout complete/i })).toBeVisible()

      cleanup()
    })

    it('runs EMOM workout and completes full journey', async () => {
      const { builder, workout, common, router, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add EMOM block
      await builder.addTimedBlock('EMOM')

      // Start workout
      await builder.startWorkout()

      // Wait for active mode with EMOM
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify EMOM view shows minute counter (format: "1 / 10 MIN")
      await expect.element(page.getByText(/min/i)).toBeInTheDocument()
      await expect.element(page.getByText('Push-ups')).toBeInTheDocument()

      // Verify Start button is available
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()

      // End workout via menu and verify we reach summary
      await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
      await userEvent.click(await workout.getMenuTrigger())

      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /end workout/i }).click()

      await common.waitForDialog()
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

      // Verify summary page shows workout completed
      await expect.element(page.getByRole('heading', { name: /workout complete/i })).toBeVisible()

      cleanup()
    })
  })
})
