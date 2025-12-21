import { z } from 'zod'

import {
  blockExerciseFieldsBase,
  dbAmrapConfigSchema,
  dbEmomConfigSchema,
  dbForTimeConfigSchema,
  dbTabataConfigSchema,
  strengthBlockFieldsBase,
} from './blockConfigSchemas'
import { safeIdSchema, safeStringSchema, timestampSchema } from './primitiveSchemas'

// ============================================
// Template Block Exercise Schema
// ============================================

/**
 * DbTemplateBlockExercise schema matching src/db/schema.ts DbTemplateBlockExercise type.
 */
const dbTemplateBlockExerciseSchema = z
  .object({
    exerciseDefinitionId: safeIdSchema.nullable(),
    ...blockExerciseFieldsBase,
  })
  .strict()

// ============================================
// Template Block Schemas (Discriminated Union)
// ============================================
// Config schemas imported from blockConfigSchemas.ts

/**
 * DbTemplateStrengthBlock schema matching src/db/schema.ts DbTemplateStrengthBlock type.
 */
const dbTemplateStrengthBlockSchema = z
  .object({
    kind: z.literal('strength'),
    ...strengthBlockFieldsBase,
    defaultSetCount: z.number().int().min(1).max(20),
  })
  .strict()

/**
 * DbTemplateEmomBlock schema matching src/db/schema.ts DbTemplateEmomBlock type.
 */
const dbTemplateEmomBlockSchema = z
  .object({
    kind: z.literal('emom'),
    config: dbEmomConfigSchema,
    exercises: z.array(dbTemplateBlockExerciseSchema).max(20),
  })
  .strict()

/**
 * DbTemplateAmrapBlock schema matching src/db/schema.ts DbTemplateAmrapBlock type.
 */
const dbTemplateAmrapBlockSchema = z
  .object({
    kind: z.literal('amrap'),
    config: dbAmrapConfigSchema,
    exercises: z.array(dbTemplateBlockExerciseSchema).max(20),
  })
  .strict()

/**
 * DbTemplateTabataBlock schema matching src/db/schema.ts DbTemplateTabataBlock type.
 */
const dbTemplateTabataBlockSchema = z
  .object({
    kind: z.literal('tabata'),
    config: dbTabataConfigSchema,
    exercise: dbTemplateBlockExerciseSchema,
  })
  .strict()

/**
 * DbTemplateForTimeBlock schema matching src/db/schema.ts DbTemplateForTimeBlock type.
 */
const dbTemplateForTimeBlockSchema = z
  .object({
    kind: z.literal('fortime'),
    config: dbForTimeConfigSchema,
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
