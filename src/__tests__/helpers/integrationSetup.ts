import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetBenchmarkWorkout } from '@/features/benchmarks/state/benchmarkState'
import { useBenchmarkGlobalTimer } from '@/composables/timers/useBenchmarkGlobalTimer'
import { usePastWorkout } from '@/features/log-past-workout/composables/usePastWorkout'
import { useOnboarding } from '@/features/onboarding/composables/useOnboarding'
import { resetDatabase } from './resetDatabase'

function resetThemeState(): void {
  localStorage.removeItem('vueuse-color-scheme')
  document.documentElement.classList.remove('dark')
}

/**
 * Cleans up state after an integration test.
 * Resets workout state, benchmark state, timer, database, and clears the DOM.
 */
export async function cleanupIntegrationTest(): Promise<void> {
  resetWorkout()
  resetBenchmarkWorkout()
  useBenchmarkGlobalTimer().reset()
  usePastWorkout().reset()
  await resetDatabase()
  resetThemeState()
  document.body.style.cssText = ''
  document.body.removeAttribute('style')
  document.body.innerHTML = ''
}

/**
 * Sets up state before an integration test.
 * Resets initialization state, benchmark state, timer, and clears the database.
 * By default, marks onboarding as complete so tests can proceed to the home page.
 */
export async function setupIntegrationTest(): Promise<void> {
  resetInitState()
  resetBenchmarkWorkout()
  useBenchmarkGlobalTimer().reset()
  usePastWorkout().reset()
  await resetDatabase()
  resetThemeState()

  // Mark onboarding as complete by default to avoid redirect during tests
  // Tests that need to test onboarding flow should call useOnboarding().$reset()
  const onboarding = useOnboarding()
  onboarding.completed.value = true
  onboarding.isInitialized.value = true
}
