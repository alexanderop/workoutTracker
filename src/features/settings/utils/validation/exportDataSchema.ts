import { z } from 'zod'

import { dbBenchmarkSchema, MAX_BENCHMARKS } from './benchmarkSchema'
import { dbCustomExerciseSchema } from './exerciseSchema'
import { dbUserSettingSchema } from './settingsSchema'
import { dbWorkoutTemplateSchema } from './templateSchema'
import { dbWeightEntrySchema, MAX_WEIGHT_ENTRIES } from './weightEntrySchema'
import { dbCompletedWorkoutSchema } from './workoutSchema'

/**
 * Maximum array sizes to prevent DoS attacks.
 */
const MAX_SETTINGS = 20 // 8 known settings + buffer
const MAX_EXERCISES = 500 // Reasonable exercise library
const MAX_TEMPLATES = 100 // Generous template collection
const MAX_WORKOUTS = 5000 // ~2.7 years of daily workouts

/**
 * ExportData schema with size limits.
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
        customExercises: z.array(dbCustomExerciseSchema).max(MAX_EXERCISES).readonly(),
        templates: z.array(dbWorkoutTemplateSchema).max(MAX_TEMPLATES).readonly(),
        workouts: z.array(dbCompletedWorkoutSchema).max(MAX_WORKOUTS).readonly(),
        benchmarks: z.array(dbBenchmarkSchema).max(MAX_BENCHMARKS).readonly(),
        weightEntries: z.array(dbWeightEntrySchema).max(MAX_WEIGHT_ENTRIES).readonly().optional(),
      })
      .strict(),
  })
  .strict()

