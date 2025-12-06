import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../helpers/resetDatabase'

describe('Workout Queue', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    // Reset body styles left by dialogs
    document.body.style.cssText = ''
    document.body.removeAttribute('style')
    document.body.innerHTML = ''
  })

  describe('opening the queue drawer', () => {
    it('user can open queue from header button during active workout', async () => {
      const { builder, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Setup: Start workout with 2 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await user.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      await builder.startWorkout()
      await waitFor(() => {
        expect(queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Action: Click queue button in header
      await user.click(getByRole('button', { name: /open workout queue/i }))

      // Assert: Dialog opens with "Workout Queue" title
      await common.waitForDialog()
      expect(queryByRole('heading', { name: /workout queue/i })).toBeTruthy()

      cleanup()
    })

    it('user sees all blocks listed with current block marked as active', async () => {
      const { builder, workout, queue, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Setup: Start workout with 3 blocks, navigate to block 2
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await user.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await user.click(common.getDialogButton('Squat'))
      await common.waitForDialogClose()

      await builder.startWorkout()
      await waitFor(() => {
        expect(queryByText(/block 1 of 3/i)).toBeTruthy()
      })

      // Navigate to block 2
      await user.click(workout.getFooterButton('next'))
      await waitFor(() => {
        expect(queryByText(/block 2 of 3/i)).toBeTruthy()
      })

      // Action: Open queue
      await user.click(getByRole('button', { name: /open workout queue/i }))
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
      const { builder, queue, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Setup: Start workout with 3 blocks on block 1
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await user.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()
      await builder.openAddBlockDialog()
      await user.click(common.getDialogButton('Squat'))
      await common.waitForDialogClose()

      await builder.startWorkout()
      await waitFor(() => {
        expect(queryByText(/block 1 of 3/i)).toBeTruthy()
      })

      // Action: Open queue, tap block 3 (Squat)
      await user.click(getByRole('button', { name: /open workout queue/i }))
      await common.waitForDialog()

      // Click on Squat block item
      const queueItems = queue.getItems()
      const squatItem = queueItems.find((item) => item.textContent?.includes('Squat'))
      if (!squatItem) throw new Error('Squat item not found in queue')
      await user.click(squatItem)

      // Assert: Dialog closes, block 3 is now active view
      await waitFor(() => {
        expect(queryByRole('dialog')).toBeNull()
      })
      await waitFor(() => {
        expect(queryByText(/block 3 of 3/i)).toBeTruthy()
      })

      cleanup()
    })

    it('user sees completed blocks marked with checkmark', async () => {
      const { builder, queue, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Setup: Start workout with 2 blocks
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await user.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      await builder.startWorkout()
      await waitFor(() => {
        expect(queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Wait for the strength view to render and fill first set
      const weightInput = await screen.findByRole('spinbutton', { name: /weight/i })
      const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
      const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

      // Fill inputs and wait for button (handles jsdom vs browser differences)
      const completeButton = getByRole('button', { name: /complete set/i })
      await common.fillStrengthSetAndWaitForButton(
        { weight: weightInput, reps: repsInput, rir: rirInput },
        { weight: '80', reps: '10', rir: '2' },
        completeButton,
      )

      // Complete all 3 sets (values are pre-filled after first)
      for (let i = 0; i < 3; i++) {
        await user.click(getByRole('button', { name: /complete set/i }))
      }

      // Should be on block 2 now
      await waitFor(() => {
        expect(queryByText(/block 2 of 2/i)).toBeTruthy()
      })

      // Action: Open queue
      await user.click(getByRole('button', { name: /open workout queue/i }))
      await common.waitForDialog()

      // Assert: Block 1 shows completed indicator (checkmark via lucide Check icon class)
      const queueItems = queue.getItems()
      const benchItem = queueItems.find((item) => item.textContent?.includes('Bench Press'))
      if (!benchItem) throw new Error('Bench Press item not found')

      // Check for completed indicator (lucide-check icon)
      expect(benchItem.querySelector('.lucide-check')).toBeTruthy()

      cleanup()
    })
  })

  describe('adding blocks', () => {
    it('user can add new exercise from queue drawer', async () => {
      const { builder, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Setup: Start workout with 1 block
      await builder.addStrengthBlock('Bench Press')

      await builder.startWorkout()
      await waitFor(() => {
        expect(queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Action: Open queue, click "Add Exercise"
      await user.click(getByRole('button', { name: /open workout queue/i }))
      await common.waitForDialog()

      await user.click(common.getDialogButton('Add Exercise'))

      // Wait for queue to close and add block dialog to open
      await waitFor(() => {
        const dialog = queryByRole('dialog')
        // The add block dialog should be open and have exercises tabs
        expect(dialog?.textContent).toContain('Exercises')
      })

      // Select an exercise
      await user.click(common.getDialogButton('Deadlift'))
      await common.waitForDialogClose()

      // Verify 2 blocks now (check the header text)
      await waitFor(() => {
        expect(queryByText(/block 2 of 2/i)).toBeTruthy()
      })

      cleanup()
    })
  })

  describe('timed block display', () => {
    it('user sees timed blocks with type badge in queue', async () => {
      const { builder, queue, common, user, getByRole, queryByRole, queryByText, cleanup } = await createTestApp()

      // Setup: Add a strength block and then an AMRAP block
      await builder.addStrengthBlock('Bench Press')
      await builder.openAddBlockDialog()
      await builder.switchToTimedBlocksTab()
      await user.click(common.getDialogButton('AMRAP'))

      // Configure AMRAP dialog
      await waitFor(() => {
        const dialog = getByRole('dialog')
        expect(dialog.textContent).toContain('Configure')
      })

      await user.click(common.getDialogButton('8'))
      await user.click(common.getDialogButton('Add Exercise'))
      await common.selectExercise('Push-ups')
      await user.click(common.getDialogButton('Add Block'))

      await common.waitForDialogClose()

      await builder.startWorkout()
      await waitFor(() => {
        expect(queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Action: Open queue
      await user.click(getByRole('button', { name: /open workout queue/i }))
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
