import { page, userEvent } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { getWorkoutRef } from '@/stores/workoutState'
import { getAllWorkouts } from '../helpers/dbAssertions'

describe('Workout Duration Editing', () => {
  describe('Duration Display in Finish Dialog', () => {
    it('shows elapsed duration in finish dialog', async ({ createTestApp }) => {
      const { builder, workout, common } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 45 minutes elapsed
      const workoutReference = getWorkoutRef()
      workoutReference.value.startedAt = Date.now() - 45 * 60 * 1000

      // Open finish dialog
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      // Verify duration field shows elapsed time
      const durationInput = page.getByRole('spinbutton', { name: /duration/i })
      await expect.element(durationInput).toBeVisible()

      // Get the input value using poll to handle async element retrieval
      await expect
        .poll(async () => {
          const element = await durationInput.element()
          if (element instanceof HTMLInputElement) {
            return Number(element.value)
          }
          return null
        })
        .toBeCloseTo(45, -1) // ~45 minutes
    })
  })

  describe('Duration Editing', () => {
    it('allows editing duration before finishing', async ({ createTestApp }) => {
      const { builder, workout, common } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 4 hours elapsed (user forgot to stop)
      const workoutReference = getWorkoutRef()
      const startedAt = Date.now() - 4 * 60 * 60 * 1000
      workoutReference.value.startedAt = startedAt

      // Open finish dialog
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      // Edit duration to 45 minutes
      const durationInput = page.getByRole('spinbutton', { name: /duration/i })
      await userEvent.clear(durationInput)
      await userEvent.fill(durationInput, '45')

      // Fill name and finish
      const nameInput = page.getByRole('textbox', { name: /workout name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Edited Duration Workout')
      await userEvent.click(common.getDialogButton('Finish Workout'))

      // Wait for completion
      await expect.element(page.getByText(/workout complete/i)).toBeVisible()

      // Verify saved workout has correct duration (45 min = 2700 seconds)
      await expect
        .poll(async () => {
          const workouts = await getAllWorkouts()
          return workouts[0]?.durationSeconds
        })
        .toBe(2700)

      // Verify completedAt was back-calculated from duration
      await expect
        .poll(async () => {
          const workouts = await getAllWorkouts()
          const saved = workouts[0]
          if (!saved) return null
          // completedAt should be startedAt + 45 minutes
          return saved.completedAt - saved.startedAt
        })
        .toBe(45 * 60 * 1000)
    })

    it('saves workout with default duration when not edited', async ({ createTestApp }) => {
      const { builder, workout, common } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 30 minutes elapsed
      const workoutReference = getWorkoutRef()
      workoutReference.value.startedAt = Date.now() - 30 * 60 * 1000

      // Open finish dialog and finish without editing duration
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      const nameInput = page.getByRole('textbox', { name: /workout name/i })
      await userEvent.clear(nameInput)
      await userEvent.fill(nameInput, 'Default Duration')
      await userEvent.click(common.getDialogButton('Finish Workout'))

      await expect.element(page.getByText(/workout complete/i)).toBeVisible()

      // Verify saved workout has duration close to 30 minutes
      const workouts = await getAllWorkouts()
      const duration = workouts[0]?.durationSeconds ?? 0
      expect(duration).toBeGreaterThanOrEqual(1790)
      expect(duration).toBeLessThanOrEqual(1810)
    })
  })

  describe('Duration Warning', () => {
    it('shows warning when duration exceeds 3 hours', async ({ createTestApp }) => {
      const { builder, workout, common } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 4 hours elapsed
      const workoutReference = getWorkoutRef()
      workoutReference.value.startedAt = Date.now() - 4 * 60 * 60 * 1000

      // Open finish dialog
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      // Verify warning is visible
      await expect.element(page.getByText(/seems longer than usual/i)).toBeVisible()
    })

    it('does not show warning for normal durations', async ({ createTestApp }) => {
      const { builder, workout, common } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 1 hour elapsed (under threshold)
      const workoutReference = getWorkoutRef()
      workoutReference.value.startedAt = Date.now() - 60 * 60 * 1000

      // Open finish dialog
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      // Verify warning is NOT visible
      await expect.element(page.getByText(/seems longer than usual/i)).not.toBeInTheDocument()
    })

    it('hides warning when user edits duration below threshold', async ({ createTestApp }) => {
      const { builder, workout, common } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 4 hours elapsed
      const workoutReference = getWorkoutRef()
      workoutReference.value.startedAt = Date.now() - 4 * 60 * 60 * 1000

      // Open finish dialog
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      // Warning should be visible initially
      await expect.element(page.getByText(/seems longer than usual/i)).toBeVisible()

      // Edit duration to 60 minutes (below threshold)
      const durationInput = page.getByRole('spinbutton', { name: /duration/i })
      await userEvent.clear(durationInput)
      await userEvent.fill(durationInput, '60')

      // Warning should disappear
      await expect.element(page.getByText(/seems longer than usual/i)).not.toBeInTheDocument()
    })
  })
})
