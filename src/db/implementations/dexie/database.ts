import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  DbActiveBenchmarkWorkout,
  DbActiveWorkout,
  DbBenchmark,
  DbCompletedWorkout,
  DbCustomExercise,
  DbUserSetting,
  DbWeightEntry,
  DbWorkoutTemplate,
} from '@/db/schema'

export class WorkoutTrackerDb extends Dexie {
  customExercises!: Table<DbCustomExercise, string>
  workouts!: Table<DbCompletedWorkout, string>
  activeWorkout!: Table<DbActiveWorkout, 'current'>
  activeBenchmark!: Table<DbActiveBenchmarkWorkout, 'current-benchmark'>
  templates!: Table<DbWorkoutTemplate, string>
  settings!: Table<DbUserSetting, string>
  benchmarks!: Table<DbBenchmark, string>
  weightEntries!: Table<DbWeightEntry, string>

  constructor() {
    super('WorkoutTrackerDb')

    // Version 1: Initial schema
    this.version(1).stores({
      customExercises: 'id, name, muscle, equipment, createdAt',
      workouts: 'id, startedAt, completedAt, benchmarkId',
      activeWorkout: 'id',
      templates: 'id, name, createdAt, lastUsedAt',
      settings: 'key',
      benchmarks: 'id, name, createdAt, lastUsedAt',
    })

    // Version 2: Add activeBenchmark table for benchmark isolation
    this.version(2).stores({
      customExercises: 'id, name, muscle, equipment, createdAt',
      workouts: 'id, startedAt, completedAt, benchmarkId',
      activeWorkout: 'id',
      activeBenchmark: 'id',
      templates: 'id, name, createdAt, lastUsedAt',
      settings: 'key',
      benchmarks: 'id, name, createdAt, lastUsedAt',
    })

    // Version 3: Add weightEntries table for body weight tracking
    this.version(3).stores({
      customExercises: 'id, name, muscle, equipment, createdAt',
      workouts: 'id, startedAt, completedAt, benchmarkId',
      activeWorkout: 'id',
      activeBenchmark: 'id',
      templates: 'id, name, createdAt, lastUsedAt',
      settings: 'key',
      benchmarks: 'id, name, createdAt, lastUsedAt',
      weightEntries: 'id, date, recordedAt',
    })
  }
}

/**
 * Singleton database instance for the Dexie implementation.
 */
export const db = new WorkoutTrackerDb()

/**
 * Handle database version changes from other tabs.
 * When another tab upgrades the database schema, this tab must close
 * its connection to allow the upgrade to proceed.
 */
db.on('versionchange', () => {
  db.close()
})

/**
 * Generate a unique ID for database records.
 */
export function generateId(): string {
  return crypto.randomUUID()
}
