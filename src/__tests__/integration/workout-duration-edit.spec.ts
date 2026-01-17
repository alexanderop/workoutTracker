import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { page, userEvent } from '../helpers/locator'
import { db } from '@/db'
import { getWorkoutRef } from '@/stores/workoutState'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Workout Duration Editing', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Duration Display in Finish Dialog', () => {
    it('shows elapsed duration in finish dialog', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 45 minutes elapsed
      const workoutRef = getWorkoutRef()
      workoutRef.value.startedAt = Date.now() - 45 * 60 * 1000

      // Open finish dialog
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      // Verify duration field shows elapsed time
      const durationInput = page.getByRole('spinbutton', { name: /duration/i })
      await expectElement(durationInput).toBeVisible()

      // Get the input value using poll to handle async element retrieval
      await expectPoll(async () => {
        const element = await durationInput.element()
        if (element instanceof HTMLInputElement) {
          return Number(element.value)
        }
        return null
      }).toBeCloseTo(45, -1) // ~45 minutes

      cleanup()
    })
  })

  describe('Duration Editing', () => {
    it('allows editing duration before finishing', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 4 hours elapsed (user forgot to stop)
      const workoutRef = getWorkoutRef()
      const startedAt = Date.now() - 4 * 60 * 60 * 1000
      workoutRef.value.startedAt = startedAt

      // Open finish dialog
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      // Edit duration to 45 minutes
      const durationInput = page.getByRole('spinbutton', { name: /duration/i })
      await durationInput.clear()
      await durationInput.fill('45')

      // Fill name and finish
      const nameInput = page.getByRole('textbox', { name: /workout name/i })
      await nameInput.clear()
      await nameInput.fill('Edited Duration Workout')
      await userEvent.click(common.getDialogButton('Finish Workout'))

      // Wait for completion
      await expectElement(page.getByText(/workout complete/i)).toBeVisible()

      // Verify saved workout has correct duration (45 min = 2700 seconds)
      await expectPoll(async () => {
        const workouts = await db.workouts.toArray()
        return workouts[0]?.durationSeconds
      }).toBe(2700)

      // Verify completedAt was back-calculated from duration
      await expectPoll(async () => {
        const workouts = await db.workouts.toArray()
        const saved = workouts[0]
        if (!saved) return null
        // completedAt should be startedAt + 45 minutes
        return saved.completedAt - saved.startedAt
      }).toBe(45 * 60 * 1000)

      cleanup()
    })

    it('saves workout with default duration when not edited', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 30 minutes elapsed
      const workoutRef = getWorkoutRef()
      workoutRef.value.startedAt = Date.now() - 30 * 60 * 1000

      // Open finish dialog and finish without editing duration
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      const nameInput = page.getByRole('textbox', { name: /workout name/i })
      await nameInput.clear()
      await nameInput.fill('Default Duration')
      await userEvent.click(common.getDialogButton('Finish Workout'))

      await expectElement(page.getByText(/workout complete/i)).toBeVisible()

      // Verify saved workout has duration close to 30 minutes
      const workouts = await db.workouts.toArray()
      const duration = workouts[0]?.durationSeconds ?? 0
      expect(duration).toBeGreaterThanOrEqual(1790)
      expect(duration).toBeLessThanOrEqual(1810)

      cleanup()
    })
  })

  describe('Duration Warning', () => {
    it('shows warning when duration exceeds 3 hours', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 4 hours elapsed
      const workoutRef = getWorkoutRef()
      workoutRef.value.startedAt = Date.now() - 4 * 60 * 60 * 1000

      // Open finish dialog
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      // Verify warning is visible
      await expectElement(page.getByText(/seems longer than usual/i)).toBeVisible()

      cleanup()
    })

    it('does not show warning for normal durations', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 1 hour elapsed (under threshold)
      const workoutRef = getWorkoutRef()
      workoutRef.value.startedAt = Date.now() - 60 * 60 * 1000

      // Open finish dialog
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      // Verify warning is NOT visible
      await expectElement(page.getByText(/seems longer than usual/i)).not.toBeInTheDocument()

      cleanup()
    })

    it('hides warning when user edits duration below threshold', async () => {
      const { builder, workout, common, cleanup } = await createTestApp()

      await builder.setupStrengthWorkoutAndStart(['Bench Press'])
      await workout.fillCardSetAndComplete({ weight: '100', reps: '8', rir: '2' })

      // Simulate 4 hours elapsed
      const workoutRef = getWorkoutRef()
      workoutRef.value.startedAt = Date.now() - 4 * 60 * 60 * 1000

      // Open finish dialog
      await userEvent.click(await workout.getMenuTrigger())
      await page.getByRole('menuitem', { name: /end workout/i }).click()
      await common.waitForDialog()

      // Warning should be visible initially
      await expectElement(page.getByText(/seems longer than usual/i)).toBeVisible()

      // Edit duration to 60 minutes (below threshold)
      const durationInput = page.getByRole('spinbutton', { name: /duration/i })
      await durationInput.clear()
      await durationInput.fill('60')

      // Warning should disappear
      await expectElement(page.getByText(/seems longer than usual/i)).not.toBeInTheDocument()

      cleanup()
    })
  })
})
