/**
 * Markdown Import/Export Spec v1
 *
 * Defines the structure for human-readable, machine-parseable workout markdown.
 * Uses YAML frontmatter for metadata and consistent patterns for blocks.
 */

// ============================================
// Spec Constants
// ============================================

export const MARKDOWN_SPEC_VERSION = 1
export const MARKDOWN_SPEC_FORMAT = 'workout-tracker'

// ============================================
// Frontmatter Types
// ============================================

export type MarkdownFrontmatter = {
  format: typeof MARKDOWN_SPEC_FORMAT
  version: number
  exported: string // ISO timestamp
}

// ============================================
// Parsed Workout Metadata
// ============================================

export type ParsedWorkoutMetadata = {
  name: string
  date: Date | null
  durationSeconds: number | null
  notes: string | null
}

// ============================================
// Parsed Exercise (for timed blocks)
// ============================================

export type ParsedBlockExercise = {
  name: string
  prescribedReps: number
  load: string | null
}

// ============================================
// Parsed Set (for strength blocks)
// ============================================

export type ParsedSet = {
  kg: string
  reps: string
  rir: string
}

// ============================================
// Parsed Block Types
// ============================================

export type ParsedStrengthBlock = {
  kind: 'strength'
  name: string
  equipment: string
  targetReps: number | null
  sets: ReadonlyArray<ParsedSet>
}

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

export type ParsedCardioBlock = {
  kind: 'cardio'
  name: string
  activity: string
  result: {
    actualDurationSeconds: number
    distanceMeters: number | null
    avgPaceSecondsPerKm: number | null
    calories: number | null
    notes: string | null
  } | null
}

export type ParsedBlock =
  | ParsedStrengthBlock
  | ParsedAmrapBlock
  | ParsedEmomBlock
  | ParsedTabataBlock
  | ParsedForTimeBlock
  | ParsedCardioBlock

// ============================================
// Parsed Workout (full structure)
// ============================================

export type ParsedWorkout = {
  frontmatter: MarkdownFrontmatter
  metadata: ParsedWorkoutMetadata
  blocks: ReadonlyArray<ParsedBlock>
}

// ============================================
// Parse Result Types
// ============================================

type ParseError = {
  line?: number
  message: string
  context?: string
}

export type ParseSuccess<T> = {
  success: true
  data: T
}

export type ParseFailure = {
  success: false
  errors: ReadonlyArray<ParseError>
}

export type ParseResult<T> = ParseSuccess<T> | ParseFailure

// ============================================
// Helper Functions
// ============================================

export function parseSuccess<T>(data: T): ParseSuccess<T> {
  return { success: true, data }
}

function parseFailure(errors: ReadonlyArray<ParseError>): ParseFailure {
  return { success: false, errors }
}

export function singleError(message: string, line?: number, context?: string): ParseFailure {
  return parseFailure([{ message, line, context }])
}
