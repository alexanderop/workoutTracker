/* eslint-disable vitest/no-conditional-in-test -- Prefill controls are conditionally rendered. */
import { page } from 'vitest/browser'
import { describe, expect } from 'vitest'
import { it } from '../helpers/integrationTest'
import { seedCompletedWorkout } from '../helpers/dbAssertions'
import { dbWorkoutBuilder as databaseWorkoutBuilder } from '../factories'
import { getCustomExercisesRepository } from '@/db'

describe('Exercise Pre-fill from Previous Workout', () => {
  it('pre-fills first set with last set values from previous workout', async ({
    createTestApp,
  }) => {
    // First create the app to ensure exercises are seeded
    const { builder, workout, common } = await createTestApp()

    // Get the actual Bench Press exercise ID from seeded exercises
    const exercises = await getCustomExercisesRepository().getAll()
    const benchPress = exercises.find((e) => e.name === 'Bench Press')
    if (!benchPress) throw new Error('Bench Press not found in seeded exercises')

    // Arrange: Create completed workout with Bench Press (3 sets, different values)
    const previousWorkout = databaseWorkoutBuilder()
      .withName('Previous Workout')
      .withExerciseAndSets(
        [
          { kg: '80', reps: '10', rir: '3', status: 'completed' },
          { kg: '85', reps: '8', rir: '2', status: 'completed' },
          { kg: '90', reps: '6', rir: '1', status: 'completed' }, // <-- Last set
        ],
        { name: 'Bench Press', exerciseDefinitionId: benchPress.id },
      )
      .build()
    await seedCompletedWorkout(previousWorkout)

    // Act: Navigate to builder and add Bench Press
    await builder.navigateTo()
    await builder.openAddBlockDialog()
    await common.getDialogButton('Bench Press').click()
    await common.waitForDialogClose()

    // Wait for the async addExercise to complete (block appears in playlist)
    await expect.element(page.getByText('Bench Press')).toBeVisible()

    // Start workout
    await builder.startWorkout()
    await expect.element(page.getByRole('table')).toBeVisible()

    // Assert: First set should be pre-filled with LAST set values (90kg, 6 reps, 1 RIR)
    await expect
      .poll(async () => {
        const activeSet = await workout.getActiveSet()
        if (!activeSet) return null
        return await activeSet.getValues()
      })
      .toEqual({ weight: '90', reps: '6', rir: '1' })
  })

  it('leaves first set empty when exercise has no history', async ({ createTestApp }) => {
    const { builder, workout } = await createTestApp()

    // Act: Start workout with exercise that has no history
    await builder.setupStrengthWorkoutAndStart(['Deadlift'])

    // Assert: First set should be empty
    const activeSet = await workout.getActiveSet()
    expect(activeSet).not.toBeNull()
    const values = await activeSet!.getValues()

    expect(values.weight).toBe('')
    expect(values.reps).toBe('')
    expect(values.rir).toBe('')
  })
})
