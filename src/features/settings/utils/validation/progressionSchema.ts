import { z } from 'zod'

import { safeIdSchema, safeStringSchema, timestampSchema } from './primitiveSchemas'

/**
 * Schema for DbProgression validation during import.
 * Matches src/db/schema.ts DbProgression type.
 */
export const dbProgressionSchema = z
  .object({
    id: safeIdSchema,
    name: safeStringSchema,
    availableWeights: z.array(z.number().nonnegative().max(1000)).max(50).readonly(),
    currentWeightIndex: z.number().int().nonnegative().max(50),
    currentReps: z.number().int().nonnegative().max(1000),
    currentMinutes: z.number().int().nonnegative().max(1000),
    startReps: z.number().int().nonnegative().max(1000),
    maxReps: z.number().int().nonnegative().max(1000),
    repIncrement: z.number().int().nonnegative().max(1000),
    startMinutes: z.number().int().nonnegative().max(1000),
    maxMinutes: z.number().int().nonnegative().max(1000),
    minuteIncrement: z.number().int().nonnegative().max(1000),
    sessionsCompleted: z.number().int().nonnegative().max(100_000),
    isComplete: z.boolean(),
    createdAt: timestampSchema,
    lastSessionAt: timestampSchema.nullable(),
  })
  .strict()

/**
 * Schema for DbProgressionSession validation during import.
 * Matches src/db/schema.ts DbProgressionSession type.
 */
export const dbProgressionSessionSchema = z
  .object({
    id: safeIdSchema,
    progressionId: safeIdSchema,
    weight: z.number().nonnegative().max(1000),
    reps: z.number().int().nonnegative().max(1000),
    minutes: z.number().int().nonnegative().max(1000),
    completed: z.boolean(),
    completedAt: timestampSchema,
  })
  .strict()

/**
 * Maximum number of progression plans to prevent DoS.
 */
export const MAX_PROGRESSIONS = 200

/**
 * Maximum number of progression sessions to prevent DoS.
 * ~10 years of daily sessions.
 */
export const MAX_PROGRESSION_SESSIONS = 3650
