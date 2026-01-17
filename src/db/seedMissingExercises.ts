import { generateId, getCustomExercisesRepository } from './index'
import { popularExercises } from '@/data/popularExercises'
import type { DbCustomExercise as DatabaseCustomExercise } from './schema'

/**
 * Add missing exercises to IndexedDB for existing users.
 * Unlike seedPopularExercises which only runs on empty database,
 * this function adds any exercises from popularExercises that don't exist yet.
 */
export async function seedMissingExercises(): Promise<void> {
  const repo = getCustomExercisesRepository()
  const existing = await repo.getAll()

  // Build set of existing exercise names (lowercase for case-insensitive comparison)
  const existingNames = new Set(existing.map((e) => e.name.toLowerCase()))

  // Find exercises that don't exist yet
  const missing = popularExercises.filter((e) => !existingNames.has(e.name.toLowerCase()))

  if (missing.length === 0) {
    return
  }

  const now = Date.now()
  const exercisesToAdd: Array<DatabaseCustomExercise> = missing.map((exercise) => ({
    id: generateId(),
    name: exercise.name,
    equipment: exercise.equipment,
    muscle: exercise.muscle,
    type: exercise.type,
    metrics: exercise.metrics,
    createdAt: now,
    updatedAt: now,
    image: null,
  }))

  await Promise.all(exercisesToAdd.map((ex) => repo.add(ex)))
}
