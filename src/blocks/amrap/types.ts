import type { BlockExercise, DbBlockExercise, DbTemplateBlockExercise } from '../shared/types'
import type { ParsedBlockExercise } from '../shared/markdown'

export type AmrapConfig = {
  durationSeconds: number
}

export type DbAmrapConfig = {
  durationSeconds: number
}

export type AmrapResult = {
  rounds: number
  partialReps: number
  actualDuration: number
}

export type DbAmrapResult = {
  rounds: number
  partialReps: number
  actualDuration: number
}

export type AmrapBlock = {
  kind: 'amrap'
  id: number
  config: AmrapConfig
  exercises: ReadonlyArray<BlockExercise>
  result: AmrapResult | null
}

export type DbAmrapBlock = {
  kind: 'amrap'
  id: string
  config: DbAmrapConfig
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbAmrapResult | null
  orderIndex: number
}

/** Template counterpart: no id/result/orderIndex. */
export type DbTemplateAmrapBlock = {
  kind: 'amrap'
  config: DbAmrapConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

// ============================================
// Markdown Parsed Intermediate (spec v1)
// ============================================

export type ParsedAmrapBlock = {
  kind: 'amrap'
  name: string
  durationSeconds: number
  exercises: ReadonlyArray<ParsedBlockExercise>
  result: {
    rounds: number
    partialReps: number
    actualDuration: number
  } | null
}
