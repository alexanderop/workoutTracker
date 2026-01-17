import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { page, userEvent } from '../helpers/locator'
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
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Action: Click queue button in header
      await page.getByRole('button', { name: /open workout queue/i }).click()

      // Assert: Dialog opens with "Workout Queue" title
      await common.waitForDialog()
      await expectElement(page.getByRole('heading', { name: /workout queue/i })).toBeInTheDocument()

      cleanup()
    })

    it('user sees all blocks listed with current block marked as active', async () => {
      const { builder, workout, queue, common, cleanup } = await createTestApp()

      // Setup: Start workout with 3 blocks, navigate to block 2
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await common.selectExercise('Squat')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Navigate to block 2
      await userEvent.click(await workout.getFooterButton('next'))
      await expectElement(page.getByText(/block 2 of 3/i)).toBeVisible()

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
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await common.selectExercise('Squat')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Action: Open queue, tap block 3 (Squat)
      await page.getByRole('button', { name: /open workout queue/i }).click()
      await common.waitForDialog()

      // Click on Squat block item
      const queueItems = queue.getItems()
      const squatItem = queueItems.find((item) => item.textContent?.includes('Squat'))
      if (!squatItem) throw new Error('Squat item not found in queue')
      await userEvent.click(squatItem)

      // Assert: Dialog closes, block 3 is now active view
      await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()
      await expectElement(page.getByText(/block 3 of 3/i)).toBeVisible()

      cleanup()
    })

    it('user sees completed blocks marked with checkmark', async () => {
      const { builder, workout, queue, common, cleanup } = await createTestApp()

      // Setup: Start workout with 2 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Wait for the strength view table to render
      await expectElement(page.getByRole('table')).toBeVisible()

      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Complete remaining 2 sets (values are pre-filled after first)
      for (const _ of [1, 2]) {
        await page.getByRole('button', { name: /complete set/i }).click()
      }

      // Should be on block 2 now
      await expectElement(page.getByText(/block 2 of 2/i)).toBeVisible()

      // Action: Open queue
      await page.getByRole('button', { name: /open workout queue/i }).click()
      await common.waitForDialog()

      // Assert: Block 1 shows completed indicator via accessible role
      const queueItems = queue.getItems()
      const benchItem = queueItems.find((item) => item.textContent?.includes('Bench Press'))
      if (!benchItem) throw new Error('Bench Press item not found')

      // Check for completed indicator by aria-label
      // eslint-disable-next-line no-restricted-syntax -- Finding indicator within queue item scope
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
      await expectElement(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Action: Open queue, click "Add Exercise"
      await page.getByRole('button', { name: /open workout queue/i }).click()
      await common.waitForDialog()

      await userEvent.click(common.getDialogButton('Add Exercise'))

      // Wait for queue to close and add block dialog to open
      await expectElement(page.getByRole('dialog')).toBeVisible()
      await expectPoll(() => {
        // eslint-disable-next-line no-restricted-syntax -- Checking dialog content by role selector
        const dialog = document.querySelector('[role="dialog"]')
        // The add block dialog should be open and have exercises tabs
        return dialog?.textContent?.includes('Exercises')
      }).toBe(true)

      // Select an exercise
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      // Verify 2 blocks now (check the header text)
      await expectElement(page.getByText(/block 2 of 2/i)).toBeVisible()

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
      await expectElement(page.getByRole('dialog')).toBeVisible()
      await expectElement(page.getByText(/Configure/)).toBeVisible()

      await userEvent.click(common.getDialogButton('8'))
      await userEvent.click(common.getDialogButton('Add Exercise'))
      await common.selectExercise('Push-ups')
      await userEvent.click(common.getDialogButton('Add Block'))

      await common.waitForDialogClose()

      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 2/i)).toBeVisible()

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

  describe('removing blocks', () => {
    it('user can remove a block from queue drawer', async () => {
      const { builder, queue, common, cleanup } = await createTestApp()

      // Setup: Start workout with 3 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await common.selectExercise('Squat')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Action: Open queue, remove block 2 (Deadlift)
      await queue.open()
      await queue.removeBlock(1) // 0-indexed, Deadlift is at index 1

      // Assert: Block removed, 2 blocks remain in queue
      const queueItems = queue.getItems()
      expect(queueItems.length).toBe(2)
      expect(queueItems.find((item) => item.textContent?.includes('Deadlift'))).toBeFalsy()

      // Close queue and verify header shows updated count
      await queue.close()
      await expectElement(page.getByText(/block 1 of 2/i)).toBeVisible()

      cleanup()
    })

    it('user can remove current block via header menu', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      // Setup: Start workout with 2 blocks on block 1
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Action: Remove current block via header menu
      await workout.removeCurrentBlock()

      // Assert: Block removed, now viewing Deadlift (which was block 2, now block 1)
      await expectElement(page.getByText(/block 1 of 1/i)).toBeVisible()
      await expectElement(page.getByText(/deadlift/i)).toBeVisible()

      cleanup()
    })

    it('removing last block returns to builder mode', async () => {
      const { builder, workout, router, cleanup } = await createTestApp()

      // Setup: Start workout with 1 block
      await builder.addStrengthBlock('Bench Press')

      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Action: Remove the only block via header menu
      await workout.removeCurrentBlock()

      // Assert: Returns to builder mode (empty workout state)
      await expectPoll(() => router.currentRoute.value.path).toBe('/workout/active')
      await expectElement(page.getByText(/add first block/i)).toBeVisible()

      cleanup()
    })
  })

  describe('reordering blocks', () => {
    it('reordering blocks updates queue display', async () => {
      const { builder, queue, common, cleanup } = await createTestApp()

      // Setup: Start workout with 3 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await common.selectExercise('Bodyweight Squat')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expectElement(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Open queue and verify initial order
      await queue.open()
      const initialOrder = queue.getBlockNames()
      expect(initialOrder).toEqual(['Bench Press', 'Deadlift', 'Bodyweight Squat'])

      // Action: Reorder blocks (simulates what drag would trigger)
      // Move Bodyweight Squat (index 2) to the front (index 0)
      await queue.reorderBlocks(2, 0)

      // Assert: Order changed to Bodyweight Squat, Bench Press, Deadlift
      await expectPoll(() => queue.getBlockNames()).toEqual(['Bodyweight Squat', 'Bench Press', 'Deadlift'])

      cleanup()
    })
  })
})
