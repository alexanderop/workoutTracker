import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  DbActiveWorkout,
  DbCompletedWorkout,
  DbCustomExercise,
  DbUserSetting,
  DbWorkoutTemplate,
} from './schema'

class WorkoutTrackerDb extends Dexie {
  customExercises!: Table<DbCustomExercise, string>
  workouts!: Table<DbCompletedWorkout, string>
  activeWorkout!: Table<DbActiveWorkout, 'current'>
  templates!: Table<DbWorkoutTemplate, string>
  settings!: Table<DbUserSetting, string>

  constructor() {
    super('WorkoutTrackerDb')

    this.version(1).stores({
      customExercises: 'id, name, muscle, equipment, createdAt',
      workouts: 'id, startedAt, completedAt',
      activeWorkout: 'id',
      templates: 'id, name, createdAt',
      settings: 'key',
    })
  }
}

export const db = new WorkoutTrackerDb()

/**
 * Generate a unique ID for database records.
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Generate a prefixed ID with timestamp for readability.
 */
export function generatePrefixedId(prefix: string): string {
  return `${prefix}_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`
}
