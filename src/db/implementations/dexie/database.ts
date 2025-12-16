import Dexie from 'dexie'
import type { Table } from 'dexie'
import type {
  DbActiveBenchmarkWorkout,
  DbActiveWorkout,
  DbBenchmark,
  DbBenchmarkAttempt,
  DbBenchmarkPersonalBest,
  DbExercise,
  DbNormalizedBlock,
  DbNormalizedBlockExercise,
  DbNormalizedSet,
  DbNormalizedTemplateBlock,
  DbNormalizedTemplateBlockExercise,
  DbTemplateHeader,
  DbUserSetting,
  DbWorkoutHeader,
} from '@/db/schema'

class WorkoutTrackerDb extends Dexie {
  // Core entities
  exercises!: Table<DbExercise, string>
  workoutHeaders!: Table<DbWorkoutHeader, string>
  benchmarks!: Table<DbBenchmark, string>
  templates!: Table<DbTemplateHeader, string>

  // Normalized workout data
  workoutBlocks!: Table<DbNormalizedBlock, string>
  workoutSets!: Table<DbNormalizedSet, string>
  blockExercises!: Table<DbNormalizedBlockExercise, string>

  // Normalized template data
  templateBlocks!: Table<DbNormalizedTemplateBlock, string>
  templateBlockExercises!: Table<DbNormalizedTemplateBlockExercise, string>

  // Denormalized performance tables
  benchmarkPersonalBests!: Table<DbBenchmarkPersonalBest, string>
  benchmarkAttempts!: Table<DbBenchmarkAttempt, string>

  // Singletons (embedded)
  activeWorkout!: Table<DbActiveWorkout, 'current'>
  activeBenchmark!: Table<DbActiveBenchmarkWorkout, 'current-benchmark'>
  settings!: Table<DbUserSetting, string>

  constructor() {
    super('WorkoutTrackerDb')

    // Version 1: Normalized schema (fresh start - no migration needed)
    this.version(1).stores({
      // Core entities
      exercises: 'id, name, muscle, equipment, createdAt, isBuiltIn',
      workoutHeaders: 'id, completedAt, benchmarkId, startedAt, templateId',
      benchmarks: 'id, name, createdAt, lastUsedAt',
      templates: 'id, name, createdAt, lastUsedAt, usageCount',

      // Normalized workout data
      // [workoutId+orderIndex] is a compound index for efficient ordered retrieval
      workoutBlocks: 'id, workoutId, [workoutId+orderIndex], kind',
      workoutSets: 'id, blockId, [blockId+orderIndex]',
      blockExercises: 'id, blockId, [blockId+orderIndex]',

      // Normalized template data
      templateBlocks: 'id, templateId, [templateId+orderIndex]',
      templateBlockExercises: 'id, blockId, [blockId+orderIndex]',

      // Denormalized performance tables
      benchmarkPersonalBests: 'benchmarkId',
      benchmarkAttempts: 'id, benchmarkId, workoutId, [benchmarkId+completedAt]',

      // Singletons (embedded - keep simple)
      activeWorkout: 'id',
      activeBenchmark: 'id',
      settings: 'key',
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
