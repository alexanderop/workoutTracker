import type { Equipment } from '@/exercises/types'
import type { Set, StrengthBlock } from './types'

/**
 * Strength block shape as it arrives from a workout template.
 * Structural (not `DbTemplateStrengthBlock`) so callers with partial data
 * keep working; missing fields fall back to creation defaults.
 */
export type TemplateStrengthBlockSource = {
  kind: 'strength'
  name: string
  equipment: Equipment
  targetReps?: number
  targetDuration?: number | null
  targetWeight?: number | null
  defaultSetCount?: number
  image: Blob | null
  exerciseDefinitionId?: string | null
}

/**
 * Strength block shape as it arrives from a completed workout in history.
 * Carries the performed set values, which are preserved on instantiation.
 */
export type HistoryStrengthBlockSource = {
  kind: 'strength'
  name: string
  equipment: Equipment
  targetReps?: number
  targetDuration?: number | null
  targetWeight?: number | null
  sets: ReadonlyArray<{ kg: string; reps: string; rir: string }>
  image: Blob | null
  exerciseDefinitionId?: string | null
}

type StrengthBlockSource = {
  name: string
  equipment: Equipment
  targetReps?: number
  targetDuration?: number | null
  targetWeight?: number | null
  image: Blob | null
  exerciseDefinitionId?: string | null
}

export function createStrengthBlockFromTemplate(
  block: TemplateStrengthBlockSource,
  id: number,
): StrengthBlock {
  const setCount = block.defaultSetCount ?? 3
  const sets: Array<Set> = Array.from({ length: setCount }, (_, index) => ({
    id: index + 1,
    kg: '',
    reps: String(block.targetReps ?? ''),
    duration: '',
    rir: '',
    status: 'completed',
  }))

  return createStrengthWorkoutBlock(block, id, sets)
}

export function createStrengthBlockFromHistory(
  block: HistoryStrengthBlockSource,
  id: number,
): StrengthBlock {
  const sets: Array<Set> = block.sets.map((set, index) => ({
    id: index + 1,
    kg: set.kg,
    reps: set.reps,
    duration: '',
    rir: set.rir,
    status: 'completed',
  }))

  return createStrengthWorkoutBlock(block, id, sets)
}

function createStrengthWorkoutBlock(
  source: StrengthBlockSource,
  id: number,
  sets: Array<Set>,
): StrengthBlock {
  return {
    kind: 'strength',
    id,
    exerciseDefinitionId: source.exerciseDefinitionId ?? null,
    name: source.name,
    equipment: source.equipment,
    targetReps: source.targetReps ?? 8,
    targetDuration: source.targetDuration ?? null,
    targetWeight: source.targetWeight ?? null,
    sets,
    image: source.image,
  }
}
