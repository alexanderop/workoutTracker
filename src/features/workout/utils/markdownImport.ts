/**
 * Pure functions for importing workouts from markdown.
 * All functions are side-effect free: (input) => ParseResult<T>
 */

import type {
  ParseResult,
  ParsedWorkout,
  ParsedBlock,
  ParsedStrengthBlock,
  ParsedAmrapBlock,
  ParsedEmomBlock,
  ParsedTabataBlock,
  ParsedForTimeBlock,
  ParsedCardioBlock,
  ParsedBlockExercise,
  ParsedSet,
  MarkdownFrontmatter,
  ParsedWorkoutMetadata,
} from './markdownSpec'
import {
  parseSuccess,
  singleError,
  MARKDOWN_SPEC_FORMAT,
} from './markdownSpec'

// ============================================
// Duration Parsing Helpers
// ============================================

function parseMinutesFormat(str: string): number | null {
  const match = str.match(/^(\d+)\s*min/)
  return match?.[1] ? Number.parseInt(match[1], 10) * 60 : null
}

function parseMmSsFormat(parts: Array<number>): number {
  return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
}

function parseHhMmSsFormat(parts: Array<number>): number {
  return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
}

function parseTimeFormat(str: string): number | null {
  const match = str.match(/^(\d+):(\d+)(?::(\d+))?$/)
  if (!match?.[1] || !match[2]) return null

  const parts = [match[1], match[2], match[3]].filter(Boolean).map(Number)
  return parts.length === 3 ? parseHhMmSsFormat(parts) : parseMmSsFormat(parts)
}

// ============================================
// Field Parser Types and Helpers
// ============================================

type FieldParser<T> = (line: string, state: T) => boolean

function createFieldParserLoop<T>(parsers: ReadonlyArray<FieldParser<T>>) {
  return (lines: ReadonlyArray<string>, state: T, stopCondition?: (line: string) => boolean): void => {
    for (const line of lines) {
      if (stopCondition?.(line)) break
      for (const parser of parsers) {
        if (parser(line, state)) break
      }
    }
  }
}

// ============================================
// Frontmatter Helpers
// ============================================

function findFrontmatterEndIndex(lines: ReadonlyArray<string>): number {
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') return i
  }
  return -1
}

function parseFrontmatterLines(lines: ReadonlyArray<string>): Record<string, string> {
  const frontmatter: Record<string, string> = {}
  for (const line of lines) {
    const match = line.match(/^(\w+):\s*(.+)$/)
    if (match?.[1] && match[2]) {
      frontmatter[match[1]] = match[2]
    }
  }
  return frontmatter
}

