import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetBenchmarkWorkout } from '@/features/benchmarks/state/benchmarkState'
import { useBenchmarkGlobalTimer } from '@/composables/timers/useBenchmarkGlobalTimer'
import { resetDatabase } from './resetDatabase'

/**
 * Cleans up state after an integration test.
 * Resets workout state, benchmark state, timer, database, and clears the DOM.
 */
export async function cleanupIntegrationTest(): Promise<void> {
  resetWorkout()
  resetBenchmarkWorkout()
  useBenchmarkGlobalTimer().reset()
  await resetDatabase()
  document.body.style.cssText = ''
  document.body.removeAttribute('style')
  document.body.innerHTML = ''
}

/**
 * Sets up state before an integration test.
 * Resets initialization state, benchmark state, timer, and clears the database.
 */
export async function setupIntegrationTest(): Promise<void> {
  resetInitState()
  resetBenchmarkWorkout()
  useBenchmarkGlobalTimer().reset()
  await resetDatabase()
}
