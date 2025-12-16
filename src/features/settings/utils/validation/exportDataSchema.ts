import { z } from 'zod'

import { dbCustomExerciseSchema } from './exerciseSchema'
import { dbUserSettingSchema } from './settingsSchema'

/**
 * Maximum array sizes to prevent DoS attacks.
 */
const MAX_SETTINGS = 20 // 8 known settings + buffer
const MAX_EXERCISES = 500 // Reasonable exercise library
const MAX_TEMPLATES = 100 // Generous template collection
const MAX_WORKOUTS = 5000 // ~2.7 years of daily workouts
const MAX_BENCHMARKS = 200 // Generous benchmark collection
const MAX_ATTEMPTS = 10000 // Many attempts over time

/**
 * Normalized template structure for export/import.
 */
const normalizedTemplateSchema = z.object({
  header: z.object({
    id: z.string(),
    name: z.string(),
    createdAt: z.number(),
    lastUsedAt: z.number().nullable(),
    usageCount: z.number(),
    tags: z.array(z.string()),
  }).passthrough(),
  blocks: z.array(z.object({}).passthrough()),
  blockExercises: z.array(z.object({}).passthrough()),
}).strict()

/**
 * Normalized workout structure for export/import.
 */
const normalizedWorkoutSchema = z.object({
  header: z.object({
    id: z.string(),
    name: z.string(),
    startedAt: z.number(),
    completedAt: z.number(),
    durationSeconds: z.number(),
  }).passthrough(),
  blocks: z.array(z.object({}).passthrough()),
  sets: z.array(z.object({}).passthrough()),
  blockExercises: z.array(z.object({}).passthrough()),
}).strict()

/**
 * Benchmark exercise schema for export/import.
 */
const dbBenchmarkExerciseSchema = z.object({
  exerciseDefinitionId: z.string().nullable(),
  name: z.string(),
  prescribedReps: z.number(),
  thumbnail: z.string(),
}).strict()

/**
 * Benchmark schema for export/import.
 */
const dbBenchmarkSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['fortime', 'rounds']),
  rounds: z.number(),
  timeCapSeconds: z.number().nullable(),
  exercises: z.array(dbBenchmarkExerciseSchema).readonly(),
  createdAt: z.number(),
  lastUsedAt: z.number().nullable(),
}).strict()

/**
 * Benchmark attempt schema for export/import.
 */
const dbBenchmarkAttemptSchema = z.object({
  id: z.string(),
  benchmarkId: z.string(),
  workoutId: z.string(),
  completionTimeSeconds: z.number(),
  completedAt: z.number(),
}).strict()

/**
 * Benchmark personal best schema for export/import.
 */
const dbBenchmarkPersonalBestSchema = z.object({
  benchmarkId: z.string(),
  completionTimeSeconds: z.number(),
  workoutId: z.string(),
  achievedAt: z.number(),
}).strict()

/**
 * Exercise schema with isBuiltIn field for new normalized format.
 */
const dbExerciseSchema = dbCustomExerciseSchema.extend({
  isBuiltIn: z.boolean().optional(),
}).strict()

/**
 * ExportData schema with size limits for v2 normalized format.
 * Uses .strict() to reject unknown properties and prevent prototype pollution.
 * Uses .readonly() on arrays to match ExportData's ReadonlyArray types.
 */
export const exportDataSchema = z
  .object({
    version: z.number().int().min(1).max(100),
    exportedAt: z.string().datetime(),
    data: z
      .object({
        settings: z.array(dbUserSettingSchema).max(MAX_SETTINGS).readonly(),
        customExercises: z.array(dbExerciseSchema).max(MAX_EXERCISES).readonly(),
        templates: z.array(normalizedTemplateSchema).max(MAX_TEMPLATES).readonly(),
        workouts: z.array(normalizedWorkoutSchema).max(MAX_WORKOUTS).readonly(),
        benchmarks: z.array(dbBenchmarkSchema).max(MAX_BENCHMARKS).readonly().optional(),
        benchmarkAttempts: z.array(dbBenchmarkAttemptSchema).max(MAX_ATTEMPTS).readonly().optional(),
        benchmarkPersonalBests: z.array(dbBenchmarkPersonalBestSchema).max(MAX_BENCHMARKS).readonly().optional(),
      })
      .strict(),
  })
  .strict()

/**
 * Inferred type from the Zod schema for validated export data.
 */
export type ValidatedExportData = z.infer<typeof exportDataSchema>
