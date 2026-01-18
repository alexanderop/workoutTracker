import { page } from '../helpers/locator'
import { flushPromises } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'
import { db, getCustomExercisesRepository } from '@/db'
import { RouteNames } from '@/router'

describe('Isometric Exercise Prefill', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('Wall Sit with weight and duration', () => {
    it('prefills next set with weight and duration from completed set within same workout', async () => {
      // Arrange: Start a new workout with Wall Sit
      const { builder, common, workout, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await common.getDialogButton('Wall Sit').click()
      await common.waitForDialogClose()

      // Start the workout
      await builder.startWorkout()
      await expectElement(page.getByRole('table')).toBeVisible()

      // Act: Fill weight (5kg) and duration (20 seconds) for set 1
      const weightInput1 = page.getByRole('spinbutton', { name: /weight for set 1/i })
      const durationInput1 = page.getByRole('spinbutton', { name: /duration for set 1/i })
      await weightInput1.fill('5')
      await durationInput1.fill('20')
      await flushPromises()

      // Complete set 1
      const completeButton1 = page.getByRole('button', { name: /mark set 1 complete/i })
      await completeButton1.click()

      // Assert: Set 1 is completed
      await expectPoll(() => workout.isSetCompleted(0)).toBe(true)

      // Assert: Set 2 (now active) should be prefilled with weight=5 and duration=20
      const weightInput2 = page.getByRole('spinbutton', { name: /weight for set 2/i })
      const durationInput2 = page.getByRole('spinbutton', { name: /duration for set 2/i })

      await expectPoll(async () => {
        const element = await weightInput2.element()
        return element instanceof HTMLInputElement ? element.value : null
      }).toBe('5')

      await expectPoll(async () => {
        const element = await durationInput2.element()
        return element instanceof HTMLInputElement ? element.value : null
      }).toBe('20')

      cleanup()
    })

    it('prefills first set from last workout when starting fresh workout', async () => {
      // First create the app to ensure exercises are seeded
      const { builder, common, cleanup } = await createTestApp()

      // Get the actual Wall Sit exercise ID from seeded exercises
      const exercises = await getCustomExercisesRepository().getAll()
      const wallSit = exercises.find((e) => e.name === 'Wall Sit')
      if (!wallSit) throw new Error('Wall Sit not found in seeded exercises')

      // Arrange: Create completed workout with Wall Sit (duration-based with weight)
      const previousWorkout = databaseWorkoutBuilder()
        .withName('Previous Workout')
        .withExerciseAndSets(
          [
            { kg: '3', duration: '15', status: 'completed' },
            { kg: '5', duration: '20', status: 'completed' }, // <-- Last set
          ],
          { name: 'Wall Sit', exerciseDefinitionId: wallSit.id },
        )
        .build()
      await db.workouts.add(previousWorkout)

      // Act: Navigate to builder and add Wall Sit
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await common.getDialogButton('Wall Sit').click()
      await common.waitForDialogClose()

      // Wait for the async addExercise to complete (block appears in playlist)
      await expectElement(page.getByText('Wall Sit')).toBeVisible()

      // Start workout
      await builder.startWorkout()
      await expectElement(page.getByRole('table')).toBeVisible()

      // Assert: First set should be pre-filled with LAST set values (5kg, 20 seconds)
      const weightInput = page.getByRole('spinbutton', { name: /weight for set 1/i })
      const durationInput = page.getByRole('spinbutton', { name: /duration for set 1/i })

      await expectPoll(async () => {
        const element = await weightInput.element()
        return element instanceof HTMLInputElement ? element.value : null
      }).toBe('5')

      await expectPoll(async () => {
        const element = await durationInput.element()
        return element instanceof HTMLInputElement ? element.value : null
      }).toBe('20')

      cleanup()
    })

    it('completes full workflow: workout -> save -> new workout with prefill', async () => {
      // Arrange: Start a fresh workout
      const { builder, common, workout, navigateTo, cleanup } = await createTestApp()

      // Get the Wall Sit exercise ID
      const exercises = await getCustomExercisesRepository().getAll()
      const wallSit = exercises.find((e) => e.name === 'Wall Sit')
      if (!wallSit) throw new Error('Wall Sit not found in seeded exercises')

      // Act: Create workout with Wall Sit
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await common.getDialogButton('Wall Sit').click()
      await common.waitForDialogClose()
      await builder.startWorkout()

      // Fill and complete set 1
      await expectElement(page.getByRole('table')).toBeVisible()
      const weightInput = page.getByRole('spinbutton', { name: /weight for set 1/i })
      const durationInput = page.getByRole('spinbutton', { name: /duration for set 1/i })
      await weightInput.fill('5')
      await durationInput.fill('20')
      await flushPromises()

      const completeButton = page.getByRole('button', { name: /mark set 1 complete/i })
      await completeButton.click()
      await expectPoll(() => workout.isSetCompleted(0)).toBe(true)

      // End the workout
      await workout.endWorkoutAndNavigateToSummary()

      // Verify workout is saved (should be in completed workouts)
      const savedWorkouts = await db.workouts.toArray()
      expect(savedWorkouts.length).toBe(1)

      // Act: Start a NEW workout and add Wall Sit again
      // Navigate to home first (we're on summary page after completing workout)
      await navigateTo({ name: RouteNames.Home })
      await builder.navigateTo()
      await builder.openAddBlockDialog()
      await common.getDialogButton('Wall Sit').click()
      await common.waitForDialogClose()
      await expectElement(page.getByText('Wall Sit')).toBeVisible()
      await builder.startWorkout()

      // Assert: First set of new workout should be prefilled from previous workout
      await expectElement(page.getByRole('table')).toBeVisible()
      const newWeightInput = page.getByRole('spinbutton', { name: /weight for set 1/i })
      const newDurationInput = page.getByRole('spinbutton', { name: /duration for set 1/i })

      await expectPoll(async () => {
        const element = await newWeightInput.element()
        return element instanceof HTMLInputElement ? element.value : null
      }).toBe('5')

      await expectPoll(async () => {
        const element = await newDurationInput.element()
        return element instanceof HTMLInputElement ? element.value : null
      }).toBe('20')

      cleanup()
    })
  })
})
