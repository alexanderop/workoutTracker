import { generateId, getCustomExercisesRepository as getCustomExercisesRepo } from './index'
import { egymExercises, popularExercises } from '@/data/popularExercises'
import type { PopularExercise } from '@/data/popularExercises'
import type { DbCustomExercise as DatabaseCustomExercise } from './schema'

const SEED_VERSION_KEY = 'exercises_seed_version'

/** Bump when a new batch is appended to SEED_BATCHES. */
const CURRENT_SEED_VERSION = 2

/**
 * Catalog batches added after the initial seed. Databases seeded before a
 * batch existed are topped up exactly once (tracked via SEED_VERSION_KEY),
 * so user deletions are not resurrected on later app starts.
 */
const SEED_BATCHES: ReadonlyArray<{
  version: number
  exercises: ReadonlyArray<PopularExercise>
}> = [{ version: 2, exercises: egymExercises }]

function toDatabaseExercises(
  exercises: ReadonlyArray<PopularExercise>,
  now: number,
): Array<DatabaseCustomExercise> {
  return exercises.map((exercise) => ({
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
}

/**
 * Seed popular exercises to IndexedDB if not already seeded.
 * Checks IndexedDB directly since browsers may clear it while keeping localStorage.
 *
 * For databases seeded by an older app version, applies any newer catalog
 * batches (skipping names the user already has) instead of a full re-seed.
 */
export async function seedPopularExercises(): Promise<void> {
  const repo = getCustomExercisesRepo()
  const existing = await repo.getAll()
  const now = Date.now()

  if (existing.length === 0) {
    const exercisesToSeed = toDatabaseExercises(popularExercises, now)
    await Promise.all(exercisesToSeed.map((ex) => repo.add(ex)))
    localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION))
    return
  }

  // Installs from before versioned seeding have no marker — treat them as v1.
  const seededVersion = Number(localStorage.getItem(SEED_VERSION_KEY)) || 1
  if (seededVersion >= CURRENT_SEED_VERSION) return

  const existingNames = new Set(existing.map((exercise) => exercise.name))
  const missingExercises = SEED_BATCHES.flatMap((batch) =>
    batch.version > seededVersion ? batch.exercises : [],
  ).filter((exercise) => !existingNames.has(exercise.name))

  const exercisesToSeed = toDatabaseExercises(missingExercises, now)
  await Promise.all(exercisesToSeed.map((ex) => repo.add(ex)))
  localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION))
}
