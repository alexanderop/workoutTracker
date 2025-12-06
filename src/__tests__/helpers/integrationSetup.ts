import { resetWorkout } from '@/features/workout/composables/useWorkout'
import { resetInitState } from '@/features/workout/composables/useAppInitialization'
import { resetDatabase } from './resetDatabase'

/**
 * Cleans up state after an integration test.
 * Resets workout state, database, and clears the DOM.
 */
export async function cleanupIntegrationTest(): Promise<void> {
  resetWorkout()
  await resetDatabase()
  document.body.style.cssText = ''
  document.body.removeAttribute('style')
  document.body.innerHTML = ''
}

/**
 * Sets up state before an integration test.
 * Resets initialization state and clears the database.
 */
export async function setupIntegrationTest(): Promise<void> {
  resetInitState()
  await resetDatabase()
}