function validateFrontmatter(frontmatter: Record<string, string>): ParseResult<MarkdownFrontmatter> {
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
  const match = line.match(/^#\s+(.+)$/)
  if (match?.[1]) {
    state.name = match[1].trim()
    return true
  }
  return false
}

const parseMetadataDate: FieldParser<MetadataState> = (line, state) => {
  const match = line.match(/\*\*Date:\*\*\s*(.+)/)
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
  const match = line.match(/\*\*Duration:\*\*\s*(.+)/)
  if (match?.[1]) {
    state.durationSeconds = parseDurationString(match[1].trim())
    return true
  }
  return false
}

const parseMetadataNotes: FieldParser<MetadataState> = (line, state) => {
  const match = line.match(/\*\*Notes:\*\*\s*(.+)/)
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

type BlockParser = (name: string, lines: ReadonlyArray<string>) => ParseResult<ParsedBlock>

const blockParsers: Record<string, BlockParser> = {
  strength: parseStrengthBlock,
  amrap: parseAmrapBlock,
  emom: parseEmomBlock,
  tabata: parseTabataBlock,
  fortime: parseForTimeBlock,
  cardio: parseCardioBlock,
}

function parseBlock(lines: ReadonlyArray<string>): ParseResult<ParsedBlock> {
  const header = lines[0]
  if (!header) return singleError('Empty block section')

  const headerMatch = header.match(/^##\s+(.+)\s+\((\w+)\)$/)
  if (!headerMatch?.[1] || !headerMatch[2]) {
    return singleError(`Invalid block header format: ${header}`)
  }

  const name = headerMatch[1].trim()
  const type = headerMatch[2].toLowerCase()
  const parser = blockParsers[type]

  if (!parser) {
    return singleError(`Unknown block type: ${type}`)
  }

  return parser(name, lines.slice(1))
}

// ============================================
// Strength Block Parser
// ============================================

interface StrengthBlockState {
  equipment: string
  targetReps: number | null
  sets: Array<ParsedSet>
  inTable: boolean
}

const parseStrengthEquipment: FieldParser<StrengthBlockState> = (line, state) => {
  const match = line.match(/^equipment:\s*(.+)$/i)
  if (match?.[1]) {
    state.equipment = match[1].trim().toLowerCase()
    return true
  }
  return false
}

const parseStrengthTarget: FieldParser<StrengthBlockState> = (line, state) => {
  const match = line.match(/^target:\s*(\d+)\s*reps?$/i)
  if (match?.[1]) {
    state.targetReps = Number.parseInt(match[1], 10)
    return true
  }
  return false
}

const parseStrengthTableHeader: FieldParser<StrengthBlockState> = (line, state) => {
  if (line.includes('| Set |')) {
    state.inTable = true
    return true
  }
  return false
}

const parseStrengthTableRow: FieldParser<StrengthBlockState> = (line, state) => {
  if (/^\|[\s|-]+\|$/.test(line)) return true
  if (state.inTable && line.startsWith('|')) {
    const set = parseSetRow(line)
    if (set) state.sets.push(set)
    return true
  }
  return false
}

const strengthParsers: ReadonlyArray<FieldParser<StrengthBlockState>> = [
  parseStrengthEquipment,
  parseStrengthTarget,
  parseStrengthTableHeader,
  parseStrengthTableRow,
]

const parseStrengthFields = createFieldParserLoop(strengthParsers)

export function parseStrengthBlock(
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedStrengthBlock> {
  const state: StrengthBlockState = {
    equipment: 'bodyweight',
    targetReps: null,
    sets: [],
    inTable: false,
  }

  parseStrengthFields(lines, state)

  return parseSuccess({
    kind: 'strength',
    name,
    equipment: state.equipment,
    targetReps: state.targetReps,
    sets: state.sets,
  })
}

function parseSetRow(line: string): ParsedSet | null {
  // | 1   | 80kg | 5    | 2   |
  const cells = line.split('|').map((c) => c.trim()).filter(Boolean)
  if (cells.length < 4) return null

  const weightCell = cells[1] ?? ''
  const repsCell = cells[2] ?? ''
  const rirCell = cells[3] ?? ''

  // Extract kg from weight cell
  const kgMatch = weightCell.match(/(\d+(?:\.\d+)?)\s*kg/i)
  const kg = kgMatch?.[1] ?? ''

  // Clean up reps and rir
  const reps = repsCell.replaceAll(/\D/g, '')
  const rir = rirCell.replaceAll(/\D/g, '')

  return { kg, reps, rir }
}

// ============================================
// AMRAP Block Parser
// ============================================

export function parseAmrapBlock(
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedAmrapBlock> {
  let durationSeconds = 600 // default 10 min
  const exercises: Array<ParsedBlockExercise> = []
  let result: ParsedAmrapBlock['result'] = null

  for (const line of lines) {
    // Duration
    const durationMatch = line.match(/^duration:\s*(\d+)\s*min/i)
    if (durationMatch?.[1]) {
      durationSeconds = Number.parseInt(durationMatch[1], 10) * 60
      continue
    }

    // Exercise line
    const exercise = parseExerciseLine(line)
    if (exercise) {
      exercises.push(exercise)
      continue
    }

    // Result
    const resultMatch = line.match(/\*\*result:\*\*\s*(\d+)\s*rounds?\s*\+\s*(\d+)\s*reps?\s*\(([^)]+)\)/i)
    if (resultMatch?.[1] && resultMatch[2] && resultMatch[3]) {
      result = {
        rounds: Number.parseInt(resultMatch[1], 10),
        partialReps: Number.parseInt(resultMatch[2], 10),
        actualDuration: parseDurationToMs(resultMatch[3]),
      }
    }
  }

  return parseSuccess({
    kind: 'amrap',
    name,
    durationSeconds,
    exercises,
    result,
  })
}

// ============================================
// EMOM Block Parser
// ============================================

interface EmomBlockState {
  minutes: number
  rotation: 'each-minute' | 'full-round'
  exercises: Array<ParsedBlockExercise>
  result: ParsedEmomBlock['result']
}

const parseEmomDuration: FieldParser<EmomBlockState> = (line, state) => {
  const match = line.match(/^duration:\s*(\d+)\s*min/i)
  if (match?.[1]) {
    state.minutes = Number.parseInt(match[1], 10)
    return true
  }
  return false
}

const parseEmomRotation: FieldParser<EmomBlockState> = (line, state) => {
  const match = line.match(/^rotation:\s*(each-minute|full-round)/i)
  if (match?.[1]) {
    const normalized = match[1].toLowerCase()
    if (normalized === 'each-minute' || normalized === 'full-round') {
      state.rotation = normalized
    }
    return true
  }
  return false
}

const parseEmomExercise: FieldParser<EmomBlockState> = (line, state) => {
  const exercise = parseExerciseLine(line)
  if (exercise) {
    state.exercises.push(exercise)
    return true
  }
  return false
}

const parseEmomResult: FieldParser<EmomBlockState> = (line, state) => {
  const match = line.match(/\*\*result:\*\*\s*(\d+)\/(\d+)\s*minutes/i)
  if (match?.[1]) {
    state.result = {
      completedMinutes: Number.parseInt(match[1], 10),
      missedMinutes: [],
    }
    return true
  }
  return false
}

const emomParsers: ReadonlyArray<FieldParser<EmomBlockState>> = [
  parseEmomDuration,
  parseEmomRotation,
  parseEmomExercise,
  parseEmomResult,
]

const parseEmomFields = createFieldParserLoop(emomParsers)

export function parseEmomBlock(
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedEmomBlock> {
  const state: EmomBlockState = {
    minutes: 10,
    rotation: 'each-minute',
    exercises: [],
    result: null,
  }

  parseEmomFields(lines, state)

  return parseSuccess({
    kind: 'emom',
    name,
    minutes: state.minutes,
    rotation: state.rotation,
    exercises: state.exercises,
    result: state.result,
  })
}

// ============================================
// Tabata Block Parser
// ============================================

export function parseTabataBlock(
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedTabataBlock> {
  let rounds = 8
  let workSeconds = 20
  let restSeconds = 10
  let exercise: ParsedBlockExercise = { name, prescribedReps: 0, load: null }
  let result: ParsedTabataBlock['result'] = null

  for (const line of lines) {
    // Rounds
    const roundsMatch = line.match(/^rounds:\s*(\d+)/i)
    if (roundsMatch?.[1]) {
      rounds = Number.parseInt(roundsMatch[1], 10)
      continue
    }

    // Work/Rest
    const timingMatch = line.match(/^work\/rest:\s*(\d+)s\/(\d+)s/i)
    if (timingMatch?.[1] && timingMatch[2]) {
      workSeconds = Number.parseInt(timingMatch[1], 10)
      restSeconds = Number.parseInt(timingMatch[2], 10)
      continue
    }

    // Exercise
    const exerciseData = parseExerciseLine(line)
    if (exerciseData) {
      exercise = exerciseData
      continue
    }

    // Result
    const resultMatch = line.match(/\*\*result:\*\*\s*([\d\s,]+)\s*reps?/i)
    if (resultMatch?.[1]) {
      const repsPerRound = resultMatch[1]
        .split(',')
        .map((s) => Number.parseInt(s.trim(), 10))
        .filter((n) => !Number.isNaN(n))
      result = { repsPerRound }
    }
  }

  return parseSuccess({
    kind: 'tabata',
    name,
    rounds,
    workSeconds,
    restSeconds,
    exercise,
    result,
  })
}

// ============================================
// ForTime Block Parser
// ============================================

export function parseForTimeBlock(
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedForTimeBlock> {
  let timeCapSeconds: number | null = null
  const exercises: Array<ParsedBlockExercise> = []
  let result: ParsedForTimeBlock['result'] = null

  for (const line of lines) {
    // Time cap
    const capMatch = line.match(/^time cap:\s*(\d+)\s*min/i)
    if (capMatch?.[1]) {
      timeCapSeconds = Number.parseInt(capMatch[1], 10) * 60
      continue
    }

    // Exercise
    const exercise = parseExerciseLine(line)
    if (exercise) {
      exercises.push(exercise)
      continue
    }

    // Result
    const resultMatch = line.match(/\*\*result:\*\*\s*(\d+:\d+)\s*(\u2713)?/i)
    if (resultMatch?.[1]) {
      result = {
        completionTime: parseDurationToMs(resultMatch[1]),
        completed: resultMatch[2] === '\u2713',
      }
    }
  }

  return parseSuccess({
    kind: 'fortime',
    name,
    timeCapSeconds,
    exercises,
    result,
  })
}

// ============================================
// Cardio Block Parser
// ============================================

interface CardioBlockState {
  activity: string
  resultData: Partial<NonNullable<ParsedCardioBlock['result']>>
  hasResult: boolean
}

const parseCardioActivity: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(/^activity:\s*(\w+)/i)
  if (match?.[1]) {
    state.activity = match[1].toLowerCase()
    return true
  }
  return false
}

const parseCardioDuration: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(/-\s*duration:\s*(.+)/i)
  if (match?.[1]) {
    state.resultData.actualDurationSeconds = parseDurationString(match[1].trim()) ?? 0
    state.hasResult = true
    return true
  }
  return false
}

const parseCardioDistance: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(/-\s*distance:\s*([\d.]+)\s*km/i)
  if (match?.[1]) {
    state.resultData.distanceMeters = Number.parseFloat(match[1]) * 1000
    state.hasResult = true
    return true
  }
  return false
}

const parseCardioPace: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(/-\s*pace:\s*(\d+):(\d+)\s*\/km/i)
  if (match?.[1] && match[2]) {
    state.resultData.avgPaceSecondsPerKm = Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10)
    state.hasResult = true
    return true
  }
  return false
}

const parseCardioCalories: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(/-\s*calories:\s*(\d+)/i)
  if (match?.[1]) {
    state.resultData.calories = Number.parseInt(match[1], 10)
    state.hasResult = true
    return true
  }
  return false
}

const parseCardioNotes: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(/^notes:\s*(.+)/i)
  if (match?.[1]) {
    state.resultData.notes = match[1].trim()
    state.hasResult = true
    return true
  }
  return false
}

