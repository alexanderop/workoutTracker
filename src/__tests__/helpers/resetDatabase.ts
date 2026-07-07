import { getDataManagementRepository } from '@/db'
import { resetBenchmarkWorkout } from '@/features/benchmarks/state/benchmarkState'
import { useOnboarding } from '@/features/onboarding/composables/useOnboarding'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetWorkoutPersistence } from '@/features/workout/composables/useWorkoutPersistence'
import { useExercisesStore } from '@/stores/exercises'
import { useSettingsStore } from '@/stores/settings'
import { resetWorkout } from '@/stores/workoutState'
import { useBenchmarkGlobalTimer } from '@/composables/timers/useBenchmarkGlobalTimer'
import { useToastStore } from '@/stores/toast'
import { installProviderUnderTest } from './providerUnderTest'

/**
 * Reset the database and all singleton state between tests.
 * This enables fileParallelism by ensuring complete isolation.
 */
export async function resetDatabase(): Promise<void> {
  // Clear all database tables (including onboarding for complete test isolation)
  await getDataManagementRepository().deleteAll({ preserveOnboarding: false })

  // Clear seeding marker so exercises are re-seeded in each test
  localStorage.removeItem('exercises_seed_version')

  // Reset global state stores (VueUse createGlobalState)
  useSettingsStore().$reset()
  useExercisesStore().$reset()
  useOnboarding().$reset()
  useToastStore().$reset()

  // Reset singleton workout state
  resetWorkout()
  resetBenchmarkWorkout()
  resetWorkoutPersistence()
  resetInitState()

  // Reset timers
  useBenchmarkGlobalTimer().reset()

  // Re-install the provider under test (forces fresh repository instances,
  // and is the single seam every integration spec runs through — see AC8).
  installProviderUnderTest()
}
