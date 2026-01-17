import { getBenchmarksRepository } from './index'
import { popularBenchmarks } from '@/data/popularBenchmarks'
import { generateNKeysBetween, generateKeyBetween } from '@/lib/fractionalIndexing'

/**
 * Seed popular benchmark workouts to IndexedDB if not already seeded.
 * Idempotent: skips if any benchmarks already exist.
 */
export async function seedPopularBenchmarks(): Promise<void> {
  const repo = getBenchmarksRepository()
  const existing = await repo.getAll()

  // Idempotent: skip if benchmarks already exist
  if (existing.length > 0) {
    return
  }

  // Create all benchmarks with proper orderKeys
  await Promise.all(
    popularBenchmarks.map((benchmark) => {
      // Generate orderKeys for all rounds
      const roundKeys = generateNKeysBetween(null, null, benchmark.rounds.length)

      return repo.create({
        name: benchmark.name,
        type: benchmark.type,
        rounds: benchmark.rounds.map((round, roundIndex) => {
          // Generate orderKeys for exercises within this round
          const exerciseKeys = generateNKeysBetween(null, null, round.exercises.length)

          return {
            orderKey: roundKeys[roundIndex]!,
            exercises: round.exercises.map((exercise, exerciseIndex) => ({
              orderKey: exerciseKeys[exerciseIndex] ?? generateKeyBetween(null, null),
              exerciseDefinitionId: exercise.exerciseDefinitionId,
              name: exercise.name,
              prescribedReps: exercise.prescribedReps,
              image: exercise.image,
            })),
          }
        }),
      })
    }),
  )
}
