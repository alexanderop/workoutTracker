import type { BlockExercise, DbBlockExercise, DbTemplateBlockExercise } from '../shared/types'
import type { ParsedBlockExercise } from '../shared/markdown'

export type ForTimeConfig = {
  timeCapSeconds: number | null
}

export type DbForTimeConfig = {
  timeCapSeconds: number | null
}

export type ForTimeResult = {
  completionTime: number
  completed: boolean
  splitTimes?: ReadonlyArray<number>
}

export type DbForTimeResult = {
  completionTime: number
  completed: boolean
  splitTimes?: ReadonlyArray<number>
}

export type ForTimeBlock = {
  kind: 'fortime'
  id: number
  config: ForTimeConfig
  exercises: ReadonlyArray<BlockExercise>
  result: ForTimeResult | null
}

export type DbForTimeBlock = {
  kind: 'fortime'
  id: string
  config: DbForTimeConfig
  exercises: ReadonlyArray<DbBlockExercise>
  result: DbForTimeResult | null
  orderIndex: number
}

/** Template counterpart: no id/result/orderIndex. */
export type DbTemplateForTimeBlock = {
  kind: 'fortime'
  config: DbForTimeConfig
  exercises: ReadonlyArray<DbTemplateBlockExercise>
}

// ============================================
// Markdown Parsed Intermediate (spec v1)
// ============================================

export type ParsedForTimeBlock = {
  kind: 'fortime'
  name: string
  timeCapSeconds: number | null
  exercises: ReadonlyArray<ParsedBlockExercise>
  result: {
    completionTime: number
    completed: boolean
  } | null
}
