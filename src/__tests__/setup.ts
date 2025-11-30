import 'fake-indexeddb/auto'
import { db } from '@/db'

/**
 * Reset the database between tests to ensure isolation.
 * Clears all tables instead of deleting/reopening to avoid
 * DatabaseClosedError from pending debounced watchers.
 */
export async function resetDatabase(): Promise<void> {
  await db.activeWorkout.clear()
  await db.workouts.clear()
  await db.customExercises.clear()
  await db.templates.clear()
  await db.settings.clear()
}
