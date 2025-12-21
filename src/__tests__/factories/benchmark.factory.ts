import type { DbBenchmark, DbBenchmarkExercise } from '@/db/schema'
import { generateId } from '@/db'

const BENCHMARK_DEFAULTS: Readonly<Omit<DbBenchmark, 'id' | 'exercises'>> = {
  name: 'Fran',
  type: 'fortime',
  rounds: 1,
  createdAt: Date.now(),
  lastUsedAt: null,
}

export function createDbBenchmarkExercise(
  overrides: Partial<DbBenchmarkExercise> = {},
): DbBenchmarkExercise {
  return {
    exerciseDefinitionId: null,
    name: 'Thrusters',
    prescribedReps: 21,
    image: null,
    ...overrides,
  }
}

export function createDbBenchmark(
  overrides: Partial<DbBenchmark> = {},
): DbBenchmark {
  return {
    id: generateId(),
    ...BENCHMARK_DEFAULTS,
    exercises: [createDbBenchmarkExercise()],
    ...overrides,
  }
}

export function createDbForTimeBenchmark(
  overrides: Partial<DbBenchmark> = {},
): DbBenchmark {
  return createDbBenchmark({
    type: 'fortime',
    exercises: [
      createDbBenchmarkExercise({ name: 'Thrusters', prescribedReps: 21 }),
      createDbBenchmarkExercise({ name: 'Pull-ups', prescribedReps: 21 }),
    ],
    ...overrides,
  })
}

export function createDbRoundsBenchmark(
  overrides: Partial<DbBenchmark> = {},
): DbBenchmark {
  return createDbBenchmark({
    type: 'rounds',
    rounds: 3,
    ...overrides,
  })
}
