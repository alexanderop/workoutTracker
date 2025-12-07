import { z } from 'zod'

import {
  exerciseRotationSchema,
  safeIdSchema,
  safeStringSchema,
  timestampSchema,
} from './primitiveSchemas'

// ============================================
// Template Block Exercise Schema
// ============================================

/**
 * DbTemplateBlockExercise schema matching src/db/schema.ts DbTemplateBlockExercise type.
 */
const dbTemplateBlockExerciseSchema = z
  .object({
    exerciseDefinitionId: safeIdSchema.nullable(),
    name: safeStringSchema.min(1).max(200),
    prescribedReps: z.number().int().min(0).max(1000),
    load: z.string().max(50).nullable(),
    thumbnail: z.string().max(50),
  })
  .strict()

// ============================================
// Template Block Config Schemas
// ============================================

const dbTemplateEmomConfigSchema = z
  .object({
    minutes: z.number().int().min(1).max(120),
    exerciseRotation: exerciseRotationSchema,
  })
  .strict()

const dbTemplateAmrapConfigSchema = z
  .object({
    durationSeconds: z.number().int().min(1).max(7200),
  })
  .strict()

const dbTemplateTabataConfigSchema = z
  .object({
    rounds: z.number().int().min(1).max(100),
    workSeconds: z.number().int().min(1).max(600),
    restSeconds: z.number().int().min(0).max(600),
  })
  .strict()

const dbTemplateForTimeConfigSchema = z
  .object({
    timeCapSeconds: z.number().int().min(1).max(7200).nullable(),
  })
  .strict()

// ============================================
// Template Block Schemas (Discriminated Union)
// ============================================

/**
 * DbTemplateStrengthBlock schema matching src/db/schema.ts DbTemplateStrengthBlock type.
 */
const dbTemplateStrengthBlockSchema = z
  .object({
    kind: z.literal('strength'),
    exerciseDefinitionId: safeIdSchema.nullable(),
    name: safeStringSchema.min(1).max(200),
    equipment: z.string().max(100),
    targetReps: z.number().int().min(1).max(1000),
    thumbnail: z.string().max(50),
    defaultSetCount: z.number().int().min(1).max(20),
  })
  .strict()

/**
 * DbTemplateEmomBlock schema matching src/db/schema.ts DbTemplateEmomBlock type.
 */
const dbTemplateEmomBlockSchema = z
  .object({
    kind: z.literal('emom'),
    config: dbTemplateEmomConfigSchema,
    exercises: z.array(dbTemplateBlockExerciseSchema).max(20),
  })
  .strict()

/**
 * DbTemplateAmrapBlock schema matching src/db/schema.ts DbTemplateAmrapBlock type.
 */
const dbTemplateAmrapBlockSchema = z
  .object({
    kind: z.literal('amrap'),
    config: dbTemplateAmrapConfigSchema,
    exercises: z.array(dbTemplateBlockExerciseSchema).max(20),
  })
  .strict()

/**
 * DbTemplateTabataBlock schema matching src/db/schema.ts DbTemplateTabataBlock type.
 */
const dbTemplateTabataBlockSchema = z
  .object({
    kind: z.literal('tabata'),
    config: dbTemplateTabataConfigSchema,
    exercise: dbTemplateBlockExerciseSchema,
  })
  .strict()

/**
 * DbTemplateForTimeBlock schema matching src/db/schema.ts DbTemplateForTimeBlock type.
 */
const dbTemplateForTimeBlockSchema = z
  .object({
    kind: z.literal('fortime'),
    config: dbTemplateForTimeConfigSchema,
    exercises: z.array(dbTemplateBlockExerciseSchema).max(20),
  })
  .strict()

/**
 * DbTemplateBlock discriminated union schema.
 * Matches src/db/schema.ts DbTemplateBlock type.
 */
const dbTemplateBlockSchema = z.discriminatedUnion('kind', [
  dbTemplateStrengthBlockSchema,
  dbTemplateEmomBlockSchema,
  dbTemplateAmrapBlockSchema,
  dbTemplateTabataBlockSchema,
  dbTemplateForTimeBlockSchema,
])

/**
 * DbWorkoutTemplate schema matching src/db/schema.ts DbWorkoutTemplate type.
 */
export const dbWorkoutTemplateSchema = z
  .object({
    id: safeIdSchema,
    name: safeStringSchema.min(1).max(200),
    blocks: z.array(dbTemplateBlockSchema).max(50),
    createdAt: timestampSchema,
    lastUsedAt: timestampSchema.nullable(),
    tags: z.array(z.string().max(50)).max(20),
  })
  .strict()
