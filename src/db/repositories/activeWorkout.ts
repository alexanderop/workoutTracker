import { db } from '../index'
import type { DbActiveWorkout } from '../schema'

/**
 * Repository for managing the active (in-progress) workout.
 * Only one active workout exists at a time.
 */
export const activeWorkoutRepository = {
  /**
   * Get the current active workout if one exists.
   */
  async get(): Promise<DbActiveWorkout | undefined> {
    return db.activeWorkout.get('current')
  },

  /**
   * Save or update the active workout.
   * Always uses 'current' as the ID.
   */
  async save(workout: Readonly<DbActiveWorkout>): Promise<void> {
    await db.activeWorkout.put({
      ...workout,
      id: 'current',
      lastModifiedAt: Date.now(),
    })
  },

  /**
   * Clear the active workout (e.g., when discarded or completed).
   */
  async clear(): Promise<void> {
    await db.activeWorkout.delete('current')
  },

  /**
   * Check if an active workout exists.
   */
  async exists(): Promise<boolean> {
    const count = await db.activeWorkout.count()
    return count > 0
  },
}
