import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

// Helper to end workout via menu
async function endWorkoutViaMenu(
  workout: Awaited<ReturnType<typeof createTestApp>>['workout'],
  common: Awaited<ReturnType<typeof createTestApp>>['common'],
  getByRole: Awaited<ReturnType<typeof createTestApp>>['getByRole'],
  _queryByRole: Awaited<ReturnType<typeof createTestApp>>['queryByRole'],
  _queryByText: Awaited<ReturnType<typeof createTestApp>>['queryByText'],
) {
  await expect.poll(() => workout.getMenuTrigger()).toBeTruthy()
  await userEvent.click(workout.getMenuTrigger())

  await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
  await userEvent.click(getByRole('menuitem', { name: /end workout/i }))

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
}

describe('Timed Block Workflows', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Configuration', () => {
    it('allows user to add timed blocks from the dialog and start workout', async () => {
      const { builder, getByRole, queryByText, queryByRole, common, cleanup } =
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
      const playlistButtons = builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      // Start workout and verify timer UI
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Timer should display (verify Start button appears)
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      cleanup()
    })

    it('filters exercises when searching in add block dialog', async () => {
      const { builder, getByRole, queryByText, common, cleanup } =
        await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      // Multiple exercises should be visible initially
      expect(queryByText('Bench Press')).toBeTruthy()
      expect(queryByText('Squat')).toBeTruthy()

      // Type in search input
      const searchInput = getByRole('textbox')
      await userEvent.fill(searchInput, 'bench')

      // Only matching exercise should remain
      await expect.element(page.getByText('Bench Press')).toBeVisible()
      await expect.element(page.getByText('Squat')).not.toBeInTheDocument()

      // Select the filtered exercise and verify it adds to workout
      await userEvent.click(common.getDialogButton('Bench Press'))

      // Wait for dialog AND overlay to fully close
      await common.waitForDialogClose()

      // Verify exercise was added to builder
      const playlistButtons = builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      cleanup()
    })
  })

  describe('Execution', () => {
    it('creates AMRAP block and shows timer UI', async () => {
      const { builder, workout, common, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add AMRAP block
      await builder.addTimedBlock('AMRAP')

      // Verify block was added
      const playlistButtons = builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify AMRAP view is shown with Start button
      expect(queryByRole('heading', { name: /amrap/i })).toBeTruthy()
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      // Verify rounds section exists
      expect(queryByText(/rounds/i)).toBeTruthy()

      // Verify +1 button exists
      expect(queryByRole('button', { name: /\+1/i })).toBeTruthy()

      // End workout via menu
      await endWorkoutViaMenu(workout, common, getByRole, queryByRole, queryByText)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })

    it('creates EMOM block and shows minute display', async () => {
      const { builder, getByRole, cleanup } = await createTestApp()

      // Start new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

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
      const { builder, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

      // Add Tabata block
      await builder.addTimedBlock('Tabata')

      // Start workout
      await builder.startWorkout()

      // Wait for active mode with Tabata
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify Tabata view shows phase badge (exact uppercase match)
      expect(queryByText('WORK')).toBeTruthy()

      // Verify Start button exists
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      cleanup()
    })

    it('creates For Time block and completes with Done button', async () => {
      const { builder, common, router, getByRole, queryByRole, cleanup } = await createTestApp()

      // Start new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

      // Add For Time block
      await builder.addTimedBlock('For Time')

      // Start workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify For Time view is shown with Done button (not Start/Pause)
      expect(queryByRole('heading', { name: /for time/i })).toBeTruthy()
      const doneButton = queryByRole('button', { name: /done/i })
      expect(doneButton).toBeTruthy()

      // Click Done to complete the block
      await userEvent.click(doneButton!)

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
      const { builder, workout, common, getByRole, queryByRole, cleanup } = await createTestApp()

      // Start new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

      // Add strength block first
      await userEvent.click(getByRole('button', { name: /add first block/i }))
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add AMRAP block
      await builder.addTimedBlock('AMRAP')

      // Verify both blocks exist
      const playlistButtons = builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Start workout
      await builder.startWorkout()

      // Wait for active mode on first block (strength)
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Verify strength view shows Complete Set button
      expect(queryByRole('button', { name: /complete set/i })).toBeTruthy()

      // Navigate to AMRAP block
      await userEvent.click(workout.getFooterButton('next'))

      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()

      // Verify AMRAP view shows Start button
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      // Navigate back to strength block
      await userEvent.click(workout.getFooterButton('prev'))

      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Verify back on strength view
      expect(queryByRole('button', { name: /complete set/i })).toBeTruthy()

      cleanup()
    })

    it('AMRAP block allows incrementing rounds with +1 button', async () => {
      const { builder, workout, common, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

      // Add AMRAP block
      await builder.addTimedBlock('AMRAP')

      // Verify block was added
      expect(builder.getPlaylistBlockButtons().length).toBe(1)

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify AMRAP UI elements
      expect(queryByRole('heading', { name: /amrap/i })).toBeTruthy()
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()
      expect(queryByText(/rounds/i)).toBeTruthy()

      // Start the timer by clicking Start
      await userEvent.click(getByRole('button', { name: /start/i }))

      // Wait for +1 button to be enabled (timer must be running)
      await expect.poll(() => {
        const plusButton = queryByRole('button', { name: /\+1/i })
        if (plusButton instanceof HTMLButtonElement) {
          return !plusButton.disabled
        }
        return false
      }).toBe(true)

      // Increment rounds
      await userEvent.click(getByRole('button', { name: /\+1/i }))
      await userEvent.click(getByRole('button', { name: /\+1/i }))

      // End workout via menu
      await endWorkoutViaMenu(workout, common, getByRole, queryByRole, queryByText)

      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })

    it('timer button changes to Pause when running', async () => {
      const { builder, getByRole, queryByRole, cleanup } = await createTestApp()

      // Start new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

      // Add EMOM block
      await builder.addTimedBlock('EMOM')
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify Start button exists
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()
      expect(queryByRole('button', { name: /pause/i })).toBeNull()

      // Click Start
      await userEvent.click(getByRole('button', { name: /start/i }))

      // Verify button changed to Pause
      await expect.element(page.getByRole('button', { name: /pause/i })).toBeVisible()
      expect(queryByRole('button', { name: /start/i })).toBeNull()

      cleanup()
    })
  })

  describe('Complete Journeys', () => {
    it('completes AMRAP workout with rounds recorded', async () => {
      const { builder, workout, common, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add AMRAP block
      await builder.addTimedBlock('AMRAP')

      // Start the workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify AMRAP UI shows
      expect(queryByRole('heading', { name: /amrap/i })).toBeTruthy()
      expect(queryByText(/rounds/i)).toBeTruthy()

      // Start the timer
      await userEvent.click(getByRole('button', { name: /start/i }))

      // Wait for +1 button to be enabled (timer must be running)
      await expect.poll(() => {
        const plusButton = queryByRole('button', { name: /\+1/i })
        if (plusButton instanceof HTMLButtonElement) {
          return !plusButton.disabled
        }
        return false
      }).toBe(true)

      // Click +1 to record rounds
      await userEvent.click(getByRole('button', { name: /\+1/i }))
      await userEvent.click(getByRole('button', { name: /\+1/i }))
      await userEvent.click(getByRole('button', { name: /\+1/i }))

      // Verify rounds count shows 3
      await expect.element(page.getByText('3')).toBeVisible()

      // End workout via menu and verify summary page
      await endWorkoutViaMenu(workout, common, getByRole, queryByRole, queryByText)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      // Verify summary page shows the workout completed
      await expect.element(page.getByRole('heading', { name: /workout complete/i })).toBeVisible()

      cleanup()
    })

    it('runs EMOM workout and completes full journey', async () => {
      const { builder, workout, common, router, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Start new workout
      await userEvent.click(getByRole('button', { name: /start new workout/i }))

      // Add EMOM block
      await builder.addTimedBlock('EMOM')

      // Start workout
      await builder.startWorkout()

      // Wait for active mode with EMOM
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify EMOM view shows minute counter (format: "1 / 10 MIN")
      expect(queryByText(/min/i)).toBeTruthy()
      expect(queryByText('Push-ups')).toBeTruthy()

      // Verify Start button is available
      expect(queryByRole('button', { name: /start/i })).toBeTruthy()

      // End workout via menu and verify we reach summary
      await endWorkoutViaMenu(workout, common, getByRole, queryByRole, queryByText)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      // Verify summary page shows workout completed
      await expect.element(page.getByRole('heading', { name: /workout complete/i })).toBeVisible()

      cleanup()
    })
  })
})
