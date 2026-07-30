import { z } from 'zod'

import { safeIdSchema, timestampSchema } from './primitiveSchemas'

/**
 * Schema for DbWeightEntry validation during import.
 * Matches src/db/schema.ts DbWeightEntry type.
 */
export const dbWeightEntrySchema = z
  .object({
    id: safeIdSchema,
    weight: z.number().positive().max(1000), // Max 1000kg
    date: timestampSchema, // Start of day timestamp
    recordedAt: timestampSchema, // When entry was logged
    bodyFatPct: z.number().min(0).max(100).optional(),
  })
  .strict()

/**
 * Maximum number of weight entries to prevent DoS.
 * ~10 years of daily entries.
 */
export const MAX_WEIGHT_ENTRIES = 3650
