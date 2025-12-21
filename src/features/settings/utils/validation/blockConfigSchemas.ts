import { z } from 'zod'

import { exerciseRotationSchema, safeIdSchema, safeStringSchema } from './primitiveSchemas'

// ============================================
// Shared Block Exercise Fields
// ============================================
// Base fields shared between DbBlockExercise and DbTemplateBlockExercise.
// DbBlockExercise adds `id`, DbTemplateBlockExercise adds `exerciseDefinitionId`.

export const blockExerciseFieldsBase = {
  name: safeStringSchema.min(1).max(200),
  prescribedReps: z.number().int().min(0).max(1000),
  load: z.string().max(50).nullable(),
  image: z.null(), // Blob can't be serialized to JSON, so always null in exports
}

// ============================================
// Shared Strength Block Fields
// ============================================
// Base fields shared between DbStrengthBlock and DbTemplateStrengthBlock.
// DbStrengthBlock adds `id`, `sets`, `orderIndex`.
// DbTemplateStrengthBlock adds `defaultSetCount`.

export const strengthBlockFieldsBase = {
  exerciseDefinitionId: safeIdSchema.nullable(),
  name: safeStringSchema.min(1).max(200),
  equipment: z.string().max(100),
  targetReps: z.number().int().min(1).max(1000),
  image: z.null(), // Blob can't be serialized to JSON, so always null in exports
}

// ============================================
// Shared Block Config Schemas
// ============================================
// These config schemas are identical for both workout blocks and template blocks.

export const dbEmomConfigSchema = z
  .object({
    minutes: z.number().int().min(1).max(120),
    exerciseRotation: exerciseRotationSchema,
  })
  .strict()

export const dbAmrapConfigSchema = z
  .object({
    durationSeconds: z.number().int().min(1).max(7200), // max 2 hours
  })
  .strict()

export const dbTabataConfigSchema = z
  .object({
    rounds: z.number().int().min(1).max(100),
    workSeconds: z.number().int().min(1).max(600),
    restSeconds: z.number().int().min(0).max(600),
  })
  .strict()

export const dbForTimeConfigSchema = z
  .object({
    timeCapSeconds: z.number().int().min(1).max(7200).nullable(),
  })
  .strict()
