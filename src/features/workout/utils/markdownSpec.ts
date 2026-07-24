/**
 * Markdown Import/Export Spec v1
 *
 * Defines the structure for human-readable, machine-parseable workout markdown.
 * Uses YAML frontmatter for metadata and consistent patterns for blocks.
 *
 * Per-kind parsed block types and the parse-result machinery live with the
 * Block Codecs under `src/blocks/` (ADR 002); this module owns only the
 * workout-level markdown types and spec constants.
 */

import type { ParsedBlock } from '@/blocks'

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
