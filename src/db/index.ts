import type {
  ActiveBenchmarkWorkoutRepository,
  ActiveWorkoutRepository,
  BenchmarksRepository,
  DataManagementRepository,
  ExercisesRepository,
  SettingsRepository,
  TemplatesRepository,
  WorkoutsRepository,
} from './interfaces'
import { getRepositoryProvider } from './provider'
import { tryCatch } from '@/lib/tryCatch'

// Re-export types for consumers
export * from './interfaces'

// ============================================
// Repository Getters - Singletons
// ============================================

export function getActiveWorkoutRepository(): ActiveWorkoutRepository {
  return getRepositoryProvider().activeWorkout
}

export function getActiveBenchmarkWorkoutRepository(): ActiveBenchmarkWorkoutRepository {
  return getRepositoryProvider().activeBenchmark
}

export function getSettingsRepository(): SettingsRepository {
  return getRepositoryProvider().settings
}

// ============================================
// Repository Getters - Core Entities
// ============================================

export function getExercisesRepository(): ExercisesRepository {
  return getRepositoryProvider().exercises
}

export function getBenchmarksRepository(): BenchmarksRepository {
  return getRepositoryProvider().benchmarks
}

export function getTemplatesRepository(): TemplatesRepository {
  return getRepositoryProvider().templates
}

export function getWorkoutsRepository(): WorkoutsRepository {
  return getRepositoryProvider().workouts
}

// ============================================
// Repository Getters - Data Management
// ============================================

export function getDataManagementRepository(): DataManagementRepository {
  return getRepositoryProvider().dataManagement
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
