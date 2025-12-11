import type { WorkoutBlock, WorkoutMode } from './blocks'

export type SetStatus = 'completed' | 'active' | 'planned'

export type Set = {
  id: number
  kg: string
  reps: string
  rir: string
  status: SetStatus
}

export type Workout = {
  id: number
  name: string
  blocks: Array<WorkoutBlock>
  selectedBlockIndex: number
  startedAt: number
  mode: WorkoutMode
  activeSetIndex: number | null
}
