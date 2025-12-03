import { db, generateId } from './index'
import { popularExercises } from '@/data/popularExercises'
import type { DbCustomExercise } from './schema'

const SEED_VERSION_KEY = 'exercises_seed_version'
const CURRENT_SEED_VERSION = 1

/**
 * Seed popular exercises to IndexedDB if not already seeded.
 * Uses localStorage to track seed version for idempotency.
 */
export async function seedPopularExercises(): Promise<void> {
  const storedVersion = localStorage.getItem(SEED_VERSION_KEY)

  if (storedVersion === String(CURRENT_SEED_VERSION)) {
    return
  }

  // Check if exercises already exist (handles case where localStorage was cleared)
  const existingCount = await db.customExercises.count()
  if (existingCount > 0) {
    localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION))
    return
  }

  const now = Date.now()
  const exercisesToSeed: Array<DbCustomExercise> = popularExercises.map((exercise) => ({
    id: generateId(),
    icon: exercise.icon,
    name: exercise.name,
    equipment: exercise.equipment,
    muscle: exercise.muscle,
    type: exercise.type,
    metrics: exercise.metrics,
    createdAt: now,
    updatedAt: now,
  }))

  await db.customExercises.bulkAdd(exercisesToSeed)
  localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION))
}
