import { z } from 'zod'
import type { DbBlockExercise, DbTemplateBlockExercise } from './types'
import { safeIdSchema, safeStringSchema } from './schemaPrimitives'
import { schemaFor } from './schemaFor'

// ============================================
// Shared Block Exercise Fields
// ============================================
// Base fields shared between DbBlockExercise and DbTemplateBlockExercise.
// DbBlockExercise adds `id`, DbTemplateBlockExercise adds `exerciseDefinitionId`.

const blockExerciseFieldsBase = {
  name: safeStringSchema.min(1).max(200),
  prescribedReps: z.number().int().min(0).max(1000),
  load: z.string().max(50).nullable(),
  image: z.null(), // Blob can't be serialized to JSON, so always null in exports
}

/**
 * DbBlockExercise schema matching the DbBlockExercise type.
 */
export const dbBlockExerciseSchema = schemaFor<DbBlockExercise>()(
  z
    .object({
      id: safeIdSchema,
      ...blockExerciseFieldsBase,
    })
    .strict(),
)

/**
 * DbTemplateBlockExercise schema matching the DbTemplateBlockExercise type.
 */
export const dbTemplateBlockExerciseSchema = schemaFor<DbTemplateBlockExercise>()(
  z
    .object({
      exerciseDefinitionId: safeIdSchema.nullable(),
      ...blockExerciseFieldsBase,
    })
    .strict(),
)
