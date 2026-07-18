import { z } from 'zod'

import { dbBenchmarkSchema as databaseBenchmarkSchema, MAX_BENCHMARKS } from './benchmarkSchema'
import { dbCustomExerciseSchema as databaseCustomExerciseSchema } from './exerciseSchema'
import {
  dbHabitEntrySchema as databaseHabitEntrySchema,
  dbHabitSchema as databaseHabitSchema,
  MAX_HABIT_ENTRIES,
  MAX_HABITS,
} from './habitSchema'
import { dbUserSettingSchema as databaseUserSettingSchema } from './settingsSchema'
import { dbWorkoutTemplateSchema as databaseWorkoutTemplateSchema } from './templateSchema'
import {
  dbWeightEntrySchema as databaseWeightEntrySchema,
  MAX_WEIGHT_ENTRIES,
} from './weightEntrySchema'
import { dbCompletedWorkoutSchema as databaseCompletedWorkoutSchema } from './workoutSchema'

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
        settings: z.array(databaseUserSettingSchema).max(MAX_SETTINGS).readonly(),
        customExercises: z.array(databaseCustomExerciseSchema).max(MAX_EXERCISES).readonly(),
        templates: z.array(databaseWorkoutTemplateSchema).max(MAX_TEMPLATES).readonly(),
        workouts: z.array(databaseCompletedWorkoutSchema).max(MAX_WORKOUTS).readonly(),
        benchmarks: z.array(databaseBenchmarkSchema).max(MAX_BENCHMARKS).readonly(),
        weightEntries: z
          .array(databaseWeightEntrySchema)
          .max(MAX_WEIGHT_ENTRIES)
          .readonly()
          .optional(),
        habits: z.array(databaseHabitSchema).max(MAX_HABITS).readonly().optional(),
        habitEntries: z
          .array(databaseHabitEntrySchema)
          .max(MAX_HABIT_ENTRIES)
          .readonly()
          .optional(),
      })
      .strict(),
  })
  .strict()
