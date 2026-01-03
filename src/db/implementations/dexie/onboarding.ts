import type { OnboardingRepository } from '@/db/interfaces'
import type { DbOnboarding } from '@/db/schema'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'
import { tryCatch } from '@/lib/tryCatch'

const DEFAULT_ONBOARDING: DbOnboarding = {
  id: 'onboarding',
  completed: false,
  currentStep: 0,
}

/**
 * Create a Dexie implementation of the OnboardingRepository.
 * Uses singleton pattern (id is always 'onboarding').
 */
export function createDexieOnboardingRepository(
  database: WorkoutTrackerDatabase,
): OnboardingRepository {
  return {
    async get() {
      const [error, record] = await tryCatch(database.onboarding.get('onboarding'))

      // Fail-open: if DB fails, assume completed to avoid blocking app access
      if (error) {
        return { ...DEFAULT_ONBOARDING, completed: true }
      }

      return record ?? { ...DEFAULT_ONBOARDING }
    },

    async update(data) {
      const existing = await database.onboarding.get('onboarding')
      await database.onboarding.put({
        ...DEFAULT_ONBOARDING,
        ...existing,
        ...data,
        id: 'onboarding',
      })
    },

    async complete() {
      await database.onboarding.put({
        id: 'onboarding',
        completed: true,
        currentStep: 0,
      })
    },

    async reset() {
      await database.onboarding.delete('onboarding')
    },
  }
}
