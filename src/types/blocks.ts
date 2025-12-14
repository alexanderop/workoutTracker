/**
 * Block-based workout architecture types.
 *
 * Both bodybuilding and CrossFit workouts are modeled as a sequence of blocks.
 * Each block has a type that determines its behavior and UI.
 */

import { z } from 'zod'

// ============================================
// Set Types (used by strength blocks)
// ============================================

type SetStatus = 'completed' | 'active' | 'planned'

type WorkoutSet = {
  id: number
  kg: string
  reps: string
  rir: string
  status: SetStatus
}

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
// Cardio Types
// ============================================

export type CardioActivity =
  | 'running'
  | 'cycling'
  | 'rowing'
  | 'elliptical'
  | 'swimming'
  | 'stairclimber'
  | 'walking'

export type CardioConfig = {
  activity: CardioActivity
  targetDurationSeconds: number | null
  targetDistanceMeters: number | null
}

export const CARDIO_ACTIVITIES: ReadonlyArray<{
  value: CardioActivity
  label: string
  icon: string
  supportsDistance: boolean
  distanceUnit: 'km' | 'laps' | null
}> = [
  { value: 'running', label: 'Running', icon: '🏃', supportsDistance: true, distanceUnit: 'km' },
  { value: 'cycling', label: 'Cycling', icon: '🚴', supportsDistance: true, distanceUnit: 'km' },
  { value: 'rowing', label: 'Rowing', icon: '🚣', supportsDistance: true, distanceUnit: 'km' },
  { value: 'elliptical', label: 'Elliptical', icon: '🏋️', supportsDistance: false, distanceUnit: null },
  { value: 'swimming', label: 'Swimming', icon: '🏊', supportsDistance: true, distanceUnit: 'laps' },
  { value: 'stairclimber', label: 'Stair Climber', icon: '🪜', supportsDistance: false, distanceUnit: null },
  { value: 'walking', label: 'Walking', icon: '🚶', supportsDistance: true, distanceUnit: 'km' },
] as const

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
  splitTimes?: ReadonlyArray<number>
}

export type CardioResult = {
  actualDurationSeconds: number
  distanceMeters: number | null
  avgPaceSecondsPerKm: number | null
  calories: number | null
  notes: string | null
}

/**
 * Union type for all timed block results
 * @public - Used by isTimedBlockResult() type guard
 */
export type TimedBlockResult = AmrapResult | EmomResult | TabataResult | ForTimeResult

// ============================================
// Zod Schemas for Runtime Validation
// ============================================

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
  sets: Array<WorkoutSet>
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

export type CardioBlock = {
  kind: 'cardio'
  id: number
  config: CardioConfig
  result: CardioResult | null
}

export type TimedBlock = EmomBlock | AmrapBlock | TabataBlock | ForTimeBlock

export type WorkoutBlock = StrengthBlock | TimedBlock | CardioBlock

// ============================================
// Workout Mode
// ============================================

export type WorkoutMode = 'builder' | 'active' | 'completed'

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

// ============================================
// Block Display Helpers
// ============================================

export const BLOCK_LABELS: Record<BlockKind, string> = {
  strength: 'Strength',
  emom: 'EMOM',
  amrap: 'AMRAP',
  tabata: 'Tabata',
  fortime: 'For Time',
  cardio: 'Cardio',
}

export const BLOCK_ICONS: Record<BlockKind, string> = {
  strength: '',
  emom: '',
  amrap: '',
  tabata: '',
  fortime: '',
  cardio: '',
}

export const BLOCK_COLORS = {
  strength: { bg: 'bg-blue-500/20', text: 'text-blue-500', accent: 'bg-blue-500' },
  amrap: { bg: 'bg-purple-500/20', text: 'text-purple-500', accent: 'bg-purple-500' },
  emom: { bg: 'bg-orange-500/20', text: 'text-orange-500', accent: 'bg-orange-500' },
  tabata: { bg: 'bg-emerald-500/20', text: 'text-emerald-500', accent: 'bg-emerald-500' },
  fortime: { bg: 'bg-rose-500/20', text: 'text-rose-500', accent: 'bg-rose-500' },
  cardio: { bg: 'bg-cyan-500/20', text: 'text-cyan-500', accent: 'bg-cyan-500' },
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
  if (block.kind === 'cardio') {
    return getCardioActivityIcon(block.config.activity)
  }
  return BLOCK_ICONS[block.kind]
}

/**
 * Get the icon for a cardio activity.
 */
export function getCardioActivityIcon(activity: CardioActivity): string {
  const activityInfo = CARDIO_ACTIVITIES.find((a) => a.value === activity)
  return activityInfo?.icon ?? '🏃'
}

/**
 * Get display info for a cardio block.
 */
export function getCardioBlockDisplay(block: CardioBlock): string {
  const activityInfo = CARDIO_ACTIVITIES.find((a) => a.value === block.config.activity)
  const label = activityInfo?.label ?? 'Cardio'

  if (block.config.targetDurationSeconds) {
    const minutes = Math.floor(block.config.targetDurationSeconds / 60)
    return `${label} - ${minutes} min`
  }

  if (block.config.targetDistanceMeters) {
    const km = block.config.targetDistanceMeters / 1000
    return `${label} - ${km} km`
  }

  return label
}
