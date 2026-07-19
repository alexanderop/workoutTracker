/**
 * Markdown import orchestration: frontmatter, metadata, section splitting,
 * and per-kind block dispatch through the Block Codecs (ADR 002).
 * All functions are side-effect free: (input) => ParseResult<T>
 */

import type { BlockKind, FieldParser, ParsedBlock } from '@/blocks'
import { BLOCK_CODECS, createFieldParserLoop, parseDurationString } from '@/blocks'
import type {
  ParseResult,
  ParsedWorkout,
  MarkdownFrontmatter,
  ParsedWorkoutMetadata,
} from './markdownSpec'
import { parseSuccess, singleError, MARKDOWN_SPEC_FORMAT } from './markdownSpec'

const FRONTMATTER_LINE_PATTERN = /^(\w+):\s*(.+)$/
const H1_NAME_PATTERN = /^#\s+(.+)$/
const DATE_PATTERN = /\*\*Date:\*\*\s*(.+)/
const DURATION_PATTERN = /\*\*Duration:\*\*\s*(.+)/
const NOTES_PATTERN = /\*\*Notes:\*\*\s*(.+)/
const BLOCK_HEADER_PATTERN = /^##\s+(\S(?:.*\S)?)\s+\((\w+)\)$/

// ============================================
// Frontmatter Helpers
// ============================================

function findFrontmatterEndIndex(lines: ReadonlyArray<string>): number {
  for (let index = 1; index < lines.length; index++) {
    if (lines[index]?.trim() === '---') return index
  }
  return -1
}

function parseFrontmatterLines(lines: ReadonlyArray<string>): Record<string, string> {
  const frontmatter: Record<string, string> = {}
  for (const line of lines) {
    const match = line.match(FRONTMATTER_LINE_PATTERN)
    if (match?.[1] && match[2]) {
      frontmatter[match[1]] = match[2]
    }
  }
  return frontmatter
}

function validateFrontmatter(
  frontmatter: Record<string, string>,
): ParseResult<MarkdownFrontmatter> {
  if (frontmatter['format'] !== MARKDOWN_SPEC_FORMAT) {
    return singleError(
      `Invalid format: expected "${MARKDOWN_SPEC_FORMAT}", got "${frontmatter['format']}"`,
    )
  }

  const version = Number.parseInt(frontmatter['version'] ?? '0', 10)
  if (Number.isNaN(version) || version < 1) {
    return singleError('Invalid or missing version in frontmatter')
  }

  return parseSuccess({
    format: MARKDOWN_SPEC_FORMAT,
    version,
    exported: frontmatter['exported'] ?? new Date().toISOString(),
  })
}

// ============================================
// Main Parser
// ============================================

export function parseWorkoutMarkdown(markdown: string): ParseResult<ParsedWorkout> {
  const lines = markdown.split('\n')

  // Parse frontmatter
  const frontmatterResult = parseFrontmatter(lines)
  if (!frontmatterResult.success) return frontmatterResult

  const contentStartIndex = findContentStart(lines)
  const contentLines = lines.slice(contentStartIndex)

  // Parse metadata (title, date, duration, notes)
  const metadataResult = parseMetadata(contentLines)
  if (!metadataResult.success) return metadataResult

  // Parse blocks
  const blocksResult = parseBlocks(contentLines)
  if (!blocksResult.success) return blocksResult

  return parseSuccess({
    frontmatter: frontmatterResult.data,
    metadata: metadataResult.data,
    blocks: blocksResult.data,
  })
}

// ============================================
// Frontmatter Parser
// ============================================

export function parseFrontmatter(lines: ReadonlyArray<string>): ParseResult<MarkdownFrontmatter> {
  if (lines[0]?.trim() !== '---') {
    return singleError('Missing YAML frontmatter delimiter', 1)
  }

  const endIndex = findFrontmatterEndIndex(lines)
  if (endIndex === -1) {
    return singleError('Missing closing YAML frontmatter delimiter')
  }

  const frontmatter = parseFrontmatterLines(lines.slice(1, endIndex))
  return validateFrontmatter(frontmatter)
}

// ============================================
// Metadata Parser
// ============================================

interface MetadataState {
  name: string
  date: Date | null
  durationSeconds: number | null
  notes: string | null
}

const parseH1Name: FieldParser<MetadataState> = (line, state) => {
  const match = line.match(H1_NAME_PATTERN)
  if (match?.[1]) {
    state.name = match[1].trim()
    return true
  }
  return false
}

