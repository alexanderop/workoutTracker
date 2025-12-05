import { screen, waitFor } from '@testing-library/vue'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { createTestApp } from '../helpers/createTestApp'
import { resetDatabase } from '../setup'

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
      const app = await createTestApp()

      // Setup: Start workout with 2 blocks
      await app.addStrengthBlock('Bench Press')
      await app.openAddBlockDialog()
      await app.user.click(app.getDialogButton('Deadlift'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

      await app.startWorkout()
      await waitFor(() => {
        expect(app.queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Action: Click queue button in header
      await app.user.click(app.getByRole('button', { name: /open workout queue/i }))

      // Assert: Dialog opens with "Workout Queue" title
      await app.waitForDialog()
      expect(app.queryByRole('heading', { name: /workout queue/i })).toBeTruthy()

      app.cleanup()
    })

    it('user sees all blocks listed with current block marked as active', async () => {
      const app = await createTestApp()

      // Setup: Start workout with 3 blocks, navigate to block 2
      await app.addStrengthBlock('Bench Press')
      await app.openAddBlockDialog()
      await app.user.click(app.getDialogButton('Deadlift'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())
      await app.openAddBlockDialog()
      await app.user.click(app.getDialogButton('Squat'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

      await app.startWorkout()
      await waitFor(() => {
        expect(app.queryByText(/block 1 of 3/i)).toBeTruthy()
      })

      // Navigate to block 2
      await app.user.click(app.getFooterButton('next'))
      await waitFor(() => {
        expect(app.queryByText(/block 2 of 3/i)).toBeTruthy()
      })

      // Action: Open queue
      await app.user.click(app.getByRole('button', { name: /open workout queue/i }))
      await app.waitForDialog()

      // Assert: All 3 blocks visible in the queue dialog
      const queueItems = app.getQueueItems()
      expect(queueItems.length).toBe(3)

      // Assert: Block 2 (Deadlift) shows "(Active)" label
      const activeItem = app.getActiveQueueItem()
      expect(activeItem).toBeTruthy()
      expect(activeItem?.textContent).toContain('Deadlift')

      app.cleanup()
    })
  })

  describe('switching blocks', () => {
    it('user can tap a block to switch to it immediately', async () => {
      const app = await createTestApp()

      // Setup: Start workout with 3 blocks on block 1
      await app.addStrengthBlock('Bench Press')
      await app.openAddBlockDialog()
      await app.user.click(app.getDialogButton('Deadlift'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())
      await app.openAddBlockDialog()
      await app.user.click(app.getDialogButton('Squat'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

      await app.startWorkout()
      await waitFor(() => {
        expect(app.queryByText(/block 1 of 3/i)).toBeTruthy()
      })

      // Action: Open queue, tap block 3 (Squat)
      await app.user.click(app.getByRole('button', { name: /open workout queue/i }))
      await app.waitForDialog()

      // Click on Squat block item
      const queueItems = app.getQueueItems()
      const squatItem = queueItems.find((item) => item.textContent?.includes('Squat'))
      if (!squatItem) throw new Error('Squat item not found in queue')
      await app.user.click(squatItem)

      // Assert: Dialog closes, block 3 is now active view
      await waitFor(() => {
        expect(app.queryByRole('dialog')).toBeNull()
      })
      await waitFor(() => {
        expect(app.queryByText(/block 3 of 3/i)).toBeTruthy()
      })

      app.cleanup()
    })

    it('user sees completed blocks marked with checkmark', async () => {
      const app = await createTestApp()

      // Setup: Start workout with 2 blocks
      await app.addStrengthBlock('Bench Press')
      await app.openAddBlockDialog()
      await app.user.click(app.getDialogButton('Deadlift'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

      await app.startWorkout()
      await waitFor(() => {
        expect(app.queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Wait for the strength view to render and fill first set
      const weightInput = await screen.findByRole('spinbutton', { name: /weight/i })
      const repsInput = screen.getByRole('spinbutton', { name: /reps$/i })
      const rirInput = screen.getByRole('spinbutton', { name: /reps in reserve/i })

      await app.user.type(weightInput, '80')
      await app.user.type(repsInput, '10')
      await app.user.type(rirInput, '2')

      // Complete all 3 sets (values are pre-filled after first)
      for (let i = 0; i < 3; i++) {
        await app.user.click(app.getByRole('button', { name: /complete set/i }))
      }

      // Should be on block 2 now
      await waitFor(() => {
        expect(app.queryByText(/block 2 of 2/i)).toBeTruthy()
      })

      // Action: Open queue
      await app.user.click(app.getByRole('button', { name: /open workout queue/i }))
      await app.waitForDialog()

      // Assert: Block 1 shows completed indicator (checkmark via lucide Check icon class)
      const queueItems = app.getQueueItems()
      const benchItem = queueItems.find((item) => item.textContent?.includes('Bench Press'))
      if (!benchItem) throw new Error('Bench Press item not found')

      // Check for completed indicator (lucide-check icon)
      expect(benchItem.querySelector('.lucide-check')).toBeTruthy()

      app.cleanup()
    })
  })

  describe('adding blocks', () => {
    it('user can add new exercise from queue drawer', async () => {
      const app = await createTestApp()

      // Setup: Start workout with 1 block
      await app.addStrengthBlock('Bench Press')

      await app.startWorkout()
      await waitFor(() => {
        expect(app.queryByText(/block 1 of 1/i)).toBeTruthy()
      })

      // Action: Open queue, click "Add Exercise"
      await app.user.click(app.getByRole('button', { name: /open workout queue/i }))
      await app.waitForDialog()

      await app.user.click(app.getDialogButton('Add Exercise'))

      // Wait for queue to close and add block dialog to open
      await waitFor(() => {
        const dialog = app.queryByRole('dialog')
        // The add block dialog should be open and have exercises tabs
        expect(dialog?.textContent).toContain('Exercises')
      })

      // Select an exercise
      await app.user.click(app.getDialogButton('Deadlift'))
      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

      // Verify 2 blocks now (check the header text)
      await waitFor(() => {
        expect(app.queryByText(/block 2 of 2/i)).toBeTruthy()
      })

      app.cleanup()
    })
  })

  describe('timed block display', () => {
    it('user sees timed blocks with type badge in queue', async () => {
      const app = await createTestApp()

      // Setup: Add a strength block and then an AMRAP block
      await app.addStrengthBlock('Bench Press')
      await app.openAddBlockDialog()
      await app.switchToTimedBlocksTab()
      await app.user.click(app.getDialogButton('AMRAP'))

      // Configure AMRAP dialog
      await waitFor(() => {
        const dialog = app.getByRole('dialog')
        expect(dialog.textContent).toContain('Configure')
      })

      await app.user.click(app.getDialogButton('8'))
      await app.user.click(app.getDialogButton('Add Exercise'))
      await app.user.click(app.getDialogButton('Push-ups'))
      await app.user.click(app.getDialogButton('Add Block'))

      await waitFor(() => expect(app.queryByRole('dialog')).toBeNull())

      await app.startWorkout()
      await waitFor(() => {
        expect(app.queryByText(/block 1 of 2/i)).toBeTruthy()
      })

      // Action: Open queue
      await app.user.click(app.getByRole('button', { name: /open workout queue/i }))
      await app.waitForDialog()

      // Assert: Shows both blocks, AMRAP block has type badge
      const queueItems = app.getQueueItems()
      expect(queueItems.length).toBe(2)

      // Find the AMRAP item
      const amrapItem = queueItems.find((item) => item.textContent?.includes('AMRAP'))
      expect(amrapItem).toBeTruthy()

      app.cleanup()
    })
  })
})
