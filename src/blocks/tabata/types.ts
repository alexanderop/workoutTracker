import type { BlockExercise, DbBlockExercise, DbTemplateBlockExercise } from '../shared/types'
import type { ParsedBlockExercise } from '../shared/markdown'

export type TabataConfig = {
  rounds: number
  workSeconds: number
  restSeconds: number
}

export type DbTabataConfig = {
  rounds: number
  workSeconds: number
  restSeconds: number
}

export type TabataResult = {
  repsPerRound: ReadonlyArray<number>
}

export type DbTabataResult = {
  repsPerRound: ReadonlyArray<number>
}

/**
 * Tabata carries exactly one exercise — the singular `exercise` field,
 * unlike the other timed kinds' `exercises` arrays.
 */
export type TabataBlock = {
  kind: 'tabata'
  id: number
  config: TabataConfig
  exercise: BlockExercise
  result: TabataResult | null
}

export type DbTabataBlock = {
  kind: 'tabata'
  id: string
  config: DbTabataConfig
  exercise: DbBlockExercise
  result: DbTabataResult | null
  orderIndex: number
}

/** Template counterpart: no id/result/orderIndex; keeps the singular exercise. */
export type DbTemplateTabataBlock = {
  kind: 'tabata'
  config: DbTabataConfig
  exercise: DbTemplateBlockExercise
}

// ============================================
// Markdown Parsed Intermediate (spec v1)
// ============================================

export type ParsedTabataBlock = {
  kind: 'tabata'
  name: string
  rounds: number
  workSeconds: number
  restSeconds: number
  exercise: ParsedBlockExercise
  result: {
    repsPerRound: ReadonlyArray<number>
  } | null
}
