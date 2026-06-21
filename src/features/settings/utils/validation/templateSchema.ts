import { z } from 'zod'

import {
  blockExerciseFieldsBase,
  dbAmrapConfigSchema as databaseAmrapConfigSchema,
  dbCardioConfigSchema as databaseCardioConfigSchema,
  dbEmomConfigSchema as databaseEmomConfigSchema,
  dbForTimeConfigSchema as databaseForTimeConfigSchema,
  dbTabataConfigSchema as databaseTabataConfigSchema,
  strengthBlockFieldsBase,
} from './blockConfigSchemas'
import { safeIdSchema, safeStringSchema, timestampSchema } from './primitiveSchemas'

// ============================================
// Template Block Exercise Schema
// ============================================

/**
 * DbTemplateBlockExercise schema matching src/db/schema.ts DbTemplateBlockExercise type.
 */
const databaseTemplateBlockExerciseSchema = z
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
const databaseTemplateStrengthBlockSchema = z
  .object({
    kind: z.literal('strength'),
    ...strengthBlockFieldsBase,
    defaultSetCount: z.number().int().min(1).max(20),
  })
  .strict()

/**
 * DbTemplateEmomBlock schema matching src/db/schema.ts DbTemplateEmomBlock type.
 */
const databaseTemplateEmomBlockSchema = z
  .object({
    kind: z.literal('emom'),
    config: databaseEmomConfigSchema,
    exercises: z.array(databaseTemplateBlockExerciseSchema).max(20),
  })
  .strict()

/**
 * DbTemplateAmrapBlock schema matching src/db/schema.ts DbTemplateAmrapBlock type.
 */
const databaseTemplateAmrapBlockSchema = z
  .object({
    kind: z.literal('amrap'),
    config: databaseAmrapConfigSchema,
    exercises: z.array(databaseTemplateBlockExerciseSchema).max(20),
  })
  .strict()

/**
 * DbTemplateTabataBlock schema matching src/db/schema.ts DbTemplateTabataBlock type.
 */
const databaseTemplateTabataBlockSchema = z
  .object({
    kind: z.literal('tabata'),
    config: databaseTabataConfigSchema,
    exercise: databaseTemplateBlockExerciseSchema,
  })
  .strict()

/**
 * DbTemplateForTimeBlock schema matching src/db/schema.ts DbTemplateForTimeBlock type.
 */
const databaseTemplateForTimeBlockSchema = z
  .object({
    kind: z.literal('fortime'),
    config: databaseForTimeConfigSchema,
    exercises: z.array(databaseTemplateBlockExerciseSchema).max(20),
  })
  .strict()

/**
 * DbTemplateCardioBlock schema matching src/db/schema.ts DatabaseTemplateCardioBlock type.
 */
const databaseTemplateCardioBlockSchema = z
  .object({
    kind: z.literal('cardio'),
    config: databaseCardioConfigSchema,
  })
  .strict()

/**
 * DbTemplateBlock discriminated union schema.
 * Matches src/db/schema.ts DbTemplateBlock type.
 */
const databaseTemplateBlockSchema = z.discriminatedUnion('kind', [
  databaseTemplateStrengthBlockSchema,
  databaseTemplateEmomBlockSchema,
  databaseTemplateAmrapBlockSchema,
  databaseTemplateTabataBlockSchema,
  databaseTemplateForTimeBlockSchema,
  databaseTemplateCardioBlockSchema,
])

/**
 * DbWorkoutTemplate schema matching src/db/schema.ts DbWorkoutTemplate type.
 */
export const dbWorkoutTemplateSchema = z
  .object({
    id: safeIdSchema,
    name: safeStringSchema.min(1).max(200),
    blocks: z.array(databaseTemplateBlockSchema).max(50),
    createdAt: timestampSchema,
    lastUsedAt: timestampSchema.nullable(),
    tags: z.array(z.string().max(50)).max(20),
  })
  .strict()
