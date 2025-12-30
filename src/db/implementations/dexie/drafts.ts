import type { DraftsRepository } from '@/db/interfaces'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'

/**
 * Create a Dexie implementation of the DraftsRepository.
 * Used by useFormDraft composable to persist creation form state.
 */
export function createDexieDraftsRepository(database: WorkoutTrackerDatabase): DraftsRepository {
  return {
    async get(key) {
      return database.drafts.get(key)
    },

    async save(key, data) {
      await database.drafts.put({
        key,
        data,
        savedAt: Date.now(),
      })
    },

    async delete(key) {
      await database.drafts.delete(key)
    },
  }
}
