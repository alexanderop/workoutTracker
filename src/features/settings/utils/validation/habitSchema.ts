import { z } from 'zod'

import { safeIdSchema, safeStringSchema, timestampSchema } from './primitiveSchemas'

/**
 * How often a habit is expected to be done.
 * Matches HabitSchedule in src/db/schema.ts.
 */
const habitScheduleSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('daily') }).strict(),
  z
    .object({
      type: z.literal('weekly'),
      targetDaysPerWeek: z.number().int().min(1).max(7),
    })
    .strict(),
])

/**
 * What "done" means for a habit: a simple check-off, or hitting a quantity target.
 * Matches HabitKind in src/db/schema.ts.
 */
const habitKindSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('binary') }).strict(),
  z
    .object({
      type: z.literal('quantity'),
      target: z.number().positive().max(1_000_000),
      unit: safeStringSchema.min(1).max(50),
    })
    .strict(),
])

/**
 * Schema for DbHabit validation during import.
 * Matches src/db/schema.ts DbHabit type.
 *
 * Malformed `schedule`/`kind` unions are rejected outright by
 * `z.discriminatedUnion` -- the same reject-don't-default strategy
 * `dbWorkoutBlockSchema` and `dbUserSettingSchema` use for their own
 * `kind`/`key` unions, rather than silently coercing an unrecognized variant
 * to some default.
 */
export const dbHabitSchema = z
  .object({
    id: safeIdSchema,
    name: safeStringSchema.min(1).max(200),
    icon: safeStringSchema.max(16).nullable(),
    schedule: habitScheduleSchema,
    kind: habitKindSchema,
    autoLink: z.literal('completed-workout').nullable(),
    archivedAt: timestampSchema.nullable(),
    orderIndex: z.number().int().min(0),
    createdAt: timestampSchema,
  })
  .strict()

/**
 * Maximum number of habits to import (DoS guard).
 * Generous ceiling for a habit list -- far beyond what anyone tracks at once.
 */
export const MAX_HABITS = 200

/**
 * Schema for DbHabitEntry validation during import.
 * Matches src/db/schema.ts DbHabitEntry type.
 */
export const dbHabitEntrySchema = z
  .object({
    id: safeIdSchema,
    habitId: safeIdSchema,
    date: timestampSchema, // Start of day timestamp
    value: z.number().min(0).max(1_000_000),
    recordedAt: timestampSchema,
  })
  .strict()

/**
 * Maximum number of habit entries to import (DoS guard).
 * Generous ceiling well beyond realistic usage (a few dozen habits tracked
 * daily for years).
 */
export const MAX_HABIT_ENTRIES = 50_000
