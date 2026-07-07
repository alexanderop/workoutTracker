import { z } from 'zod'

import {
  EQUIPMENT_VALUES,
  EXERCISE_TYPE_VALUES,
  METRICS_VALUES,
  MUSCLE_VALUES,
} from '@/types/exercises'

/**
 * Reserved keywords that could enable prototype pollution attacks.
 */
const RESERVED_KEYWORDS = new Set(['__proto__', 'constructor', 'prototype'])

/**
 * Safe ID validator that rejects prototype pollution attack vectors.
 */
export const safeIdSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((value) => !RESERVED_KEYWORDS.has(value), {
    message: 'Invalid ID: reserved keyword',
  })

/**
 * Safe string validator with reasonable length limit.
 */
export const safeStringSchema = z.string().max(1000)

// The enums below consume the runtime value tuples that the domain union
// types in `@/types/exercises` are themselves derived from, so they cannot
// drift (the incident this guards against: the seeded exercise library used
// `type: 'isometric'` and `equipment: 'battle-rope'`, which weren't in these
// enums, so the app's own export failed its own import validation).

/**
 * Equipment types (derived from src/types/exercises.ts).
 */
export const equipmentSchema = z.enum(EQUIPMENT_VALUES)

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

/**
 * Set status matching src/types/workout.ts
 */
export const setStatusSchema = z.enum(['completed', 'active', 'planned'])

/**
 * EMOM exercise rotation matching src/db/schema.ts DbEmomConfig
 */
export const exerciseRotationSchema = z.enum(['each-minute', 'full-round'])

/**
 * Positive integer timestamp validator.
 */
export const timestampSchema = z.number().int().min(0)
