import { z } from 'zod'

import {
  movementPatternSchema,
  patternColorSchema,
  safeIdSchema,
  safeStringSchema,
  timestampSchema,
} from './primitiveSchemas'

/**
 * Benchmark types matching src/types/benchmark.ts
 */
const benchmarkTypeSchema = z.enum(['fortime', 'rounds'])

/**
 * Benchmark exercise schema matching DbBenchmarkExercise
 */
const dbBenchmarkExerciseSchema = z
  .object({
    exerciseDefinitionId: z.string().nullable(),
    name: safeStringSchema.min(1).max(200),
    prescribedReps: z.number().int().min(0).max(10000),
    thumbnail: z.string().min(1).max(10),
    pattern: movementPatternSchema.nullable(),
    color: patternColorSchema.nullable(),
  })
  .strict()

/**
 * Maximum exercises per benchmark (reasonable limit)
 */
const MAX_BENCHMARK_EXERCISES = 20

/**
 * Maximum benchmarks to import
 */
export const MAX_BENCHMARKS = 100

/**
 * Benchmark schema matching DbBenchmark from src/db/schema.ts
 * Uses .strict() to reject unknown properties.
 */
export const dbBenchmarkSchema = z
  .object({
    id: safeIdSchema,
    name: safeStringSchema.min(1).max(200),
    type: benchmarkTypeSchema,
    rounds: z.number().int().min(1).max(100),
    exercises: z.array(dbBenchmarkExerciseSchema).max(MAX_BENCHMARK_EXERCISES).readonly(),
    createdAt: timestampSchema,
    lastUsedAt: timestampSchema.nullable(),
  })
  .strict()
