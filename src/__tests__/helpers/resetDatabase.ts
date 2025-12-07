import { getDataManagementRepository } from '@/db'

/**
 * Reset the database between tests to ensure isolation.
 * Clears all tables instead of deleting/reopening to avoid
 * DatabaseClosedError from pending debounced watchers.
 */
export async function resetDatabase(): Promise<void> {
  await getDataManagementRepository().deleteAll()
  // Clear seeding marker so exercises are re-seeded in each test
  localStorage.removeItem('exercises_seed_version')
}
