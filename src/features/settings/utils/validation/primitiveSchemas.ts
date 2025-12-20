import { z } from 'zod'

/**
 * Reserved keywords that could enable prototype pollution attacks.
 */
const RESERVED_KEYWORDS = ['__proto__', 'constructor', 'prototype']

/**
 * Safe ID validator that rejects prototype pollution attack vectors.
 */
export const safeIdSchema = z
  .string()
  .min(1)
  .max(100)
  .refine((val) => !RESERVED_KEYWORDS.includes(val), {
    message: 'Invalid ID: reserved keyword',
  })

/**
 * Safe string validator with reasonable length limit.
 */
export const safeStringSchema = z.string().max(1000)

/**
 * Equipment types matching src/types/exercises.ts
 */
export const equipmentSchema = z.enum([
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
  'band',
  'ez-bar',
  'hex-bar',
  'club',
])

/**
 * Muscle groups matching src/types/exercises.ts
 */
export const muscleSchema = z.enum(['chest', 'back', 'legs', 'shoulders', 'arms', 'core'])

/**
 * Exercise types matching src/types/exercises.ts
 */
export const exerciseTypeSchema = z.enum(['compound', 'isolation', 'stability', 'cardio'])

/**
 * Exercise metrics matching src/types/exercises.ts
 */
export const metricsSchema = z.enum([
  'weight-reps',
  'reps-only',
  'duration',
  'distance-duration',
  'weight-distance',
])

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

/**
 * Movement patterns matching src/types/exercises.ts
 */
export const movementPatternSchema = z.enum([
  'push-horizontal',
  'push-vertical',
  'pull-horizontal',
  'pull-vertical',
  'squat',
  'hinge',
  'carry',
  'rotation',
  'stability',
  'isolation',
])

/**
 * Pattern colors matching src/types/exercises.ts
 */
export const patternColorSchema = z.enum([
  'red',
  'orange',
  'amber',
  'green',
  'emerald',
  'cyan',
  'blue',
  'indigo',
  'purple',
  'pink',
  'rose',
  'slate',
])
