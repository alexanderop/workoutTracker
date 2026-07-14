/**
 * Validation primitives used by the Block Codec schemas.
 *
 * Feature-level schemas (exercise, benchmark, weight, ...) re-use these via
 * `src/features/settings/utils/validation/primitiveSchemas.ts`.
 */

import { z } from 'zod'
import { EQUIPMENT_VALUES } from '@/types/exercises'

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

/**
 * Equipment types. Consumes the runtime value tuple the domain union type in
 * `@/types/exercises` is itself derived from, so they cannot drift.
 */
export const equipmentSchema = z.enum(EQUIPMENT_VALUES)

/**
 * Positive integer timestamp validator.
 */
export const timestampSchema = z.number().int().min(0)
