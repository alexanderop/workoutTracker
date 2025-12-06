import type {
  ActiveWorkoutRepository,
  CustomExercisesRepository,
  DataManagementRepository,
  SettingsRepository,
  TemplatesRepository,
  WorkoutsRepository,
} from './interfaces'
import { getRepositoryProvider } from './provider'

// Re-export types for consumers
export * from './interfaces'
export { setRepositoryProvider, resetRepositoryProvider } from './provider'

// ============================================
// Repository Getters
// ============================================

export function getActiveWorkoutRepository(): ActiveWorkoutRepository {
  return getRepositoryProvider().activeWorkout
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
 * @deprecated Use getDataManagementRepository().deleteAll() instead
 */
export async function deleteAllData(): Promise<void> {
  await getDataManagementRepository().deleteAll()
}

// ============================================
// Test Utilities
// ============================================

/**
 * Get the underlying Dexie database instance for test setup/teardown.
 * Only use this in integration tests - prefer repository methods for production code.
 */
export { db } from './implementations/dexie/database'
