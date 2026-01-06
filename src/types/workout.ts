import type { WorkoutBlock, WorkoutMode } from './blocks'

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
 * Fields that can be prefilled from a previous set.
 * When adding new prefillable fields to Set, add them here.
 * TypeScript will error in prefill helpers if incomplete.
 */
export type PrefillableSetFields = Pick<Set, 'kg' | 'reps' | 'duration' | 'rir'>

export type Workout = {
  id: number
  name: string
  blocks: Array<WorkoutBlock>
  selectedBlockIndex: number
  startedAt: number
  mode: WorkoutMode
  activeSetIndex: number | null
}
