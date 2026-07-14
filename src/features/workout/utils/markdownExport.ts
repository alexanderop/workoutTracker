/**
 * Markdown export orchestration: frontmatter, metadata section, and per-kind
 * block dispatch through the Block Codecs (ADR 002).
 * All functions are side-effect free: (input) => output
 */

import type { DbCompletedWorkout } from '@/db/schema'
import type { BlockKind, DbBlockByKind } from '@/blocks'
import { BLOCK_CODECS, formatDuration } from '@/blocks'
import { MARKDOWN_SPEC_VERSION, MARKDOWN_SPEC_FORMAT } from './markdownSpec'

// ============================================
// Frontmatter
// ============================================

export function formatFrontmatter(exportedAt: Date = new Date()): string {
  return `---
format: ${MARKDOWN_SPEC_FORMAT}
version: ${MARKDOWN_SPEC_VERSION}
exported: ${exportedAt.toISOString()}
---`
}

// ============================================
// Metadata Section
// ============================================

function formatMetadata(workout: DbCompletedWorkout): string {
  const date = new Date(workout.completedAt)
  const dateString = date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const duration = formatDuration(workout.durationSeconds)

  const lines = [`**Date:** ${dateString}`, `**Duration:** ${duration}`]

  if (workout.notes.trim()) {
    lines.push(`**Notes:** ${workout.notes}`)
  }

  return lines.join('  \n')
}

// ============================================
// Block Router
// ============================================

/**
 * Generic indexed-access dispatch (same pattern used in `@/blocks/registry`)
 * so the codec lookup stays cast-free.
 */
function formatBlock<K extends BlockKind>(block: Readonly<DbBlockByKind[K]>): string {
  const kind: K = block.kind
  return BLOCK_CODECS[kind].formatMarkdown(block)
}

// ============================================
// Main Export Function
// ============================================

export function exportWorkoutAsMarkdown(workout: DbCompletedWorkout): string {
  const blockSections = workout.blocks.map((block) => formatBlock(block))

  const sections = [
    formatFrontmatter(new Date(workout.completedAt)),
    `# ${workout.name}`,
    formatMetadata(workout),
    ...blockSections,
  ]

  return sections.join('\n\n')
}

// ============================================
// Per-Kind Formatters (owned by the Block Codecs)
// ============================================

export const formatStrengthBlock = BLOCK_CODECS.strength.formatMarkdown
export const formatAmrapBlock = BLOCK_CODECS.amrap.formatMarkdown
export const formatEmomBlock = BLOCK_CODECS.emom.formatMarkdown
export const formatTabataBlock = BLOCK_CODECS.tabata.formatMarkdown
export const formatForTimeBlock = BLOCK_CODECS.fortime.formatMarkdown
export const formatCardioBlock = BLOCK_CODECS.cardio.formatMarkdown
