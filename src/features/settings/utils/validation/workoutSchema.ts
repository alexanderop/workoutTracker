import { z } from 'zod'

import { dbWorkoutBlockSchema as databaseWorkoutBlockSchema } from '@/blocks'
import { safeIdSchema, safeStringSchema, timestampSchema } from './primitiveSchemas'

/**
 * DbCompletedWorkout schema matching src/db/schema.ts DbCompletedWorkout type.
 */
export const dbCompletedWorkoutSchema = z
  .object({
    id: safeIdSchema,
    name: safeStringSchema.min(1).max(200),
    blocks: z.array(databaseWorkoutBlockSchema).max(50),
    startedAt: timestampSchema,
    completedAt: timestampSchema,
    durationSeconds: z.number().int().min(0).max(86_400), // max 24 hours
    notes: z.string().max(10_000),
    benchmarkId: z.string().nullable(),
  })
  .strict()
