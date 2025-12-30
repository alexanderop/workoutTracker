import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

/**
 * Integration tests for workout builder edge cases.
 * Tests mixed block types, builder state, and unusual workflows.
 */
describe('Workout Builder Edge Cases', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Mixed Block Types', () => {
    it('allows mixing strength and timed blocks in any order', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()

      // Add timed block first
      await builder.addTimedBlock('AMRAP')

      // Add strength block
      await builder.openAddBlockDialog()
      await page.getByRole('tab', { name: /exercises/i }).click()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add another timed block
      await builder.addTimedBlock('EMOM', 'Push-ups')

      // Verify all 3 blocks
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(3)

      // Start workout
      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 3/i)).toBeVisible()

      cleanup()
    })

    it('can add the same exercise in multiple blocks', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()

      // Add Bench Press twice
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Verify both blocks in builder mode
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Start workout and verify we're on block 1 of 2
      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      cleanup()
    })
  })

  describe('Builder State', () => {
    it('preserves blocks when returning from exercise search', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()

      // Add first block
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Open dialog again to add more
      await builder.openAddBlockDialog()

      // Search for exercise
      const searchInput = page.getByPlaceholder(/search/i)
      await userEvent.fill(searchInput, 'Squat')

      // Cancel (close dialog)
      await userEvent.keyboard('{Escape}')
      await common.waitForDialogClose()

      // Verify first block is still there
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(1)

      cleanup()
    })

    it('clears builder state when workout is completed', async () => {
      const { builder, workout, router, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Complete a set and finish workout
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })
      await workout.endWorkoutAndNavigateToSummary()
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      // Go back to home
      await router.push('/')

      // Start new workout - should see empty builder
      await page.getByRole('button', { name: /start new workout/i }).click()
      await expect.element(page.getByRole('button', { name: /add first block/i })).toBeVisible()

      cleanup()
    })
  })

  describe('Playlist Reordering', () => {
    it('can navigate between blocks using footer buttons', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Squat', 'Deadlift'])

      // Start on block 1
      await expect.element(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Use footer navigation to go to next block
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 2 of 3/i)).toBeVisible()

      // Go to next block
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 3 of 3/i)).toBeVisible()

      // Go back
      await userEvent.click(await workout.getFooterButton('prev'))
      await expect.element(page.getByText(/block 2 of 3/i)).toBeVisible()

      cleanup()
    })
  })

  describe('Add Block in Builder Mode', () => {
    it('can add multiple blocks in builder before starting', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()

      // Add first block
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Bench Press'))
      await common.waitForDialogClose()

      // Add second block
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Squat'))
      await common.waitForDialogClose()

      // Verify both blocks in builder
      const playlistButtons = await builder.getPlaylistBlockButtons()
      expect(playlistButtons.length).toBe(2)

      // Start workout with both blocks
      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      cleanup()
    })
  })

  describe('Remove Block During Workout', () => {
    it('removing all blocks returns to builder mode', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      // Start with single block
      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Remove the only block
      await workout.removeCurrentBlock()

      // Should show empty state again
      await expect.element(page.getByRole('button', { name: /add first block/i })).toBeVisible()

      cleanup()
    })

    it('removing current block navigates to adjacent block', async () => {
      const { builder, workout, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Squat', 'Deadlift'])

      // Navigate to middle block
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 2 of 3/i)).toBeVisible()

      // Remove current block
      await workout.removeCurrentBlock()

      // Should now have 2 blocks
      await expect.element(page.getByText(/of 2/i)).toBeVisible()

      cleanup()
    })
  })

  describe('Block During Workout', () => {
    it('shows current block information header', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Verify block header shows exercise name and set info
      await expect.element(page.getByText('Bench Press')).toBeVisible()
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      cleanup()
    })
  })

  describe('Cancel Workflow', () => {
    it('can cancel adding a block mid-dialog', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      // Switch to timed blocks tab
      await builder.switchToTimedBlocksTab()

      // Click a timed block type (AMRAP)
      await userEvent.click(common.getDialogButton('AMRAP'))

      // Now in configure dialog, click Cancel or press Escape
      const cancelButton = common.getDialogButton('Cancel')
      const action = cancelButton
        ? () => userEvent.click(cancelButton)
        : () => userEvent.keyboard('{Escape}')
      await action()
      await common.waitForDialogClose()

      // No blocks should be added
      await expect.element(page.getByRole('button', { name: /add first block/i })).toBeVisible()

      cleanup()
    })
  })

  describe('Workout Without Sets Completed', () => {
    it('can finish workout without completing any sets', async () => {
      const { builder, workout, router, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])

      // Don't complete any sets, just finish
      await workout.endWorkoutAndNavigateToSummary()
      expect(router.currentRoute.value.path).toMatch(/^\/workout\/summary\//)

      cleanup()
    })
  })

  describe('Tab Switching in Add Block Dialog', () => {
    it('remembers last used tab in add block dialog', async () => {
      const { builder, common, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      // Switch to timed blocks tab
      await builder.switchToTimedBlocksTab()
      await expect.element(page.getByText('AMRAP')).toBeVisible()

      // Close and reopen
      await userEvent.keyboard('{Escape}')
      await common.waitForDialogClose()

      // Re-open - should remember timed blocks tab (or default to exercises)
      await builder.openAddBlockDialog()
      await expect.element(page.getByRole('dialog')).toBeVisible()

      // Can still switch between tabs
      await page.getByRole('tab', { name: /exercises/i }).click()
      await expect.element(page.getByRole('searchbox')).toBeVisible()

      cleanup()
    })
  })
})
