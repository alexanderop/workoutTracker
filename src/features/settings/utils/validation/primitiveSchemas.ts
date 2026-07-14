import { z } from 'zod'

import { EXERCISE_TYPE_VALUES, METRICS_VALUES, MUSCLE_VALUES } from '@/types/exercises'

// Generic validation primitives live with the Block Codecs (ADR 002) so the
// per-kind schemas in src/blocks can use them without reaching into features;
// re-exported here for the feature-level schemas.
export { equipmentSchema, safeIdSchema, safeStringSchema, timestampSchema } from '@/blocks'

// The enums below consume the runtime value tuples that the domain union
// types in `@/types/exercises` are themselves derived from, so they cannot
// drift (the incident this guards against: the seeded exercise library used
// `type: 'isometric'` and `equipment: 'battle-rope'`, which weren't in these
// enums, so the app's own export failed its own import validation).

/**
 * Muscle groups (derived from src/types/exercises.ts).
 */
export const muscleSchema = z.enum(MUSCLE_VALUES)

/**
 * Exercise types (derived from src/types/exercises.ts).
 */
export const exerciseTypeSchema = z.enum(EXERCISE_TYPE_VALUES)

/**
 * Exercise metrics (derived from src/types/exercises.ts).
 */
export const metricsSchema = z.enum(METRICS_VALUES)
