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
  const firstLine = lines[0]?.trim()
  if (firstLine !== '---') {
    return singleError('Missing YAML frontmatter delimiter', 1)
  }

  // Find closing delimiter
  let endIndex = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') {
      endIndex = i
      break
    }
  }

  if (endIndex === -1) {
    return singleError('Missing closing YAML frontmatter delimiter')
  }

  const frontmatterLines = lines.slice(1, endIndex)
  const frontmatter: Record<string, string> = {}

  for (const line of frontmatterLines) {
    const match = line.match(/^(\w+):\s*(.+)$/)
    if (match?.[1] && match[2]) {
      frontmatter[match[1]] = match[2]
    }
  }

  // Validate format
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
// Metadata Parser
// ============================================

export function parseMetadata(lines: ReadonlyArray<string>): ParseResult<ParsedWorkoutMetadata> {
  let name = 'Imported Workout'
  let date: Date | null = null
  let durationSeconds: number | null = null
  let notes: string | null = null

  for (const line of lines) {
    // Parse H1 as workout name
    const h1Match = line.match(/^#\s+(.+)$/)
    if (h1Match?.[1]) {
      name = h1Match[1].trim()
      continue
    }

    // Parse date
    const dateMatch = line.match(/\*\*Date:\*\*\s*(.+)/)
    if (dateMatch?.[1]) {
      const parsed = new Date(dateMatch[1].trim())
      if (!Number.isNaN(parsed.getTime())) {
        date = parsed
      }
      continue
    }

    // Parse duration
    const durationMatch = line.match(/\*\*Duration:\*\*\s*(.+)/)
    if (durationMatch?.[1]) {
      durationSeconds = parseDurationString(durationMatch[1].trim())
      continue
    }

    // Parse notes
    const notesMatch = line.match(/\*\*Notes:\*\*\s*(.+)/)
    if (notesMatch?.[1]) {
      notes = notesMatch[1].trim()
      continue
    }

    // Stop at first H2 (start of blocks)
    if (line.startsWith('## ')) break
  }

  return parseSuccess({ name, date, durationSeconds, notes })
}

// ============================================
// Block Parser
// ============================================

export function parseBlocks(lines: ReadonlyArray<string>): ParseResult<ReadonlyArray<ParsedBlock>> {
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

export function parseBlock(lines: ReadonlyArray<string>): ParseResult<ParsedBlock> {
  const header = lines[0]
  if (!header) return singleError('Empty block section')

  // Extract block type from header: ## Name (Type)
  const headerMatch = header.match(/^##\s+(.+)\s+\((\w+)\)$/)
  if (!headerMatch?.[1] || !headerMatch[2]) {
    return singleError(`Invalid block header format: ${header}`)
  }

  const name = headerMatch[1].trim()
  const type = headerMatch[2].toLowerCase()

  switch (type) {
    case 'strength': {
      return parseStrengthBlock(name, lines.slice(1))
    }
    case 'amrap': {
      return parseAmrapBlock(name, lines.slice(1))
    }
    case 'emom': {
      return parseEmomBlock(name, lines.slice(1))
    }
    case 'tabata': {
      return parseTabataBlock(name, lines.slice(1))
    }
    case 'fortime': {
      return parseForTimeBlock(name, lines.slice(1))
    }
    case 'cardio': {
      return parseCardioBlock(name, lines.slice(1))
    }
    default: {
      return singleError(`Unknown block type: ${type}`)
    }
  }
}

// ============================================
// Strength Block Parser
// ============================================

export function parseStrengthBlock(
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedStrengthBlock> {
  let equipment = 'bodyweight'
  let targetReps: number | null = null
  const sets: Array<ParsedSet> = []

  let inTable = false

  for (const line of lines) {
    // Equipment
    const equipmentMatch = line.match(/^equipment:\s*(.+)$/i)
    if (equipmentMatch?.[1]) {
      equipment = equipmentMatch[1].trim().toLowerCase()
      continue
    }

    // Target reps
    const targetMatch = line.match(/^target:\s*(\d+)\s*reps?$/i)
    if (targetMatch?.[1]) {
      targetReps = Number.parseInt(targetMatch[1], 10)
      continue
    }

    // Table header detection
    if (line.includes('| Set |')) {
      inTable = true
      continue
    }

    // Skip table separator
    if (/^\|[\s|-]+\|$/.test(line)) {
      continue
    }

    // Parse table rows
    if (inTable && line.startsWith('|')) {
      const set = parseSetRow(line)
      if (set) sets.push(set)
    }
  }

  return parseSuccess({
    kind: 'strength',
    name,
    equipment,
    targetReps,
    sets,
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

export function parseEmomBlock(
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedEmomBlock> {
  let minutes = 10
  let rotation: 'each-minute' | 'full-round' = 'each-minute'
  const exercises: Array<ParsedBlockExercise> = []
  let result: ParsedEmomBlock['result'] = null

  for (const line of lines) {
    // Duration
    const durationMatch = line.match(/^duration:\s*(\d+)\s*min/i)
    if (durationMatch?.[1]) {
      minutes = Number.parseInt(durationMatch[1], 10)
      continue
    }

    // Rotation
    const rotationMatch = line.match(/^rotation:\s*(each-minute|full-round)/i)
    if (rotationMatch?.[1]) {
      const normalized = rotationMatch[1].toLowerCase()
      if (normalized === 'each-minute' || normalized === 'full-round') {
        rotation = normalized
      }
      continue
    }

    // Exercise
    const exercise = parseExerciseLine(line)
    if (exercise) {
      exercises.push(exercise)
      continue
    }

    // Result
    const resultMatch = line.match(/\*\*result:\*\*\s*(\d+)\/(\d+)\s*minutes/i)
    if (resultMatch?.[1]) {
      result = {
        completedMinutes: Number.parseInt(resultMatch[1], 10),
        missedMinutes: [], // Can't recover missed minutes from this format
      }
    }
  }

  return parseSuccess({
    kind: 'emom',
    name,
    minutes,
    rotation,
    exercises,
    result,
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

export function parseCardioBlock(
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedCardioBlock> {
  let activity = 'running'
  let result: ParsedCardioBlock['result'] = null

  const resultData: Partial<NonNullable<ParsedCardioBlock['result']>> = {}
  let hasResult = false

  for (const line of lines) {
    // Activity
    const activityMatch = line.match(/^activity:\s*(\w+)/i)
    if (activityMatch?.[1]) {
      activity = activityMatch[1].toLowerCase()
      continue
    }

    // Duration
    const durationMatch = line.match(/-\s*duration:\s*(.+)/i)
    if (durationMatch?.[1]) {
      resultData.actualDurationSeconds = parseDurationString(durationMatch[1].trim()) ?? 0
      hasResult = true
      continue
    }

    // Distance
    const distanceMatch = line.match(/-\s*distance:\s*([\d.]+)\s*km/i)
    if (distanceMatch?.[1]) {
      resultData.distanceMeters = Number.parseFloat(distanceMatch[1]) * 1000
      hasResult = true
      continue
    }

    // Pace
    const paceMatch = line.match(/-\s*pace:\s*(\d+):(\d+)\s*\/km/i)
    if (paceMatch?.[1] && paceMatch[2]) {
      resultData.avgPaceSecondsPerKm = Number.parseInt(paceMatch[1], 10) * 60 + Number.parseInt(paceMatch[2], 10)
      hasResult = true
      continue
    }

    // Calories
    const caloriesMatch = line.match(/-\s*calories:\s*(\d+)/i)
    if (caloriesMatch?.[1]) {
      resultData.calories = Number.parseInt(caloriesMatch[1], 10)
      hasResult = true
      continue
    }

    // Notes
    const notesMatch = line.match(/^notes:\s*(.+)/i)
    if (notesMatch?.[1]) {
      resultData.notes = notesMatch[1].trim()
      hasResult = true
    }
  }

  if (hasResult) {
    result = {
      actualDurationSeconds: resultData.actualDurationSeconds ?? 0,
      distanceMeters: resultData.distanceMeters ?? null,
      avgPaceSecondsPerKm: resultData.avgPaceSecondsPerKm ?? null,
      calories: resultData.calories ?? null,
      notes: resultData.notes ?? null,
    }
  }

  return parseSuccess({
    kind: 'cardio',
    name,
    activity,
    result,
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
  const minMatch = str.match(/^(\d+)\s*min/)
  if (minMatch?.[1]) {
    return Number.parseInt(minMatch[1], 10) * 60
  }

  const timeMatch = str.match(/^(\d+):(\d+)(?::(\d+))?$/)
  if (timeMatch?.[1] && timeMatch[2]) {
    const parts = [timeMatch[1], timeMatch[2], timeMatch[3]].filter(Boolean).map(Number)
    if (parts.length === 2) {
      // mm:ss
      return (parts[0] ?? 0) * 60 + (parts[1] ?? 0)
    }
    if (parts.length === 3) {
      // hh:mm:ss
      return (parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)
    }
  }

  return null
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
