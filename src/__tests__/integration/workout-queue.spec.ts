/* eslint-disable vitest/no-conditional-in-test -- Queue controls are conditionally rendered for adjacent blocks. */
import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'

describe('Workout Queue', () => {
  describe('opening the queue drawer', () => {
    it('user can open queue from header button during active workout', async ({
      createTestApp,
    }) => {
      const { builder, common } = await createTestApp()

      // Setup: Start workout with 2 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Action: Click queue button in header
      await page.getByRole('button', { name: /open workout queue/i }).click()

      // Assert: Dialog opens with "Workout Queue" title
      await common.waitForDialog()
      await expect
        .element(page.getByRole('heading', { name: /workout queue/i }))
        .toBeInTheDocument()
    })

    it('user sees all blocks listed with current block marked as active', async ({
      createTestApp,
    }) => {
      const { builder, workout, queue, common } = await createTestApp()

      // Setup: Start workout with 3 blocks, navigate to block 2
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await common.selectExercise('Squat')
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
      expect(queueItems).toHaveLength(3)

      // Assert: Block 2 (Deadlift) shows "(Active)" label
      const activeItem = queue.getActiveItem()
      expect(activeItem).toBeTruthy()
      expect(activeItem?.textContent).toContain('Deadlift')
    })
  })

  describe('switching blocks', () => {
    it('user can tap a block to switch to it immediately', async ({ createTestApp }) => {
      const { builder, queue, common } = await createTestApp()

      // Setup: Start workout with 3 blocks on block 1
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await common.selectExercise('Squat')
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
    })

    it('user sees completed blocks marked with checkmark', async ({ createTestApp }) => {
      const { builder, workout, queue, common } = await createTestApp()

      // Setup: Start workout with 2 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Wait for the strength view table to render
      await expect.element(page.getByRole('table')).toBeVisible()

      // Fill and complete the first set
      await workout.fillCardSetAndComplete({ weight: '80', reps: '10', rir: '2' })

      // Complete remaining 2 sets (values are pre-filled after first)
      for (const _ of [1, 2]) {
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
      // eslint-disable-next-line no-restricted-syntax -- Finding indicator within queue item scope
      const completedIndicator = benchItem.querySelector('[role="img"][aria-label]')
      expect(completedIndicator).toBeTruthy()
      expect(completedIndicator?.getAttribute('aria-label')).toContain('completed')
    })
  })

  describe('adding blocks', () => {
    it('user can add new exercise from queue drawer', async ({ createTestApp }) => {
      const { builder, common } = await createTestApp()

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
      await expect
        .poll(() => {
          // eslint-disable-next-line no-restricted-syntax -- Checking dialog content by role selector
          const dialog = document.querySelector('[role="dialog"]')
          // The add block dialog should be open and have exercises tabs
          return dialog?.textContent?.includes('Exercises')
        })
        .toBe(true)

      // Select an exercise
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      // Verify 2 blocks now (check the header text)
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()
    })
  })

  describe('timed block display', () => {
    it('user sees timed blocks with type badge in queue', async ({ createTestApp }) => {
      const { builder, queue, common } = await createTestApp()

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
      expect(queueItems).toHaveLength(2)

      // Find the AMRAP item
      const amrapItem = queueItems.find((item) => item.textContent?.includes('AMRAP'))
      expect(amrapItem).toBeTruthy()
    })
  })

  describe('removing blocks', () => {
    it('user can remove a block from queue drawer', async ({ createTestApp }) => {
      const { builder, queue, common } = await createTestApp()

      // Setup: Start workout with 3 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await common.selectExercise('Squat')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Action: Open queue, remove block 2 (Deadlift)
      await queue.open()
      await queue.removeBlock(1) // 0-indexed, Deadlift is at index 1

      // Assert: Block removed, 2 blocks remain in queue
      const queueItems = queue.getItems()
      expect(queueItems).toHaveLength(2)
      expect(queueItems.find((item) => item.textContent?.includes('Deadlift'))).toBeFalsy()

      // Close queue and verify header shows updated count
      await queue.close()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()
    })

    it('user can remove current block via header menu', async ({ createTestApp }) => {
      const { builder, workout, common } = await createTestApp()

      // Setup: Start workout with 2 blocks on block 1
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Action: Remove current block via header menu
      await workout.removeCurrentBlock()

      // Assert: Block removed, now viewing Deadlift (which was block 2, now block 1)
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()
      await expect.element(page.getByText(/deadlift/i)).toBeVisible()
    })

    it('removing last block returns to builder mode', async ({ createTestApp }) => {
      const { builder, workout, router } = await createTestApp()

      // Setup: Start workout with 1 block
      await builder.addStrengthBlock('Bench Press')

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 1/i)).toBeVisible()

      // Action: Remove the only block via header menu
      await workout.removeCurrentBlock()

      // Assert: Returns to builder mode (empty workout state)
      await expect.poll(() => router.currentRoute.value.path).toBe('/workout/active')
      await expect.element(page.getByText(/add first block/i)).toBeVisible()
    })
  })

  describe('reordering blocks', () => {
    it('reordering blocks updates queue display', async ({ createTestApp }) => {
      const { builder, queue, common } = await createTestApp()

      // Setup: Start workout with 3 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await common.selectExercise('Bodyweight Squat')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Open queue and verify initial order
      await queue.open()
      const initialOrder = queue.getBlockNames()
      expect(initialOrder).toEqual(['Bench Press', 'Deadlift', 'Bodyweight Squat'])

      // Action: Reorder blocks (simulates what drag would trigger)
      // Move Bodyweight Squat (index 2) to the front (index 0)
      await queue.reorderBlocks(2, 0)

      // Assert: Order changed to Bodyweight Squat, Bench Press, Deadlift
      await expect
        .poll(() => queue.getBlockNames())
        .toEqual(['Bodyweight Squat', 'Bench Press', 'Deadlift'])
    })
  })

  // Regression coverage for UX review Low finding: "No way to reorder exercises
  // in the workout queue drawer (remove + jump exist)." Drag-and-drop already
  // exists (Sortable.js) but is mouse/touch-only and isn't reachable through a
  // real UI interaction in tests (see the "reordering blocks" describe above,
  // which calls `reorderBlocks` directly). These per-item up/down buttons are the
  // keyboard/screen-reader-accessible, UI-drivable way to reorder.
  describe('reordering via move up/down buttons', () => {
    it('reorders blocks when the move-down button is clicked', async ({ createTestApp }) => {
      const { builder, queue, common } = await createTestApp()

      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await common.selectExercise('Bodyweight Squat')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 3/i)).toBeVisible()

      await queue.open()
      expect(queue.getBlockNames()).toEqual(['Bench Press', 'Deadlift', 'Bodyweight Squat'])

      // Move Bench Press (index 0) down one position via the real button click.
      await queue.moveDown(0)

      await expect
        .poll(() => queue.getBlockNames())
        .toEqual(['Deadlift', 'Bench Press', 'Bodyweight Squat'])
    })

    it('reorders blocks when the move-up button is clicked', async ({ createTestApp }) => {
      const { builder, queue, common } = await createTestApp()

      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await common.selectExercise('Bodyweight Squat')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 3/i)).toBeVisible()

      await queue.open()

      // Move Bodyweight Squat (index 2) up one position.
      await queue.moveUp(2)

      await expect
        .poll(() => queue.getBlockNames())
        .toEqual(['Bench Press', 'Bodyweight Squat', 'Deadlift'])
    })

    it('disables the move-up button for the first item and the move-down button for the last item', async ({
      createTestApp,
    }) => {
      const { builder, queue, common } = await createTestApp()

      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      await queue.open()

      const firstMoveUp = queue.getMoveUpButton(0)
      const lastMoveDown = queue.getMoveDownButton(1)

      expect(firstMoveUp instanceof HTMLButtonElement && firstMoveUp.disabled).toBe(true)
      expect(lastMoveDown instanceof HTMLButtonElement && lastMoveDown.disabled).toBe(true)

      // The complementary buttons on the same items must stay enabled.
      const firstMoveDown = queue.getMoveDownButton(0)
      const lastMoveUp = queue.getMoveUpButton(1)
      expect(firstMoveDown instanceof HTMLButtonElement && firstMoveDown.disabled).toBe(false)
      expect(lastMoveUp instanceof HTMLButtonElement && lastMoveUp.disabled).toBe(false)
    })

    it('exposes a distinguishable accessible name that includes the exercise name', async ({
      createTestApp,
    }) => {
      const { builder, queue, common } = await createTestApp()

      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      await queue.open()

      const moveDownButton = queue.getMoveDownButton(0)
      expect(moveDownButton?.getAttribute('aria-label')).toMatch(/bench press/i)

      const moveUpButton = queue.getMoveUpButton(1)
      expect(moveUpButton?.getAttribute('aria-label')).toMatch(/deadlift/i)
    })

    it('keeps the active block marked active after it moves position', async ({
      createTestApp,
    }) => {
      const { builder, workout, queue, common } = await createTestApp()

      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await common.selectExercise('Deadlift')
      await common.waitForDialogClose()

      await builder.startWorkout()
      await expect.element(page.getByText(/block 1 of 2/i)).toBeVisible()

      // Advance to block 2 (Deadlift) so it's the active block.
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 2 of 2/i)).toBeVisible()

      await queue.open()
      const activeItemBefore = queue.getActiveItem()
      expect(activeItemBefore?.textContent).toContain('Deadlift')

      // Move Bench Press (the inactive, first item) down past the active Deadlift.
      await queue.moveDown(0)

      // Order flips, but the active block must still be Deadlift by identity, now
      // showing at index 0.
      await expect.poll(() => queue.getBlockNames()).toEqual(['Deadlift', 'Bench Press'])
      const activeItemAfter = queue.getActiveItem()
      expect(activeItemAfter?.textContent).toContain('Deadlift')
    })
  })
})
