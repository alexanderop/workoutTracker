import 'fake-indexeddb/auto'
import { db } from '@/db'

/**
 * Mock window.matchMedia for PWA standalone detection and media queries in tests.
 * Required for useScreenWakeLock composable and VueUse's useMediaQuery.
 * Uses a regular function (not vi.fn()) so it survives vi.restoreAllMocks().
 */
window.matchMedia = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
})

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
  // Clear seeding marker so exercises are re-seeded in each test
  localStorage.removeItem('exercises_seed_version')
}
