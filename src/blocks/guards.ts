/**
 * Runtime type guards for the block unions.
 */

import { z } from 'zod'
import type { CardioBlock } from './cardio/types'
import type { StrengthBlock } from './strength/types'
import type { TimedBlock, TimedBlockResult, WorkoutBlock } from './types'

const AmrapResultSchema = z.object({
  rounds: z.number(),
  partialReps: z.number(),
  actualDuration: z.number(),
})

const EmomResultSchema = z.object({
  completedMinutes: z.number(),
  missedMinutes: z.array(z.number()),
})

const TabataResultSchema = z.object({
  repsPerRound: z.array(z.number()),
})

const ForTimeResultSchema = z.object({
  completionTime: z.number(),
  completed: z.boolean(),
  splitTimes: z.array(z.number()).optional(),
})

/** @public - Used by isTimedBlockResult() type guard */
export const TimedBlockResultSchema = z.union([
  AmrapResultSchema,
  EmomResultSchema,
  TabataResultSchema,
  ForTimeResultSchema,
])

export function isStrengthBlock(block: WorkoutBlock): block is StrengthBlock {
  return block.kind === 'strength'
}

export function isTimedBlock(block: WorkoutBlock): block is TimedBlock {
  return block.kind !== 'strength' && block.kind !== 'cardio'
}

export function isCardioBlock(block: WorkoutBlock): block is CardioBlock {
  return block.kind === 'cardio'
}

/**
 * Type guard using Zod for runtime validation of timed block results.
 * Provides both runtime safety and TypeScript type narrowing.
 */
export function isTimedBlockResult(value: unknown): value is TimedBlockResult {
  return TimedBlockResultSchema.safeParse(value).success
}
