import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Cardio Block Workflows', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Configuration', () => {
    it('shows cardio option in timed blocks tab', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()

      // Verify Cardio appears alongside other timed block types
      await expect.element(page.getByText('AMRAP')).toBeInTheDocument()
      await expect.element(page.getByText('EMOM')).toBeInTheDocument()
      await expect.element(page.getByText('Cardio')).toBeInTheDocument()

      cleanup()
    })

    it('opens configure dialog when cardio is selected', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()

      // Click Cardio button
      await userEvent.click(common.getDialogButton('Cardio'))

      // Verify configure dialog opens with activity picker
      await expect.element(page.getByRole('dialog')).toBeVisible()
      await expect.element(page.getByText('Configure')).toBeVisible()

      // Verify activity options are visible (emoji buttons)
      await expect.element(page.getByRole('button', { name: /running/i })).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /cycling/i })).toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /rowing/i })).toBeInTheDocument()

      // Verify duration input exists
      await expect.element(page.getByLabelText(/target duration/i)).toBeInTheDocument()

      cleanup()
    })

    it('allows selecting different cardio activities', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()
      await userEvent.click(common.getDialogButton('Cardio'))

      // Wait for dialog
      await expect.element(page.getByText('Configure')).toBeVisible()

      // Select cycling (running is default)
      await userEvent.click(page.getByRole('button', { name: /cycling/i }))

      // Confirm block
      await userEvent.click(common.getDialogButton('Add Block'))
      await common.waitForDialogClose()

      // Verify block was added
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      cleanup()
    })

    it('shows distance field for activities that support it', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()
      await userEvent.click(common.getDialogButton('Cardio'))

      // Wait for dialog
      await expect.element(page.getByText('Configure')).toBeVisible()

      // Running is selected by default and supports distance
      await expect.element(page.getByLabelText(/target distance/i)).toBeInTheDocument()

      cleanup()
    })
  })

  describe('Builder Display', () => {
    it('adds cardio block to workout playlist', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.addCardioBlock('Running')

      // Verify block appears in playlist
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      cleanup()
    })
  })

  describe('Execution', () => {
    it('starts workout with cardio block and shows cardio UI', async () => {
      const { builder, router, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add cardio block
      await builder.addCardioBlock('Running')

      // Verify block was added
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      // Start workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Verify cardio block shows Done button (primary action)
      await expect.element(page.getByRole('button', { name: /done/i })).toBeInTheDocument()

      cleanup()
    })

    it('clicking Done on cardio block advances to next block', async () => {
      const { builder, common, router, cleanup } = await createTestApp()

      // Start new workout
      await page.getByRole('button', { name: /start new workout/i }).click()
      expect(router.currentRoute.value.path).toBe('/workout/active')

      // Add cardio block first
      await builder.addCardioBlock('Running')

      // Add strength block after cardio - switch back to exercises tab
      await builder.openAddBlockDialog()
      await page.getByRole('tab', { name: /exercises/i }).click()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Verify both blocks in playlist
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Start workout - should show cardio block first
      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Verify we're on the cardio block (shows Done button)
      await expect.element(page.getByRole('button', { name: /done/i })).toBeInTheDocument()

      // Click Done on cardio block - should advance to next block
      await userEvent.click(page.getByRole('button', { name: /done/i }))

      // BUG REPRODUCTION: Should advance to block 2 of 2 (strength block)
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()

      // Verify we're now on the strength block (shows set table)
      await expect.element(page.getByRole('table')).toBeVisible()

      cleanup()
    })

    it('can complete cardio block and finish workout', async () => {
      const { builder, workout, router, cleanup } = await createTestApp()

      await page.getByRole('button', { name: /start new workout/i }).click()
      await builder.addCardioBlock('Cycling')
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // End workout via menu
      await workout.endWorkoutAndNavigateToSummary()
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })
  })

  describe('Hybrid Workflows', () => {
    it('supports strength + cardio blocks in same workout', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()

      // Add strength block first
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add cardio block
      await builder.addCardioBlock('Running')

      // Verify both blocks in playlist
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Start workout
      await builder.startWorkout()

      // Wait for active mode - should show first block (strength)
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      cleanup()
    })

    it('supports cardio + timed block in same workout', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.navigateTo()

      // Add cardio block first
      await builder.addCardioBlock('Rowing')

      // Add AMRAP block
      await builder.addTimedBlock('AMRAP')

      // Verify both blocks in playlist
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Start workout
      await builder.startWorkout()

      // Wait for active mode
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      cleanup()
    })

    it('completes full hybrid workout with strength, timed, and cardio blocks', async () => {
      const { builder, workout, common, router, cleanup } = await createTestApp()

      // Navigate to builder
      await page.getByRole('button', { name: /start new workout/i }).click()

      // Add strength block
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add EMOM block
      await builder.addTimedBlock('EMOM', 'Push-ups')

      // Add cardio block
      await builder.addCardioBlock('Running')

      // Verify all 3 blocks in playlist
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(3)

      // Start workout
      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Execute strength block - complete one set
      await expect.element(page.getByRole('table')).toBeVisible()
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Navigate to EMOM block
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 2 of 3/i)).toBeVisible()
      await expect.element(page.getByText('Push-ups')).toBeVisible()

      // Navigate to cardio block
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 3 of 3/i)).toBeVisible()
      await expect.element(page.getByRole('button', { name: /done/i })).toBeInTheDocument()

      // End workout via menu
      await userEvent.click(await workout.getMenuTrigger())
      await expect.element(page.getByRole('menuitem', { name: /end workout/i })).toBeVisible()
      await page.getByRole('menuitem', { name: /end workout/i }).click()

      // Confirm dialog
      await common.waitForDialog()
      await userEvent.click(common.getDialogButton('Finish Workout'))

      // Verify completion/success screen
      await expect.element(page.getByText(/workout complete/i)).toBeVisible()

      // Wait for View Details button to be visible and clickable
      const viewDetailsButton = page.getByRole('button', { name: /view details/i })
      await expect.element(viewDetailsButton, { timeout: 2000 }).toBeVisible()
      await expect.poll(async () => {
        const el = await viewDetailsButton.element()
        return getComputedStyle(el).opacity
      }, { timeout: 2000 }).toBe('1')

      // Navigate to summary
      await viewDetailsButton.click()
      await common.waitForRoute(/^\/workout\/summary\//)
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })
  })
})
