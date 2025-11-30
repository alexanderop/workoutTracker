import type { Exercise, Set, Workout } from '@/composables/useWorkout'
import { createExercise, createExerciseWithSets } from './exercise.factory'
import { createWorkout } from './workout.factory'

export class WorkoutBuilder {
  private workout: Workout

  constructor() {
    this.workout = createWorkout({ exercises: [] })
  }

  withName(name: string): this {
    this.workout.name = name
    return this
  }

  withExercise(exercise: Partial<Exercise> = {}): this {
    const id = this.workout.exercises.length + 1
    this.workout.exercises.push(createExercise({ id, ...exercise }))
    if (this.workout.exercises.length === 1) {
      this.workout.selectedExerciseId = id
    }
    return this
  }

  withExerciseAndSets(
    sets: ReadonlyArray<Partial<Set>>,
    exerciseOverrides: Partial<Omit<Exercise, 'sets'>> = {},
  ): this {
    const id = this.workout.exercises.length + 1
    this.workout.exercises.push(createExerciseWithSets(sets, { id, ...exerciseOverrides }))
    if (this.workout.exercises.length === 1) {
      this.workout.selectedExerciseId = id
    }
    return this
  }

  selectExercise(exerciseId: number): this {
    this.workout.selectedExerciseId = exerciseId
    return this
  }

  build(): Workout {
    return this.workout
  }
}

export function workoutBuilder(): WorkoutBuilder {
  return new WorkoutBuilder()
}
