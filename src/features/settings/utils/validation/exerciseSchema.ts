import { z } from 'zod'

import {
  equipmentSchema,
  exerciseTypeSchema,
  metricsSchema,
  muscleSchema,
  safeIdSchema,
  safeStringSchema,
  timestampSchema,
} from './primitiveSchemas'

/**
 * DbCustomExercise schema.
 * Matches src/db/schema.ts DbCustomExercise type.
 */
export const dbCustomExerciseSchema = z
  .object({
    id: safeIdSchema,
    name: safeStringSchema.min(1).max(200),
    equipment: equipmentSchema.nullable(),
    muscle: muscleSchema.nullable(),
    type: exerciseTypeSchema,
    metrics: metricsSchema,
    createdAt: timestampSchema,
    updatedAt: timestampSchema,
    image: z.null(), // Blob can't be serialized to JSON, so always null in exports
  })
  .strict()
