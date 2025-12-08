import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  DbActiveWorkout,
  DbBenchmark,
  DbCompletedWorkout,
  DbCustomExercise,
  DbUserSetting,
  DbWorkoutTemplate,
} from '@/db/schema'

export class WorkoutTrackerDb extends Dexie {
  customExercises!: Table<DbCustomExercise, string>
  workouts!: Table<DbCompletedWorkout, string>
  activeWorkout!: Table<DbActiveWorkout, 'current'>
  templates!: Table<DbWorkoutTemplate, string>
  settings!: Table<DbUserSetting, string>
  benchmarks!: Table<DbBenchmark, string>

  constructor() {
    super('WorkoutTrackerDb')

    this.version(1).stores({
      customExercises: 'id, name, muscle, equipment, createdAt',
      workouts: 'id, startedAt, completedAt',
      activeWorkout: 'id',
      templates: 'id, name, createdAt, lastUsedAt',
      settings: 'key',
      benchmarks: 'id, name, createdAt, lastUsedAt',
    })
  }
}

/**
 * Singleton database instance for the Dexie implementation.
 */
export const db = new WorkoutTrackerDb()

/**
 * Generate a unique ID for database records.
 */
export function generateId(): string {
  return crypto.randomUUID()
}
