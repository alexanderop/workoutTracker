import { z } from 'zod'

import {
  blockExerciseFieldsBase,
  dbAmrapConfigSchema,
  dbEmomConfigSchema,
  dbForTimeConfigSchema,
  dbTabataConfigSchema,
  strengthBlockFieldsBase,
} from './blockConfigSchemas'
import { safeIdSchema, setStatusSchema, timestampSchema } from './primitiveSchemas'

// ============================================
// DbSet Schema
// ============================================

/**
 * DbSet schema matching src/db/schema.ts DbSet type.
 */
const dbSetSchema = z
  .object({
    id: safeIdSchema,
    kg: z.string().max(20),
    reps: z.string().max(20),
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
const dbBlockExerciseSchema = z
  .object({
    id: safeIdSchema,
    ...blockExerciseFieldsBase,
  })
  .strict()

// ============================================
// Block Config Schemas (Cardio only - others imported from blockConfigSchemas.ts)
// ============================================

const dbCardioActivitySchema = z.enum([
  'running',
  'cycling',
  'rowing',
  'elliptical',
  'swimming',
  'stairclimber',
  'walking',
])

const dbCardioConfigSchema = z
  .object({
    activity: dbCardioActivitySchema,
    targetDurationSeconds: z.number().int().min(1).max(36000).nullable(), // max 10 hours
    targetDistanceMeters: z.number().int().min(1).max(1000000).nullable(), // max 1000km
  })
  .strict()

// ============================================
// Block Result Schemas
// ============================================

const dbAmrapResultSchema = z
  .object({
    rounds: z.number().int().min(0),
    partialReps: z.number().int().min(0),
    actualDuration: z.number().int().min(0),
  })
  .strict()

const dbEmomResultSchema = z
  .object({
    completedMinutes: z.number().int().min(0),
    missedMinutes: z.array(z.number().int().min(0)).max(120),
  })
  .strict()

const dbTabataResultSchema = z
  .object({
    repsPerRound: z.array(z.number().int().min(0)).max(100),
  })
  .strict()

const dbForTimeResultSchema = z
  .object({
    completionTime: z.number().int().min(0),
    completed: z.boolean(),
  })
  .strict()

const dbCardioResultSchema = z
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
const dbStrengthBlockSchema = z
  .object({
    kind: z.literal('strength'),
    id: safeIdSchema,
    ...strengthBlockFieldsBase,
    sets: z.array(dbSetSchema).max(50),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbEmomBlock schema matching src/db/schema.ts DbEmomBlock type.
 */
const dbEmomBlockSchema = z
  .object({
    kind: z.literal('emom'),
    id: safeIdSchema,
    config: dbEmomConfigSchema,
    exercises: z.array(dbBlockExerciseSchema).max(20),
    result: dbEmomResultSchema.nullable(),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbAmrapBlock schema matching src/db/schema.ts DbAmrapBlock type.
 */
const dbAmrapBlockSchema = z
  .object({
    kind: z.literal('amrap'),
    id: safeIdSchema,
    config: dbAmrapConfigSchema,
    exercises: z.array(dbBlockExerciseSchema).max(20),
    result: dbAmrapResultSchema.nullable(),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbTabataBlock schema matching src/db/schema.ts DbTabataBlock type.
 */
const dbTabataBlockSchema = z
  .object({
    kind: z.literal('tabata'),
    id: safeIdSchema,
    config: dbTabataConfigSchema,
    exercise: dbBlockExerciseSchema,
    result: dbTabataResultSchema.nullable(),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbForTimeBlock schema matching src/db/schema.ts DbForTimeBlock type.
 */
const dbForTimeBlockSchema = z
  .object({
    kind: z.literal('fortime'),
    id: safeIdSchema,
    config: dbForTimeConfigSchema,
    exercises: z.array(dbBlockExerciseSchema).max(20),
    result: dbForTimeResultSchema.nullable(),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbCardioBlock schema matching src/db/schema.ts DbCardioBlock type.
 */
const dbCardioBlockSchema = z
  .object({
    kind: z.literal('cardio'),
    id: safeIdSchema,
    config: dbCardioConfigSchema,
    result: dbCardioResultSchema.nullable(),
    orderIndex: z.number().int().min(0),
  })
  .strict()

/**
 * DbWorkoutBlock discriminated union schema.
 * Matches src/db/schema.ts DbWorkoutBlock type.
 */
export const dbWorkoutBlockSchema = z.discriminatedUnion('kind', [
  dbStrengthBlockSchema,
  dbEmomBlockSchema,
  dbAmrapBlockSchema,
  dbTabataBlockSchema,
  dbForTimeBlockSchema,
  dbCardioBlockSchema,
])
