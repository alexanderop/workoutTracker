import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Workout Queue', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('opening the queue drawer', () => {
    it('user can open queue from header button during active workout', async () => {
      const { builder, common, cleanup } = await createTestApp()

      // Setup: Start workout with 2 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Action: Click queue button in header
      await page.getByRole('button', { name: /open workout queue/i }).click()

      // Assert: Dialog opens with "Workout Queue" title
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /workout queue/i })).toBeInTheDocument()

      cleanup()
    })

    it('user sees all blocks listed with current block marked as active', async () => {
      const { builder, workout, queue, common, cleanup } = await createTestApp()

      // Setup: Start workout with 3 blocks, navigate to block 2
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Squat'))
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Navigate to block 2
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 2 of 3/i)).toBeVisible()

      // Action: Open queue
      await page.getByRole('button', { name: /open workout queue/i }).click()
      await common.waitForDialog()

      // Assert: All 3 blocks visible in the queue dialog
      const queueItems = queue.getItems()
      expect(queueItems.length).toBe(3)

      // Assert: Block 2 (Deadlift) shows "(Active)" label
      const activeItem = queue.getActiveItem()
      expect(activeItem).toBeTruthy()
      expect(activeItem?.textContent).toContain('Deadlift')

      cleanup()
    })
  })

  describe('switching blocks', () => {
    it('user can tap a block to switch to it immediately', async () => {
      const { builder, queue, common, cleanup } = await createTestApp()

      // Setup: Start workout with 3 blocks on block 1
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Squat'))
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Action: Open queue, tap block 3 (Squat)
      await page.getByRole('button', { name: /open workout queue/i }).click()
      await common.waitForDialog()

      // Click on Squat block item
      const queueItems = queue.getItems()
      const squatItem = queueItems.find((item) => item.textContent?.includes('Squat'))
      if (!squatItem) throw new Error('Squat item not found in queue')
      await userEvent.click(squatItem)

      // Assert: Dialog closes, block 3 is now active view
      await expect.element(page.getByRole('dialog')).not.toBeInTheDocument()
      await expect.element(page.getByText(/block 3 of 3/i)).toBeVisible()

      cleanup()
    })

    it('user sees completed blocks marked with checkmark', async () => {
      const { builder, workout, queue, common, cleanup } = await createTestApp()

      // Setup: Start workout with 2 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await userEvent.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Wait for the strength view table to render
      await expect.element(page.getByRole('table')).toBeVisible()

      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Complete remaining 2 sets (values are pre-filled after first)
      for (let i = 0; i < 2; i++) {
        await page.getByRole('button', { name: /complete set/i }).click()
      }

      // Should be on block 2 now
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()

      // Action: Open queue
      await page.getByRole('button', { name: /open workout queue/i }).click()
      await common.waitForDialog()

      // Assert: Block 1 shows completed indicator via accessible role
      const queueItems = queue.getItems()
      const benchItem = queueItems.find((item) => item.textContent?.includes('Bench Press'))
      if (!benchItem) throw new Error('Bench Press item not found')

      // Check for completed indicator by aria-label
      const completedIndicator = benchItem.querySelector('[role="img"][aria-label]')
      expect(completedIndicator).toBeTruthy()
      expect(completedIndicator?.getAttribute('aria-label')).toContain('completed')

      cleanup()
    })
  })

  describe('adding blocks', () => {
    it('user can add new exercise from queue drawer', async () => {
      const { builder, common, cleanup } = await createTestApp()

      // Setup: Start workout with 1 block
      await builder.addStrengthBlock('Bench Press')

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Action: Open queue, click "Add Exercise"
      await page.getByRole('button', { name: /open workout queue/i }).click()
      await common.waitForDialog()

      await userEvent.click(common.getDialogButton('Add Exercise'))

      // Wait for queue to close and add block dialog to open
      await expect.element(page.getByRole('dialog')).toBeVisible()
      await expect.poll(() => {
        const dialog = document.querySelector('[role="dialog"]')
        // The add block dialog should be open and have exercises tabs
        return dialog?.textContent?.includes('Exercises')
      }).toBe(true)

      // Select an exercise
      await userEvent.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      // Verify 2 blocks now (check the header text)
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()

      cleanup()
    })
  })

  describe('timed block display', () => {
    it('user sees timed blocks with type badge in queue', async () => {
      const { builder, queue, common, cleanup } = await createTestApp()

      // Setup: Add a strength block and then an AMRAP block
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()
      await userEvent.click(common.getDialogButton('AMRAP'))

      // Configure AMRAP dialog
      await expect.element(page.getByRole('dialog')).toBeVisible()
      await expect.element(page.getByText(/Configure/)).toBeVisible()

      await userEvent.click(common.getDialogButton('8'))
      await userEvent.click(common.getDialogButton('Add Exercise'))
      await common.selectExercise('Push-ups')
      await userEvent.click(common.getDialogButton('Add Block'))

      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Action: Open queue
      await page.getByRole('button', { name: /open workout queue/i }).click()
      await common.waitForDialog()

      // Assert: Shows both blocks, AMRAP block has type badge
      const queueItems = queue.getItems()
      expect(queueItems.length).toBe(2)

      // Find the AMRAP item
      const amrapItem = queueItems.find((item) => item.textContent?.includes('AMRAP'))
      expect(amrapItem).toBeTruthy()

      cleanup()
    })
  })
})
