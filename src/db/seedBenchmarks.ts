import { getBenchmarksRepository as getBenchmarksRepo } from './index'
import { freeleticsBenchmarks } from '@/data/freeleticsBenchmarks'
import type { FreeleticsBenchmark } from '@/data/freeleticsBenchmarks'
import type { DbBenchmarkRound } from './schema'
import { generateNKeysBetween } from '@/lib/fractionalIndexing'

const SEED_VERSION_KEY = 'benchmarks_seed_version'

/** Bump when a new batch of benchmarks is added to the catalog. */
const CURRENT_SEED_VERSION = 1

function toDatabaseRounds(benchmark: FreeleticsBenchmark): Array<DbBenchmarkRound> {
  const roundKeys = generateNKeysBetween(null, null, benchmark.rounds.length)

  return benchmark.rounds.map((exercises, roundIndex) => {
    const exerciseKeys = generateNKeysBetween(null, null, exercises.length)

    return {
      orderKey: roundKeys[roundIndex]!,
      exercises: exercises.map((exercise, exerciseIndex) => ({
        orderKey: exerciseKeys[exerciseIndex]!,
        exerciseDefinitionId: null,
        name: exercise.name,
        prescribedReps: exercise.reps,
        image: null,
      })),
    }
  })
}

/**
 * Seed popular Freeletics benchmark workouts to IndexedDB.
 *
 * Databases that already contain benchmarks (user-created or from an older
 * catalog version) are topped up exactly once per version bump, skipping names
 * the user already has, so user deletions are not resurrected on later app
 * starts (tracked via SEED_VERSION_KEY). An empty benchmarks table is always
 * re-seeded since browsers may clear IndexedDB while keeping localStorage.
 */
export async function seedFreeleticsBenchmarks(): Promise<void> {
  const repo = getBenchmarksRepo()
  const existing = await repo.getAll()
  const seededVersion = Number(localStorage.getItem(SEED_VERSION_KEY)) || 0

  if (existing.length > 0 && seededVersion >= CURRENT_SEED_VERSION) return

  const existingNames = new Set(existing.map((benchmark) => benchmark.name.toLowerCase()))
  const missingBenchmarks = freeleticsBenchmarks.filter(
    (benchmark) => !existingNames.has(benchmark.name.toLowerCase()),
  )

  await Promise.all(
    missingBenchmarks.map((benchmark) =>
      repo.create({
        name: benchmark.name,
        type: 'fortime',
        rounds: toDatabaseRounds(benchmark),
      }),
    ),
  )
  localStorage.setItem(SEED_VERSION_KEY, String(CURRENT_SEED_VERSION))
}
