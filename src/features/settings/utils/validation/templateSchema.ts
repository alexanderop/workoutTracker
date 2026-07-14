import { z } from 'zod'

import { dbTemplateBlockSchema } from '@/blocks'
import { safeIdSchema, safeStringSchema, timestampSchema } from './primitiveSchemas'

// Per-kind template block schemas live in the Block Codecs and are composed
// into dbTemplateBlockSchema by the registry (ADR 002 stage 5); this module
// owns only the workout-level template shape.

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
