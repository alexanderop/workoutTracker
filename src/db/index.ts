import type {
  ActiveBenchmarkWorkoutRepository,
  ActiveWorkoutRepository,
  BenchmarksRepository,
  CustomExercisesRepository,
  DataManagementRepository,
  DraftsRepository,
  ExerciseProgressRepository,
  ProgressionsRepository,
  SettingsRepository,
  TemplatesRepository,
  WeightRepository,
  WorkoutsRepository,
} from './interfaces'
import { getRepositoryProvider } from './provider'
import { tryCatch } from '@/lib/tryCatch'
import { createDexieExerciseProgressRepository } from './implementations/dexie/exerciseProgress'
import { db } from './implementations/dexie/database'

// Re-export types for consumers
export * from './interfaces'

// ============================================
// Repository Getters
// ============================================

export function getActiveWorkoutRepository(): ActiveWorkoutRepository {
  return getRepositoryProvider().activeWorkout
}

export function getActiveBenchmarkWorkoutRepository(): ActiveBenchmarkWorkoutRepository {
  return getRepositoryProvider().activeBenchmark
}

export function getWorkoutsRepository(): WorkoutsRepository {
  return getRepositoryProvider().workouts
}

export function getTemplatesRepository(): TemplatesRepository {
  return getRepositoryProvider().templates
}

export function getCustomExercisesRepository(): CustomExercisesRepository {
  return getRepositoryProvider().customExercises
}

export function getSettingsRepository(): SettingsRepository {
  return getRepositoryProvider().settings
}

export function getDataManagementRepository(): DataManagementRepository {
  return getRepositoryProvider().dataManagement
}

export function getBenchmarksRepository(): BenchmarksRepository {
  return getRepositoryProvider().benchmarks
}

export function getWeightRepository(): WeightRepository {
  return getRepositoryProvider().weight
}

export function getDraftsRepository(): DraftsRepository {
  return getRepositoryProvider().drafts
}

export function getProgressionsRepository(): ProgressionsRepository {
  return getRepositoryProvider().progressions
}

let exerciseProgressRepository: ExerciseProgressRepository | null = null

export function getExerciseProgressRepository(): ExerciseProgressRepository {
  if (!exerciseProgressRepository) {
    exerciseProgressRepository = createDexieExerciseProgressRepository(db)
  }
  return exerciseProgressRepository
}

/**
 * Reset the exercise progress repository cache.
 * Used in tests to ensure clean state between test files.
 */
export function resetExerciseProgressRepository(): void {
  exerciseProgressRepository = null
}

// ============================================
// Utilities
// ============================================

/**
 * Generate a unique ID for database records.
 */
export function generateId(): string {
  return crypto.randomUUID()
}

/**
 * Delete all data from the database and recreate it.
 */
export async function deleteAllData(): Promise<void> {
  await tryCatch(getDataManagementRepository().deleteAll())
}

// ============================================
// Test Utilities
// ============================================

/**
 * Get the underlying Dexie database instance for test setup/teardown.
 * Only use this in integration tests - prefer repository methods for production code.
 */
export { db } from './implementations/dexie/database'
