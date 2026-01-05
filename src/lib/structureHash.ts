import type { DbBenchmarkRound } from '@/db/schema'

/**
 * Structure item used for hash generation.
 * Includes only fields that affect workout structure (excludes images, orderKeys).
 */
type StructureExercise = {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
}

type StructureRound = {
  exercises: Array<StructureExercise>
}

/**
 * Simple string hash function (djb2 algorithm).
 * Produces consistent hash for structure comparison.
 */
function hashString(str: string): string {
  let hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ (str.codePointAt(i) ?? 0)
  }
  // Convert to unsigned 32-bit integer and then to hex string
  return (hash >>> 0).toString(16)
}

/**
 * Generates a structure hash from benchmark rounds.
 *
 * Hash includes:
 * - Exercise names
 * - Exercise definition IDs
 * - Prescribed reps
 * - Order of exercises within rounds
 * - Order of rounds
 *
 * Hash excludes:
 * - Images (changing images doesn't affect workout structure)
 * - OrderKeys (internal implementation detail)
 *
 * @param rounds - The benchmark rounds to hash
 * @returns A hash string representing the workout structure
 */
export function generateStructureHash(rounds: ReadonlyArray<DbBenchmarkRound>): string {
  // Sort rounds by orderKey to ensure consistent ordering
  const sortedRounds = [...rounds].toSorted((a, b) =>
    a.orderKey.localeCompare(b.orderKey),
  )

  // Build structure for hashing (excludes images and orderKeys)
  const structure: Array<StructureRound> = sortedRounds.map((round) => ({
    exercises: [...round.exercises]
      .toSorted((a, b) => a.orderKey.localeCompare(b.orderKey))
      .map((ex) => ({
        exerciseDefinitionId: ex.exerciseDefinitionId,
        name: ex.name,
        prescribedReps: ex.prescribedReps,
      })),
  }))

  // Generate hash from JSON representation
  return hashString(JSON.stringify(structure))
}