const parseMetadataDate: FieldParser<MetadataState> = (line, state) => {
  const match = line.match(DATE_PATTERN)
  if (match?.[1]) {
    const parsed = new Date(match[1].trim())
    if (!Number.isNaN(parsed.getTime())) {
      state.date = parsed
    }
    return true
  }
  return false
}

const parseMetadataDuration: FieldParser<MetadataState> = (line, state) => {
  const match = line.match(DURATION_PATTERN)
  if (match?.[1]) {
    state.durationSeconds = parseDurationString(match[1].trim())
    return true
  }
  return false
}

const parseMetadataNotes: FieldParser<MetadataState> = (line, state) => {
  const match = line.match(NOTES_PATTERN)
  if (match?.[1]) {
    state.notes = match[1].trim()
    return true
  }
  return false
}

const metadataParsers: ReadonlyArray<FieldParser<MetadataState>> = [
  parseH1Name,
  parseMetadataDate,
  parseMetadataDuration,
  parseMetadataNotes,
]

const parseMetadataFields = createFieldParserLoop(metadataParsers)

export function parseMetadata(lines: ReadonlyArray<string>): ParseResult<ParsedWorkoutMetadata> {
  const state: MetadataState = {
    name: 'Imported Workout',
    date: null,
    durationSeconds: null,
    notes: null,
  }

  parseMetadataFields(lines, state, (line) => line.startsWith('## '))

  return parseSuccess(state)
}

// ============================================
// Block Parser
// ============================================

function parseBlocks(lines: ReadonlyArray<string>): ParseResult<ReadonlyArray<ParsedBlock>> {
  const blocks: Array<ParsedBlock> = []
  const blockSections = splitIntoBlockSections(lines)

  for (const section of blockSections) {
    const blockResult = parseBlock(section)
    if (!blockResult.success) return blockResult
    blocks.push(blockResult.data)
  }

  return parseSuccess(blocks)
}

function splitIntoBlockSections(lines: ReadonlyArray<string>): Array<Array<string>> {
  const sections: Array<Array<string>> = []
  let currentSection: Array<string> = []

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentSection.length > 0) {
        sections.push(currentSection)
      }
      currentSection = [line]
      continue
    }

    if (currentSection.length > 0) {
      currentSection.push(line)
    }
  }

  if (currentSection.length > 0) {
    sections.push(currentSection)
  }

  return sections
}

function isBlockKind(value: string): value is BlockKind {
  return Object.hasOwn(BLOCK_CODECS, value)
}

/**
 * Generic indexed-access dispatch (same pattern used in `@/blocks/registry`)
 * so the codec lookup stays cast-free.
 */
function parseBlockOfKind<K extends BlockKind>(
  kind: K,
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedBlock> {
  return BLOCK_CODECS[kind].parseMarkdown(name, lines)
}

function parseBlock(lines: ReadonlyArray<string>): ParseResult<ParsedBlock> {
  const header = lines[0]
  if (!header) return singleError('Empty block section')

  const headerMatch = header.match(BLOCK_HEADER_PATTERN)
  if (!headerMatch?.[1] || !headerMatch[2]) {
    return singleError(`Invalid block header format: ${header}`)
  }

  const name = headerMatch[1].trim()
  const type = headerMatch[2].toLowerCase()

  if (!isBlockKind(type)) {
    return singleError(`Unknown block type: ${type}`)
  }

  return parseBlockOfKind(type, name, lines.slice(1))
}

// ============================================
// Shared Helpers
// ============================================

function findContentStart(lines: ReadonlyArray<string>): number {
  // Skip past frontmatter
  let isFoundStart = false
  for (const [index, line] of lines.entries()) {
    if (line?.trim() !== '---') {
      continue
    }

    if (isFoundStart) return index + 1
    isFoundStart = true
  }
  return 0
}

// ============================================
// Per-Kind Parsers (owned by the Block Codecs)
// ============================================

export const parseStrengthBlock = BLOCK_CODECS.strength.parseMarkdown
export const parseAmrapBlock = BLOCK_CODECS.amrap.parseMarkdown
export const parseEmomBlock = BLOCK_CODECS.emom.parseMarkdown
export const parseTabataBlock = BLOCK_CODECS.tabata.parseMarkdown
export const parseForTimeBlock = BLOCK_CODECS.fortime.parseMarkdown
export const parseCardioBlock = BLOCK_CODECS.cardio.parseMarkdown
