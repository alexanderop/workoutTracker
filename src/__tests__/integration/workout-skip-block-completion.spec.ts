import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'

describe('Workout Block Skip Completion', () => {
  describe('Premature Workout Complete Dialog', () => {
    it('should NOT show finish dialog when completing last block while middle block is untouched', async ({
      createTestApp,
    }) => {
      const { builder, workout, common } = await createTestApp()

      // Setup workout with 3 exercises (blocks 0, 1, 2)
      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Deadlift', 'Barbell Row'])
      await expect.element(page.getByText(/block 1 of 3/i)).toBeVisible()

      // Step 1: Complete all 3 sets in block 0 (Bench Press)
      // This should auto-advance to block 1
      await workout.completeMultipleSets(3, { weight: '100', reps: '8', rir: '2' })
      await expect.element(page.getByText(/block 2 of 3/i), { timeout: 3000 }).toBeVisible()

      // Step 2: SKIP block 1 (Deadlift) - navigate directly to block 2
      await userEvent.click(await workout.getFooterButton('next'))
      await expect.element(page.getByText(/block 3 of 3/i)).toBeVisible()
      await expect.element(page.getByText('Barbell Row')).toBeInTheDocument()

      // Step 3: Complete all 3 sets in block 2 (Barbell Row)
      // After fix: should NOT trigger workout-complete, should navigate to incomplete block 1
      await workout.completeMultipleSets(3, { weight: '80', reps: '10', rir: '2' })

      // ASSERTION: After completing the last block with skipped middle block,
      // should auto-navigate to the first incomplete block (block 1 / Deadlift)
      await expect.element(page.getByText(/block 2 of 3/i), { timeout: 3000 }).toBeVisible()
      await expect.element(page.getByText('Deadlift')).toBeInTheDocument()

      // Finish dialog should NOT appear because block 1 (Deadlift) is untouched
      expect(common.isDialogOpen()).toBe(false)

      // Verify the skipped block (Deadlift) has no completed sets
      await expect.poll(() => workout.getCompletedSetCount()).toBe(0)
    })

    it('should show finish dialog only after ALL blocks are completed', { timeout: 15_000 }, async ({
      createTestApp,
    }) => {
      const { builder, workout, common } = await createTestApp()

      // Setup workout with 3 exercises
      await builder.setupStrengthWorkoutAndStart(['Bench Press', 'Deadlift', 'Barbell Row'])

      // Complete block 0
      await workout.completeMultipleSets(3, { weight: '100', reps: '8', rir: '2' })
      await expect.element(page.getByText(/block 2 of 3/i), { timeout: 3000 }).toBeVisible()

      // Complete block 1
      await workout.completeMultipleSets(3, { weight: '120', reps: '5', rir: '1' })
      await expect.element(page.getByText(/block 3 of 3/i), { timeout: 3000 }).toBeVisible()

      // Complete block 2 - NOW the dialog should appear
      await workout.completeMultipleSets(3, { weight: '80', reps: '10', rir: '2' })

      // After completing ALL blocks, finish dialog should appear
      await common.waitForDialog()
      await expect.element(page.getByRole('heading', { name: /finish workout/i })).toBeVisible()
    })
  })
})
