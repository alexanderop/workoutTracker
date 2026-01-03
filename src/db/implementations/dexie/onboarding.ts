import type { OnboardingRepository } from '@/db/interfaces'
import { tryCatch } from '@/lib/tryCatch'
import type { WorkoutTrackerDb } from './database'

const DEFAULT_STATE = { completed: false, currentStep: 0 }

/**
 * Dexie implementation of the onboarding repository.
 * Uses singleton pattern with id always set to 'onboarding'.
 */
export function createDexieOnboardingRepository(
  database: WorkoutTrackerDb,
): OnboardingRepository {
  return {
    async get() {
      const [error, record] = await tryCatch(database.onboarding.get('onboarding'))

      if (error) {
        // Fail-open: assume complete to avoid blocking app access on DB error
        return { completed: true, currentStep: 0 }
      }

      if (!record) {
        return DEFAULT_STATE
      }

      return { completed: record.completed, currentStep: record.currentStep }
    },

    async save(data) {
      const current = await database.onboarding.get('onboarding')
      await database.onboarding.put({
        id: 'onboarding',
        completed: data.completed ?? current?.completed ?? false,
        currentStep: data.currentStep ?? current?.currentStep ?? 0,
      })
    },

    async markComplete() {
      const current = await database.onboarding.get('onboarding')
      await database.onboarding.put({
        id: 'onboarding',
        completed: true,
        currentStep: current?.currentStep ?? 0,
      })
    },
  }
}
