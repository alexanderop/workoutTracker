import type {
  ActiveBenchmarkWorkoutRepository as ActiveBenchmarkWorkoutRepo,
  ActiveWorkoutRepository as ActiveWorkoutRepo,
  BenchmarksRepository as BenchmarksRepo,
  CustomExercisesRepository as CustomExercisesRepo,
  DataManagementRepository as DataManagementRepo,
  DraftsRepository as DraftsRepo,
  ExerciseProgressRepository as ExerciseProgressRepo,
  OnboardingRepository as OnboardingRepo,
  ProgressionsRepository as ProgressionsRepo,
  SettingsRepository as SettingsRepo,
  TemplatesRepository,
  WeightRepository,
  WorkoutsRepository,
} from './interfaces'
import { getRepositoryProvider } from './provider'
import { tryCatch } from '@/lib/tryCatch'
import { createDexieExerciseProgressRepository } from './implementations/dexie/exerciseProgress'
import { db as database } from './implementations/dexie/database'

// Re-export types for consumers
export * from './interfaces'

// ============================================
// Repository Getters
// ============================================

export function getActiveWorkoutRepository(): ActiveWorkoutRepo {
  return getRepositoryProvider().activeWorkout
}

export function getActiveBenchmarkWorkoutRepository(): ActiveBenchmarkWorkoutRepo {
  return getRepositoryProvider().activeBenchmark
}

export function getWorkoutsRepository(): WorkoutsRepository {
  return getRepositoryProvider().workouts
}

export function getTemplatesRepository(): TemplatesRepository {
  return getRepositoryProvider().templates
}

export function getCustomExercisesRepository(): CustomExercisesRepo {
  return getRepositoryProvider().customExercises
}

export function getSettingsRepository(): SettingsRepo {
  return getRepositoryProvider().settings
}

export function getDataManagementRepository(): DataManagementRepo {
  return getRepositoryProvider().dataManagement
}

export function getBenchmarksRepository(): BenchmarksRepo {
  return getRepositoryProvider().benchmarks
}

export function getWeightRepository(): WeightRepository {
  return getRepositoryProvider().weight
}

export function getDraftsRepository(): DraftsRepo {
  return getRepositoryProvider().drafts
}

export function getProgressionsRepository(): ProgressionsRepo {
  return getRepositoryProvider().progressions
}

export function getOnboardingRepository(): OnboardingRepo {
  return getRepositoryProvider().onboarding
}

let exerciseProgressRepo: ExerciseProgressRepo | null = null

export function getExerciseProgressRepository(): ExerciseProgressRepo {
  if (!exerciseProgressRepo) {
    exerciseProgressRepo = createDexieExerciseProgressRepository(database)
  }
  return exerciseProgressRepo
}

/**
 * Reset the exercise progress repository cache.
 * Used in tests to ensure clean state between test files.
 */
export function resetExerciseProgressRepository(): void {
  exerciseProgressRepo = null
}

// ============================================
// Utilities
// ============================================

export { generateId } from './generateId'

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
