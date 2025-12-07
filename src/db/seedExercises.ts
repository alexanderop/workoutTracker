import { generateId, getCustomExercisesRepository } from './index'
import { popularExercises } from '@/data/popularExercises'
import type { DbCustomExercise } from './schema'

/**
 * Seed popular exercises to IndexedDB if not already seeded.
 * Checks IndexedDB directly since browsers may clear it while keeping localStorage.
 */
export async function seedPopularExercises(): Promise<void> {
  const repo = getCustomExercisesRepository()
  const existing = await repo.getAll()
  if (existing.length > 0) {
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

  // Add each exercise using the repository
  await Promise.all(exercisesToSeed.map((ex) => repo.add(ex)))
}
