import { z } from 'zod'

import { safeIdSchema, safeStringSchema, timestampSchema } from './primitiveSchemas'

/**
 * Benchmark types matching src/types/benchmark.ts
 * Only 'fortime' is supported - type selector removed from UI.
 */
const benchmarkTypeSchema = z.literal('fortime')

/**
 * Benchmark round exercise schema matching DbBenchmarkRoundExercise
 */
const databaseBenchmarkRoundExerciseSchema = z
  .object({
    orderKey: safeStringSchema.min(1).max(50),
    exerciseDefinitionId: z.string().nullable(),
    name: safeStringSchema.min(1).max(200),
    prescribedReps: z.number().int().min(0).max(10_000),
    image: z.null(), // Blob can't be serialized to JSON, so always null in exports
  })
  .strict()

/**
 * Maximum exercises per round (reasonable limit)
 */
const MAX_EXERCISES_PER_ROUND = 20

/**
 * Maximum rounds per benchmark
 */
const MAX_ROUNDS_PER_BENCHMARK = 100

/**
 * Benchmark round schema matching DbBenchmarkRound
 */
const databaseBenchmarkRoundSchema = z
  .object({
    orderKey: safeStringSchema.min(1).max(50),
    exercises: z
      .array(databaseBenchmarkRoundExerciseSchema)
      .max(MAX_EXERCISES_PER_ROUND)
      .readonly(),
  })
  .strict()

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
    rounds: z.array(databaseBenchmarkRoundSchema).max(MAX_ROUNDS_PER_BENCHMARK).readonly(),
    structureHash: safeStringSchema.max(100),
    createdAt: timestampSchema,
    lastUsedAt: timestampSchema.nullable(),
  })
  .strict()
