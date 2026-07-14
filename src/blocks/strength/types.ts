import type { Equipment } from '@/types/exercises'
import type { ParsedSet } from '../shared/markdown'

// ============================================
// Set Types (used by strength blocks)
// ============================================

export type SetStatus = 'completed' | 'active' | 'planned'

export type Set = {
  id: number
  kg: string
  reps: string
  duration: string
  rir: string
  status: SetStatus
}

/**
 * A set within a strength block, database format.
 */
export type DbSet = {
  id: string
  kg: string
  reps: string
  duration: string
  rir: string
  status: SetStatus
  completedAt: number | null
}

// ============================================
// Strength Block
// ============================================

export type StrengthBlock = {
  kind: 'strength'
  id: number
  exerciseDefinitionId: string | null
  name: string
  equipment: Equipment
  targetReps: number
  targetDuration: number | null // seconds for isometric exercises
  targetWeight: number | null // kg for weighted holds (optional)
  sets: Array<Set>
  image: Blob | null
}

export type DbStrengthBlock = {
  kind: 'strength'
  id: string
  exerciseDefinitionId: string | null
  name: string
  equipment: Equipment
  targetReps: number
  targetDuration: number | null
  targetWeight: number | null
  sets: ReadonlyArray<DbSet>
  orderIndex: number
  image: Blob | null
}

/**
 * Template counterpart: no id/sets/orderIndex; `defaultSetCount` seeds the
 * sets when a workout is instantiated from the template.
 */
export type DbTemplateStrengthBlock = {
  kind: 'strength'
  exerciseDefinitionId: string | null
  name: string
  equipment: Equipment
  targetReps: number
  targetDuration: number | null
  targetWeight: number | null
  defaultSetCount: number
  image: Blob | null
}

// ============================================
// Markdown Parsed Intermediate (spec v1)
// ============================================

export type ParsedStrengthBlock = {
  kind: 'strength'
  name: string
  equipment: string
  targetReps: number | null
  sets: ReadonlyArray<ParsedSet>
}
