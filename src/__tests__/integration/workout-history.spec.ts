import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetInitState } from '@/composables/useAppInitialization'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'
import { db } from '@/db'
import { dbWorkoutBuilder } from '../factories'

describe('Workout History Detail View', () => {
  beforeEach(async () => {
    resetInitState()
    await resetDatabase()
  })

  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  it('navigates to detail view when clicking a completed workout and displays exercise and set information', async () => {
    // Arrange: Create a completed workout in the database
    const completedWorkout = dbWorkoutBuilder()
      .withName('Push Day')
      .withDuration(3600)
      .withExerciseAndSets([{ kg: '100', reps: '10', rir: '2' }], {
        name: 'Bench Press',
        equipment: 'Barbell',
        thumbnail: '🏋️',
        targetReps: 8,
      })
      .build()

    await db.workouts.add(completedWorkout)

    // Act: Start at home and navigate to workouts page
    const app = await createTestApp()

    // Navigate to workouts via bottom nav
    const workoutsNavButton = app.getByRole('button', { name: /workouts/i })
    await app.user.click(workoutsNavButton)

    // Wait for workouts page to load
    expect(app.router.currentRoute.value.path).toBe('/workouts')

    // Find the workout card and click it
    const workoutCard = await app.findByText('Push Day')
    await app.user.click(workoutCard)

    // Assert: Verify navigation to detail view
    expect(app.router.currentRoute.value.path).toBe(`/workouts/${completedWorkout.id}`)

    // Assert: Verify workout details are displayed
    expect(app.getByText('Push Day')).toBeDefined()
    expect(app.getByText('Bench Press')).toBeDefined()

    // Expand the exercise card to see set details
    const exerciseCard = app.getByText('Bench Press')
    await app.user.click(exerciseCard)

    // Verify set data is displayed (weight shown as "100kg", reps as "10")
    expect(app.getByText('100kg')).toBeDefined()
    expect(app.getByText('10')).toBeDefined() // reps value

    app.cleanup()
  })
})
