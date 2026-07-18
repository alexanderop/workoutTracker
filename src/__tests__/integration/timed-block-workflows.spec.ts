import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Timed Block Workflows', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Configuration', () => {
    it('allows user to add timed blocks from the dialog and start workout', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      // Verify exercises tab is default (check aria-selected attribute)
      await expect
        .element(page.getByRole('tab', { name: /exercises/i }))
        .toHaveAttribute('aria-selected', 'true')

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
      expect(playlistButtons).toHaveLength(1)

      // Start workout and verify timer UI
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Timer should display (verify Start button appears)
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()

      cleanup()
    })

    it('filters exercises when searching in add block dialog', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      // Multiple exercises should be visible initially (at top of alphabetical list)
      await expect.element(page.getByText('Assisted Pull-up Machine')).toBeInTheDocument()
      await expect.element(page.getByText('Barbell Row')).toBeInTheDocument()

      // Type in search input to filter
      await userEvent.fill(page.getByRole('textbox'), 'barbell row')

      // Only matching exercise should remain
      await expect.element(page.getByText('Barbell Row')).toBeVisible()
      await expect.element(page.getByText('Assisted Pull-up Machine')).not.toBeInTheDocument()

      // Select the filtered exercise and verify it adds to workout
      await userEvent.click(common.getDialogButton('Barbell Row'))

      // Wait for dialog AND overlay to fully close
      await common.waitForDialogClose()

      // Verify exercise was added to builder
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons).toHaveLength(1)

      cleanup()
    })
  })

  describe('Execution', () => {
    it('creates AMRAP block and shows timer UI', async () => {
      const { builder, workout, router, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.addTimedBlock('AMRAP')
      await builder.startWorkoutAndVerifyBlocks(1)

      // Verify AMRAP view is shown with Start button
      await expect.element(page.getByRole('heading', { name: /amrap/i })).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()
      await expect.element(page.getByText(/rounds/i)).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /\+1/i })).toBeInTheDocument()

      await workout.endWorkoutAndNavigateToSummary()
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })

    it('creates EMOM block and shows minute display', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.addTimedBlock('EMOM')
      await builder.startWorkoutAndVerifyBlocks(1)

      // Verify EMOM view shows minute counter and exercise
      await expect.element(page.getByText(/min/i)).toBeVisible()
      await expect.element(page.getByRole('button', { name: /start/i })).toBeVisible()
      await expect.element(page.getByText('Push-ups')).toBeVisible()

      cleanup()
    })

    it('creates Tabata block and shows round/phase info', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.addTimedBlock('Tabata')
      await builder.startWorkoutAndVerifyBlocks(1)

      // Verify Tabata view shows phase badge and start button
      await expect.element(page.getByText('WORK', { exact: true })).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()

      cleanup()
    })

    it('creates For Time block and completes with Done button', async () => {
      const { builder, common, router, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.addTimedBlock('For Time')
      await builder.startWorkoutAndVerifyBlocks(1)

      // Verify For Time view is shown with Done button (not Start/Pause)
      await expect.element(page.getByRole('heading', { name: /for time/i })).toBeInTheDocument()
      const doneButton = page.getByRole('button', { name: /done/i })
      await expect.element(doneButton).toBeInTheDocument()

      // Click Done - this directly opens the finish workout dialog (unlike other blocks)
      await doneButton.click()
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Finish Workout'))

      // Wait for completion screen and navigate to summary
      await expect.element(page.getByText(/workout complete/i)).toBeVisible()
      const viewDetailsButton = page.getByRole('button', { name: /view details/i })
      await expect.element(viewDetailsButton, { timeout: 2000 }).toBeVisible()
      await expect
        .poll(
          async () => {
            const element = await viewDetailsButton.element()
            return getComputedStyle(element).opacity
          },
          { timeout: 2000 },
        )
        .toBe('1')
      await viewDetailsButton.click()

      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })

    it('navigates between strength and timed blocks in hybrid workout', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      // Add strength block first, then AMRAP block
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      // Search for exact exercise to avoid ambiguous matches with Smith Machine Bench Press
      await userEvent.fill(page.getByRole('textbox'), 'Bench Press')
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()
      await builder.addTimedBlock('AMRAP')
      await builder.startWorkoutAndVerifyBlocks(2)

      // Verify strength view shows Complete Set button
      await expect.element(page.getByRole('button', { name: /complete set/i })).toBeInTheDocument()

      // Navigate to AMRAP block
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()

      // Navigate back to strength block
      await userEvent.click(await workout.getFooterButton('prev'))
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()
      await expect.element(page.getByRole('button', { name: /complete set/i })).toBeInTheDocument()

      cleanup()
    })

    it('AMRAP block allows incrementing rounds with +1 button', async () => {
      const { builder, workout, router, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.addTimedBlock('AMRAP')
      await builder.startWorkoutAndVerifyBlocks(1)

      // Verify AMRAP UI elements
      await expect.element(page.getByRole('heading', { name: /amrap/i })).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()
      await expect.element(page.getByText(/rounds/i)).toBeInTheDocument()

      // Start the timer
      await page.getByRole('button', { name: /start/i }).click()

      // Wait for +1 button to be enabled (timer must be running)
      await expect
        .poll(async () => {
          const plusButton = await page.getByRole('button', { name: /\+1/i }).element()
          return plusButton instanceof HTMLButtonElement && !plusButton.disabled
        })
        .toBe(true)

      // Increment rounds
      await page.getByRole('button', { name: /\+1/i }).click()
      await page.getByRole('button', { name: /\+1/i }).click()

      await workout.endWorkoutAndNavigateToSummary()
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })

    it('timer button changes to Pause when running', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.addTimedBlock('EMOM')
      await builder.startWorkoutAndVerifyBlocks(1)

      // Verify Start button exists (not Pause)
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
      const { builder, workout, router, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.addTimedBlock('AMRAP')
      await builder.startWorkoutAndVerifyBlocks(1)

      // Verify AMRAP UI shows
      await expect.element(page.getByRole('heading', { name: /amrap/i })).toBeInTheDocument()
      await expect.element(page.getByText(/rounds/i)).toBeInTheDocument()

      // Start the timer
      await page.getByRole('button', { name: /start/i }).click()

      // Wait for +1 button to be enabled (timer must be running)
      await expect
        .poll(async () => {
          const plusButton = await page.getByRole('button', { name: /\+1/i }).element()
          return plusButton instanceof HTMLButtonElement && !plusButton.disabled
        })
        .toBe(true)

      // Click +1 to record 3 rounds
      await page.getByRole('button', { name: /\+1/i }).click()
      await page.getByRole('button', { name: /\+1/i }).click()
      await page.getByRole('button', { name: /\+1/i }).click()

      await expect.element(page.getByText('3')).toBeVisible()

      await workout.endWorkoutAndNavigateToSummary()
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)
      await expect.element(page.getByRole('heading', { name: /workout complete/i })).toBeVisible()

      cleanup()
    })

    it('runs EMOM workout and completes full journey', async () => {
      const { builder, workout, router, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.addTimedBlock('EMOM')
      await builder.startWorkoutAndVerifyBlocks(1)

      // Verify EMOM view shows minute counter and exercise
      await expect.element(page.getByText(/min/i)).toBeInTheDocument()
      await expect.element(page.getByText('Push-ups')).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /start/i })).toBeInTheDocument()

      await workout.endWorkoutAndNavigateToSummary()
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)
      await expect.element(page.getByRole('heading', { name: /workout complete/i })).toBeVisible()

      cleanup()
    })
  })
})
