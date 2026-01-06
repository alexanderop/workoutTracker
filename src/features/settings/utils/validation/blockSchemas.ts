import { z } from 'zod'

import {
  blockExerciseFieldsBase,
  dbAmrapConfigSchema as databaseAmrapConfigSchema,
  dbEmomConfigSchema as databaseEmomConfigSchema,
  dbForTimeConfigSchema as databaseForTimeConfigSchema,
  dbTabataConfigSchema as databaseTabataConfigSchema,
  strengthBlockFieldsBase,
} from './blockConfigSchemas'
import { safeIdSchema, setStatusSchema, timestampSchema } from './primitiveSchemas'

// ============================================
// DbSet Schema
// ============================================

/**
 * DbSet schema matching src/db/schema.ts DbSet type.
 */
const databaseSetSchema = z
  .object({
    id: safeIdSchema,
    kg: z.string().max(20),
    reps: z.string().max(20),
    duration: z.string().max(20).optional().default(''),
    rir: z.string().max(20),
    status: setStatusSchema,
    completedAt: timestampSchema.nullable(),
  })
  .strict()

// ============================================
// DbBlockExercise Schema (for timed blocks)
// ============================================

/**
 * DbBlockExercise schema matching src/db/schema.ts DbBlockExercise type.
 */
const databaseBlockExerciseSchema = z
  .object({
    id: safeIdSchema,
    ...blockExerciseFieldsBase,
  })
  .strict()

// ============================================
// Block Config Schemas (Cardio only - others imported from blockConfigSchemas.ts)
// ============================================

const databaseCardioActivitySchema = z.enum([
  'running',
  'cycling',
  'rowing',
  'elliptical',
  'swimming',
  'stairclimber',
  'walking',
])

const databaseCardioConfigSchema = z
  .object({
    activity: databaseCardioActivitySchema,
    targetDurationSeconds: z.number().int().min(1).max(36_000).nullable(), // max 10 hours
    targetDistanceMeters: z.number().int().min(1).max(1_000_000).nullable(), // max 1000km
  })
  .strict()

// ============================================
// Block Result Schemas
// ============================================

const databaseAmrapResultSchema = z
  .object({
    rounds: z.number().int().min(0),
    partialReps: z.number().int().min(0),
    actualDuration: z.number().int().min(0),
  })
  .strict()

const databaseEmomResultSchema = z
  .object({
    completedMinutes: z.number().int().min(0),
    missedMinutes: z.array(z.number().int().min(0)).max(120),
  })
  .strict()

const databaseTabataResultSchema = z
  .object({
    repsPerRound: z.array(z.number().int().min(0)).max(100),
  })
  .strict()

const databaseForTimeResultSchema = z
  .object({
    completionTime: z.number().int().min(0),
    completed: z.boolean(),
  })
  .strict()

const databaseCardioResultSchema = z
  .object({
    actualDurationSeconds: z.number().int().min(0),
    distanceMeters: z.number().int().min(0).nullable(),
    avgPaceSecondsPerKm: z.number().int().min(0).nullable(),
    calories: z.number().int().min(0).nullable(),
    notes: z.string().max(1000).nullable(),
  })
  .strict()

// ============================================
// Workout Block Schemas (Discriminated Union)
// ============================================

/**
 * DbStrengthBlock schema matching src/db/schema.ts DbStrengthBlock type.
 */
const databaseStrengthBlockSchema = z
  .object({
    kind: z.literal('strength'),
    id: safeIdSchema,
    ...strengthBlockFieldsBase,
    sets: z.array(databaseSetSchema).max(50),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbEmomBlock schema matching src/db/schema.ts DbEmomBlock type.
 */
const databaseEmomBlockSchema = z
  .object({
    kind: z.literal('emom'),
    id: safeIdSchema,
    config: databaseEmomConfigSchema,
    exercises: z.array(databaseBlockExerciseSchema).max(20),
    result: databaseEmomResultSchema.nullable(),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbAmrapBlock schema matching src/db/schema.ts DbAmrapBlock type.
 */
const databaseAmrapBlockSchema = z
  .object({
    kind: z.literal('amrap'),
    id: safeIdSchema,
    config: databaseAmrapConfigSchema,
    exercises: z.array(databaseBlockExerciseSchema).max(20),
    result: databaseAmrapResultSchema.nullable(),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbTabataBlock schema matching src/db/schema.ts DbTabataBlock type.
 */
const databaseTabataBlockSchema = z
  .object({
    kind: z.literal('tabata'),
    id: safeIdSchema,
    config: databaseTabataConfigSchema,
    exercise: databaseBlockExerciseSchema,
    result: databaseTabataResultSchema.nullable(),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbForTimeBlock schema matching src/db/schema.ts DbForTimeBlock type.
 */
const databaseForTimeBlockSchema = z
  .object({
    kind: z.literal('fortime'),
    id: safeIdSchema,
    config: databaseForTimeConfigSchema,
    exercises: z.array(databaseBlockExerciseSchema).max(20),
    result: databaseForTimeResultSchema.nullable(),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbCardioBlock schema matching src/db/schema.ts DbCardioBlock type.
 */
const databaseCardioBlockSchema = z
  .object({
    kind: z.literal('cardio'),
    id: safeIdSchema,
    config: databaseCardioConfigSchema,
    result: databaseCardioResultSchema.nullable(),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbWorkoutBlock discriminated union schema.
 * Matches src/db/schema.ts DbWorkoutBlock type.
 */
export const dbWorkoutBlockSchema = z.discriminatedUnion('kind', [
  databaseStrengthBlockSchema,
  databaseEmomBlockSchema,
  databaseAmrapBlockSchema,
  databaseTabataBlockSchema,
  databaseForTimeBlockSchema,
  databaseCardioBlockSchema,
])
