/**
 * Block-based workout architecture types.
 *
 * Both bodybuilding and CrossFit workouts are modeled as a sequence of blocks.
 * Each block has a type that determines its behavior and UI.
 */

import type { Set } from '@/composables/useWorkout'

// ============================================
// Block Exercise (for timed blocks)
// ============================================

/**
 * Simplified exercise for timed blocks.
 * Unlike strength exercises, these don't track individual sets.
 */
export type BlockExercise = {
  id: string
  name: string
  prescribedReps: number
  load: string | null // "24kg", "bodyweight", "light band"
  thumbnail: string
}

// ============================================
// Block Configurations
// ============================================

export type EmomConfig = {
  minutes: number
  exerciseRotation: 'each-minute' | 'full-round'
}

export type AmrapConfig = {
  durationSeconds: number
}

export type TabataConfig = {
  rounds: number
  workSeconds: number
  restSeconds: number
}

export type ForTimeConfig = {
  timeCapSeconds: number | null
}

// ============================================
// Block Results
// ============================================

export type AmrapResult = {
  rounds: number
  partialReps: number
  actualDuration: number
}

export type EmomResult = {
  completedMinutes: number
  missedMinutes: ReadonlyArray<number>
}

export type TabataResult = {
  repsPerRound: ReadonlyArray<number>
}

export type ForTimeResult = {
  completionTime: number
  completed: boolean
}

// ============================================
// Block Types (Discriminated Union)
// ============================================

export type StrengthBlock = {
  kind: 'strength'
  id: number
  exerciseDefinitionId: string | null
  name: string
  equipment: string
  targetReps: number
  sets: Array<Set>
  thumbnail: string
}

export type EmomBlock = {
  kind: 'emom'
  id: number
  config: EmomConfig
  exercises: ReadonlyArray<BlockExercise>
  result: EmomResult | null
}

export type AmrapBlock = {
  kind: 'amrap'
  id: number
  config: AmrapConfig
  exercises: ReadonlyArray<BlockExercise>
  result: AmrapResult | null
}

export type TabataBlock = {
  kind: 'tabata'
  id: number
  config: TabataConfig
  exercise: BlockExercise
  result: TabataResult | null
}

export type ForTimeBlock = {
  kind: 'fortime'
  id: number
  config: ForTimeConfig
  exercises: ReadonlyArray<BlockExercise>
  result: ForTimeResult | null
}

export type TimedBlock = EmomBlock | AmrapBlock | TabataBlock | ForTimeBlock

export type WorkoutBlock = StrengthBlock | TimedBlock

// ============================================
// Timer Status (shared across composables)
// ============================================

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed'

// ============================================
// Workout Mode
// ============================================

export type WorkoutMode = 'builder' | 'active'

// ============================================
// Helper Types
// ============================================

type BlockKind = WorkoutBlock['kind']
export type TimedBlockKind = TimedBlock['kind']

// ============================================
// Type Guards
// ============================================

export function isStrengthBlock(block: WorkoutBlock): block is StrengthBlock {
  return block.kind === 'strength'
}

export function isTimedBlock(block: WorkoutBlock): block is TimedBlock {
  return block.kind !== 'strength'
}

// ============================================
// Block Display Helpers
// ============================================

export const BLOCK_LABELS: Record<BlockKind, string> = {
  strength: 'Strength',
  emom: 'EMOM',
  amrap: 'AMRAP',
  tabata: 'Tabata',
  fortime: 'For Time',
}

export const BLOCK_ICONS: Record<BlockKind, string> = {
  strength: '🏋️',
  emom: '⏱️',
  amrap: '🔄',
  tabata: '⚡',
  fortime: '🏁',
}

export const BLOCK_COLORS = {
  strength: { bg: 'bg-blue-500/20', text: 'text-blue-500', accent: 'bg-blue-500' },
  amrap: { bg: 'bg-purple-500/20', text: 'text-purple-500', accent: 'bg-purple-500' },
  emom: { bg: 'bg-orange-500/20', text: 'text-orange-500', accent: 'bg-orange-500' },
  tabata: { bg: 'bg-emerald-500/20', text: 'text-emerald-500', accent: 'bg-emerald-500' },
  fortime: { bg: 'bg-rose-500/20', text: 'text-rose-500', accent: 'bg-rose-500' },
} as const

export function getBlockDurationDisplay(block: TimedBlock): string {
  switch (block.kind) {
    case 'emom':
      return `${block.config.minutes} min`
    case 'amrap':
      return `${Math.floor(block.config.durationSeconds / 60)} min`
    case 'tabata': {
      const totalSeconds =
        block.config.rounds * (block.config.workSeconds + block.config.restSeconds)
      return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
    }
    case 'fortime':
      return block.config.timeCapSeconds
        ? `Cap: ${Math.floor(block.config.timeCapSeconds / 60)} min`
        : 'No cap'
  }
}

export function getBlockExerciseList(block: TimedBlock): ReadonlyArray<BlockExercise> {
  if (block.kind === 'tabata') {
    return [block.exercise]
  }
  return block.exercises
}

/**
 * Get the thumbnail/icon for a block.
 */
export function getBlockThumbnail(block: WorkoutBlock): string {
  if (block.kind === 'strength') {
    return block.thumbnail
  }
  return BLOCK_ICONS[block.kind]
}
