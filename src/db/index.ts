import type {
  ActiveBenchmarkWorkoutRepository,
  ActiveWorkoutRepository,
  BenchmarkAttemptsRepository,
  BenchmarkPersonalBestsRepository,
  BenchmarksRepository,
  BlockExercisesRepository,
  DataManagementRepository,
  ExercisesRepository,
  SettingsRepository,
  TemplateBlockExercisesRepository,
  TemplateBlocksRepository,
  TemplatesRepository,
  WorkoutBlocksRepository,
  WorkoutSetsRepository,
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
// Repository Getters - Normalized Data
// ============================================

export function getWorkoutBlocksRepository(): WorkoutBlocksRepository {
  return getRepositoryProvider().workoutBlocks
}

export function getWorkoutSetsRepository(): WorkoutSetsRepository {
  return getRepositoryProvider().workoutSets
}

export function getBlockExercisesRepository(): BlockExercisesRepository {
  return getRepositoryProvider().blockExercises
}

export function getTemplateBlocksRepository(): TemplateBlocksRepository {
  return getRepositoryProvider().templateBlocks
}

export function getTemplateBlockExercisesRepository(): TemplateBlockExercisesRepository {
  return getRepositoryProvider().templateBlockExercises
}

export function getBenchmarkAttemptsRepository(): BenchmarkAttemptsRepository {
  return getRepositoryProvider().benchmarkAttempts
}

export function getBenchmarkPersonalBestsRepository(): BenchmarkPersonalBestsRepository {
  return getRepositoryProvider().benchmarkPersonalBests
}

// ============================================
// Repository Getters - Data Management
// ============================================

export function getDataManagementRepository(): DataManagementRepository {
  return getRepositoryProvider().dataManagement
}

// ============================================
// Legacy Getters (deprecated)
// ============================================

/**
 * @deprecated Use getExercisesRepository() instead
 */
export function getCustomExercisesRepository(): ExercisesRepository {
  return getRepositoryProvider().exercises
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
