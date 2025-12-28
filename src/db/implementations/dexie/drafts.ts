import type { DbFormDraft } from '@/db/schema'
import { db } from './database'

/**
 * Repository for managing form drafts.
 * Used by useFormDraft composable to persist creation form state.
 */
export const draftsRepository = {
  /**
   * Get a draft by key.
   */
  async get(key: string): Promise<DbFormDraft | undefined> {
    return db.drafts.get(key)
  },

  /**
   * Save or update a draft.
   */
  async save(key: string, data: unknown): Promise<void> {
    await db.drafts.put({
      key,
      data,
      savedAt: Date.now(),
    })
  },

  /**
   * Delete a draft by key.
   */
  async delete(key: string): Promise<void> {
    await db.drafts.delete(key)
  },
}
