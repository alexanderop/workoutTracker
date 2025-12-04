import { db, generateId } from './index'
import { popularExercises } from '@/data/popularExercises'
import type { DbCustomExercise } from './schema'

/**
 * Seed popular exercises to IndexedDB if not already seeded.
 * Checks IndexedDB directly since browsers may clear it while keeping localStorage.
 */
export async function seedPopularExercises(): Promise<void> {
  const existingCount = await db.customExercises.count()
  if (existingCount > 0) {
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
}
