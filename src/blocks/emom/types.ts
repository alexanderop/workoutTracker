import type { BlockExercise, DbBlockExercise, DbTemplateBlockExercise } from '../shared/types'
import type { ParsedBlockExercise } from '../shared/markdown'

export type EmomConfig = {
  minutes: number
  exerciseRotation: 'each-minute' | 'full-round'
}

export type DbEmomConfig = {
  minutes: number
  exerciseRotation: 'each-minute' | 'full-round'
}

export type EmomResult = {
  completedMinutes: number
  missedMinutes: ReadonlyArray<number>
}

export type DbEmomResult = {
  completedMinutes: number
  missedMinutes: ReadonlyArray<number>
}

export type EmomBlock = {
  kind: 'emom'
  id: number
  config: EmomConfig
  exercises: ReadonlyArray<BlockExercise>
  result: EmomResult | null
}

export type DbEmomBlock = {
  kind: 'emom'
  id: string
  config: DbEmomConfig
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbEmomResult | null
  orderIndex: number
}

/** Template counterpart: no id/result/orderIndex. */
export type DbTemplateEmomBlock = {
  kind: 'emom'
  config: DbEmomConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

// ============================================
// Markdown Parsed Intermediate (spec v1)
// ============================================

export type ParsedEmomBlock = {
  kind: 'emom'
  name: string
  minutes: number
  rotation: 'each-minute' | 'full-round'
  exercises: ReadonlyArray<ParsedBlockExercise>
  result: {
    completedMinutes: number
    missedMinutes: ReadonlyArray<number>
  } | null
}
