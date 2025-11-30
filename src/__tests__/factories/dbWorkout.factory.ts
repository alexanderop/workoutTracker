import type { DbCompletedWorkout, DbWorkoutExercise, DbSet } from '@/db/schema'
import { generateId } from '@/db'
import { createDbExercise, createDbExerciseWithSets } from './dbExercise.factory'

const DEFAULTS: Readonly<Omit<DbCompletedWorkout, 'id' | 'exercises'>> = {
  name: 'Test Workout',
  startedAt: Date.now() - 3600000,
  completedAt: Date.now(),
  durationSeconds: 3600,
  notes: '',
}

export function createDbCompletedWorkout(
  overrides: Partial<DbCompletedWorkout> = {},
): DbCompletedWorkout {
  return {
    id: generateId(),
    ...DEFAULTS,
    exercises: overrides.exercises ?? [createDbExercise()],
    ...overrides,
  }
}

export class DbWorkoutBuilder {
  private workout: DbCompletedWorkout

  constructor() {
    this.workout = createDbCompletedWorkout({ exercises: [] })
  }

  withName(name: string): this {
    this.workout = { ...this.workout, name }
    return this
  }

  withNotes(notes: string): this {
    this.workout = { ...this.workout, notes }
    return this
  }

  withDuration(seconds: number): this {
    this.workout = { ...this.workout, durationSeconds: seconds }
    return this
  }

  withTimestamps(startedAt: number, completedAt: number): this {
    this.workout = { ...this.workout, startedAt, completedAt }
    return this
  }

  withExercise(overrides: Partial<DbWorkoutExercise> = {}): this {
    const orderIndex = this.workout.exercises.length
    const exercise = createDbExercise({ orderIndex, ...overrides })
    this.workout = {
      ...this.workout,
      exercises: [...this.workout.exercises, exercise],
    }
    return this
  }

  withExerciseAndSets(
    sets: ReadonlyArray<Partial<DbSet>>,
    exerciseOverrides: Partial<Omit<DbWorkoutExercise, 'sets'>> = {},
  ): this {
    const orderIndex = this.workout.exercises.length
    const exercise = createDbExerciseWithSets(sets, { orderIndex, ...exerciseOverrides })
    this.workout = {
      ...this.workout,
      exercises: [...this.workout.exercises, exercise],
    }
    return this
  }

  build(): DbCompletedWorkout {
    return this.workout
  }
}

export function dbWorkoutBuilder(): DbWorkoutBuilder {
  return new DbWorkoutBuilder()
}
