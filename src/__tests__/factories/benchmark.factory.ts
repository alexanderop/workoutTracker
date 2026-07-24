import type { DbBenchmark, DbBenchmarkRound, DbBenchmarkRoundExercise } from '@/db/schema'
import { generateId } from '@/db'
import {
  generateKeyBetween,
  generateNKeysBetween,
} from '@/features/benchmarks/lib/fractionalIndexing'
import { generateStructureHash } from '@/lib/structureHash'

/**
 * Creates a single exercise for use within a benchmark round.
 */
export function createDbBenchmarkRoundExercise(
  overrides: Partial<DbBenchmarkRoundExercise> = {},
): DbBenchmarkRoundExercise {
  return {
    orderKey: overrides.orderKey ?? generateKeyBetween(null, null),
    exerciseDefinitionId: null,
    name: 'Burpees',
    prescribedReps: 10,
    image: null,
    ...overrides,
  }
}

/**
 * Creates a single round with exercises.
 */
export function createDbBenchmarkRound(
  overrides: Partial<DbBenchmarkRound> = {},
): DbBenchmarkRound {
  return {
    orderKey: overrides.orderKey ?? generateKeyBetween(null, null),
    exercises: overrides.exercises ?? [createDbBenchmarkRoundExercise()],
  }
}

/**
 * Creates a benchmark with the rounds-based schema.
 */
export function createDbBenchmark(overrides: Partial<DbBenchmark> = {}): DbBenchmark {
  const rounds = overrides.rounds ?? [createDbBenchmarkRound()]
  return {
    id: generateId(),
    name: 'Fran',
    type: 'fortime',
    rounds,
    structureHash: overrides.structureHash ?? generateStructureHash(rounds),
    createdAt: Date.now(),
    lastUsedAt: null,
    ...overrides,
  }
}

/**
 * Creates a ForTime benchmark with standard exercises.
 */
export function createDbForTimeBenchmark(overrides: Partial<DbBenchmark> = {}): DbBenchmark {
  const exerciseKeys = generateNKeysBetween(null, null, 2)
  const rounds = overrides.rounds ?? [
    createDbBenchmarkRound({
      exercises: [
        createDbBenchmarkRoundExercise({
          orderKey: exerciseKeys[0],
          name: 'Thrusters',
          prescribedReps: 21,
        }),
        createDbBenchmarkRoundExercise({
          orderKey: exerciseKeys[1],
          name: 'Pull-ups',
          prescribedReps: 21,
        }),
      ],
    }),
  ]

  return createDbBenchmark({
    type: 'fortime',
    rounds,
    ...overrides,
  })
}

/**
 * Creates a pyramid-style ForTime benchmark (e.g., 40-30-20-10).
 * Each round has the same exercises but different rep counts.
 */
export function createDbPyramidBenchmark(
  options: {
    name?: string
    exerciseName?: string
    repPattern?: ReadonlyArray<number>
  } = {},
): DbBenchmark {
  const {
    name = 'Pyramid 40-30-20-10',
    exerciseName = 'Burpees',
    repPattern = [40, 30, 20, 10],
  } = options

  const roundKeys = generateNKeysBetween(null, null, repPattern.length)

  const rounds = repPattern.map((reps, index) =>
    createDbBenchmarkRound({
      orderKey: roundKeys[index],
      exercises: [
        createDbBenchmarkRoundExercise({
          orderKey: generateKeyBetween(null, null),
          name: exerciseName,
          prescribedReps: reps,
        }),
      ],
    }),
  )

  return createDbBenchmark({
    name,
    type: 'fortime',
    rounds,
  })
}

// Re-export types for convenience
export type { DbBenchmarkRound, DbBenchmarkRoundExercise } from '@/db/schema'