const cardioParsers: ReadonlyArray<FieldParser<CardioBlockState>> = [
  parseCardioActivity,
  parseCardioDuration,
  parseCardioDistance,
  parseCardioPace,
  parseCardioCalories,
  parseCardioNotes,
]

const parseCardioFields = createFieldParserLoop(cardioParsers)

function buildCardioResult(state: CardioBlockState): ParsedCardioBlock['result'] {
  if (!state.hasResult) return null

  return {
    actualDurationSeconds: state.resultData.actualDurationSeconds ?? 0,
    distanceMeters: state.resultData.distanceMeters ?? null,
    avgPaceSecondsPerKm: state.resultData.avgPaceSecondsPerKm ?? null,
    calories: state.resultData.calories ?? null,
    notes: state.resultData.notes ?? null,
  }
}

export function parseCardioBlock(
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedCardioBlock> {
  const state: CardioBlockState = {
    activity: 'running',
    resultData: {},
    hasResult: false,
  }

  parseCardioFields(lines, state)

  return parseSuccess({
    kind: 'cardio',
    name,
    activity: state.activity,
    result: buildCardioResult(state),
  })
}

// ============================================
// Shared Helpers
// ============================================

function parseExerciseLine(line: string): ParsedBlockExercise | null {
  // - 10 × Kettlebell Swings @ 24kg
  const match = line.match(/^-\s*(\d+)\s*[x×]\s*(.+?)(?:\s*@\s*(.+))?$/i)
  if (!match?.[1] || !match[2]) return null

  return {
    name: match[2].trim(),
    prescribedReps: Number.parseInt(match[1], 10),
    load: match[3]?.trim() ?? null,
  }
}

function parseDurationString(str: string): number | null {
  // "45 min" or "45:30" or "1:30:00"
  return parseMinutesFormat(str) ?? parseTimeFormat(str)
}

function parseDurationToMs(str: string): number {
  // "10:32" -> ms
  const match = str.match(/^(\d+):(\d+)$/)
  if (match?.[1] && match[2]) {
    const mins = Number.parseInt(match[1], 10)
    const secs = Number.parseInt(match[2], 10)
    return (mins * 60 + secs) * 1000
  }
  return 0
}

function findContentStart(lines: ReadonlyArray<string>): number {
  // Skip past frontmatter
  let foundStart = false
  for (const [i, line] of lines.entries()) {
    if (line?.trim() === '---') {
      if (foundStart) return i + 1
      foundStart = true
    }
  }
  return 0
}
