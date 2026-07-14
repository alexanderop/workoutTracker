/**
 * Markdown Import/Export Spec v1
 *
 * Defines the structure for human-readable, machine-parseable workout markdown.
 * Uses YAML frontmatter for metadata and consistent patterns for blocks.
 *
 * Per-kind parsed block types and the parse-result machinery live with the
 * Block Codecs under `src/blocks/` (ADR 002); this module re-exports them so
 * existing import paths stay stable. Workout-level types stay here.
 */

import type { ParsedBlock } from '@/blocks/types'

// ============================================
// Re-exports from the Block Codecs
// ============================================

export type {
  ParsedBlockExercise,
  ParsedSet,
  ParseSuccess,
  ParseFailure,
  ParseResult,
} from '@/blocks/shared/markdown'
export { parseSuccess, singleError } from '@/blocks/shared/markdown'
export type { ParsedStrengthBlock } from '@/blocks/strength/types'
export type { ParsedAmrapBlock } from '@/blocks/amrap/types'
export type { ParsedEmomBlock } from '@/blocks/emom/types'
export type { ParsedTabataBlock } from '@/blocks/tabata/types'
export type { ParsedForTimeBlock } from '@/blocks/fortime/types'
export type { ParsedCardioBlock } from '@/blocks/cardio/types'
export type { ParsedBlock } from '@/blocks/types'

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
// Parsed Workout (full structure)
// ============================================

export type ParsedWorkout = {
  frontmatter: MarkdownFrontmatter
  metadata: ParsedWorkoutMetadata
  blocks: ReadonlyArray<ParsedBlock>
}
