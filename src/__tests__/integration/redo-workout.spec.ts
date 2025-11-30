import { afterEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { resetWorkout } from '@/composables/useWorkout'
import { resetDatabase } from '../setup'
import { db } from '@/db'
import { dbWorkoutBuilder } from '../factories'

describe('Redo Workout', () => {
  afterEach(async () => {
    resetWorkout()
    await resetDatabase()
    document.body.innerHTML = ''
  })

  it('creates a new active workout session with exercises and sets prefilled from the completed workout', async () => {
    // Arrange: Create a completed workout with two exercises
    const completedWorkout = dbWorkoutBuilder()
      .withName('Leg Day')
      .withDuration(7200)
      .withExerciseAndSets(
        [
          { kg: '80', reps: '8', rir: '2' },
          { kg: '85', reps: '6', rir: '1' },
        ],
        { name: 'Squats', equipment: 'Barbell', thumbnail: '🏋️', targetReps: 8 },
      )
      .withExerciseAndSets([{ kg: '120', reps: '10', rir: '3' }], {
        name: 'Leg Press',
        equipment: 'Machine',
        thumbnail: '💪',
        targetReps: 10,
      })
      .build()

    await db.workouts.add(completedWorkout)

    // Act: Navigate to the workout detail view
    const app = await createTestApp()
    await app.navigateTo(`/workouts/${completedWorkout.id}`)

    // Click the "Redo Workout" button
    const redoButton = app.getByRole('button', { name: /redo workout/i })
    await app.user.click(redoButton)

    // Assert: User is navigated to active workout
    await app.waitForRoute(/^\/workout\/active$/)
    expect(app.router.currentRoute.value.path).toBe('/workout/active')

    // Assert: Both exercises are present in the carousel
    const exerciseButtons = app.getCarouselExerciseButtons()
    expect(exerciseButtons).toHaveLength(2)

    // Assert: First exercise (Squats) is selected and has correct sets
    const squatsButton = app.getByRole('button', { name: /squats/i, pressed: true })
    expect(squatsButton).toBeDefined()

    // Verify Squats has 2 sets with prefilled values
    const squatsSet1Row = app.getSetRow(0)
    expect(squatsSet1Row.kg.value).toBe('80')
    expect(squatsSet1Row.reps.value).toBe('8')

    const squatsSet2Row = app.getSetRow(1)
    expect(squatsSet2Row.kg.value).toBe('85')
    expect(squatsSet2Row.reps.value).toBe('6')

    // Verify sets are in 'planned' status (not completed)
    // Complete button should NOT have the completed styling (bg-green-500)
    expect(squatsSet1Row.complete.className).not.toContain('bg-green-500')
    expect(squatsSet2Row.complete.className).not.toContain('bg-green-500')

    // Switch to Leg Press exercise (button name is truncated to "💪Leg" in the UI)
    const legPressButton = app.getByRole('button', { name: /leg/i, pressed: false })
    await app.user.click(legPressButton)

    // Verify Leg Press has 1 set with prefilled values
    const legPressSetRow = app.getSetRow(0)
    expect(legPressSetRow.kg.value).toBe('120')
    expect(legPressSetRow.reps.value).toBe('10')
    expect(legPressSetRow.complete.className).not.toContain('bg-green-500')

    app.cleanup()
  })
})
