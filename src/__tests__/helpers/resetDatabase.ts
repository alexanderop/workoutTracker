import { getDataManagementRepository, resetExerciseProgressRepository } from '@/db'
import { resetRepositoryProvider } from '@/db/provider'
import { resetBenchmarkWorkout } from '@/features/benchmarks/state/benchmarkState'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetWorkoutPersistence } from '@/features/workout/composables/useWorkoutPersistence'
import { useExercisesStore } from '@/stores/exercises'
import { useSettingsStore } from '@/stores/settings'
import { resetWorkout } from '@/stores/workoutState'
import { useBenchmarkGlobalTimer } from '@/composables/timers/useBenchmarkGlobalTimer'

/**
 * Reset the database and all singleton state between tests.
 * This enables fileParallelism by ensuring complete isolation.
 */
export async function resetDatabase(): Promise<void> {
  // Clear all database tables
  await getDataManagementRepository().deleteAll()

  // Clear seeding marker so exercises are re-seeded in each test
  localStorage.removeItem('exercises_seed_version')

  // Reset global state stores (VueUse createGlobalState)
  useSettingsStore().$reset()
  useExercisesStore().$reset()

  // Reset singleton workout state
  resetWorkout()
  resetBenchmarkWorkout()
  resetWorkoutPersistence()
  resetInitState()

  // Reset timers
  useBenchmarkGlobalTimer().reset()

  // Reset repository caches (forces fresh instances on next access)
  resetExerciseProgressRepository()
  resetRepositoryProvider()
}
