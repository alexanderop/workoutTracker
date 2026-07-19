import { z } from 'zod'
import type { BlockCodec, TemplateInstantiationContext } from '../types'
import { safeIdSchema } from '../shared/schemaPrimitives'
import { schemaFor } from '../shared/schemaFor'
import type { FieldParser, ParseResult } from '../shared/markdown'
import {
  createFieldParserLoop,
  formatDuration,
  parseDurationString,
  parseSuccess,
} from '../shared/markdown'
import type {
  CardioBlock,
  CardioResult,
  DbCardioBlock,
  DbCardioConfig,
  DbCardioResult,
  DbTemplateCardioBlock,
  ParsedCardioBlock,
} from './types'
import { CARDIO_ACTIVITY_VALUES } from './types'

const ACTIVITY_PATTERN = /^activity:\s*(\w+)/i
const DURATION_PATTERN = /-\s*duration:\s*(.+)/i
const DISTANCE_PATTERN = /-\s*distance:\s*([\d.]+)\s*km/i
const PACE_PATTERN = /-\s*pace:\s*(\d+):(\d+)\s*\/km/i
const CALORIES_PATTERN = /-\s*calories:\s*(\d+)/i
const NOTES_PATTERN = /^notes:\s*(.+)/i

// ============================================
// Import-Validation Schemas
// ============================================

const dbCardioActivitySchema = z.enum(CARDIO_ACTIVITY_VALUES)

const dbCardioConfigSchema = schemaFor<DbCardioConfig>()(
  z
    .object({
      activity: dbCardioActivitySchema,
      targetDurationSeconds: z.number().int().min(1).max(36_000).nullable(), // max 10 hours
      targetDistanceMeters: z.number().int().min(1).max(1_000_000).nullable(), // max 1000km
    })
    .strict(),
)

const dbCardioResultSchema = schemaFor<DbCardioResult>()(
  z
    .object({
      actualDurationSeconds: z.number().int().min(0),
      distanceMeters: z.number().int().min(0).nullable(),
      avgPaceSecondsPerKm: z.number().int().min(0).nullable(),
      calories: z.number().int().min(0).nullable(),
      notes: z.string().max(1000).nullable(),
    })
    .strict(),
)

/**
 * DbCardioBlock schema matching the DbCardioBlock type.
 */
export const dbCardioBlockSchema = schemaFor<DbCardioBlock>()(
  z
    .object({
      kind: z.literal('cardio'),
      id: safeIdSchema,
      config: dbCardioConfigSchema,
      result: dbCardioResultSchema.nullable(),
      orderIndex: z.number().int().min(0),
    })
    .strict(),
)

/**
 * DbTemplateCardioBlock schema matching the DbTemplateCardioBlock type.
 */
export const dbTemplateCardioBlockSchema = schemaFor<DbTemplateCardioBlock>()(
  z
    .object({
      kind: z.literal('cardio'),
      config: dbCardioConfigSchema,
    })
    .strict(),
)

function cardioResultToDatabase(result: Readonly<CardioResult>): DbCardioResult {
  return {
    actualDurationSeconds: result.actualDurationSeconds,
    distanceMeters: result.distanceMeters,
    avgPaceSecondsPerKm: result.avgPaceSecondsPerKm,
    calories: result.calories,
    notes: result.notes,
  }
}

function databaseToCardioResult(databaseResult: Readonly<DbCardioResult>): CardioResult {
  return {
    actualDurationSeconds: databaseResult.actualDurationSeconds,
    distanceMeters: databaseResult.distanceMeters,
    avgPaceSecondsPerKm: databaseResult.avgPaceSecondsPerKm,
    calories: databaseResult.calories,
    notes: databaseResult.notes,
  }
}

function cardioBlockToDatabase(block: Readonly<CardioBlock>, orderIndex: number): DbCardioBlock {
  return {
    kind: 'cardio',
    id: String(block.id),
    config: {
      activity: block.config.activity,
      targetDurationSeconds: block.config.targetDurationSeconds,
      targetDistanceMeters: block.config.targetDistanceMeters,
    },
    result: block.result ? cardioResultToDatabase(block.result) : null,
    orderIndex,
  }
}

function databaseToCardioBlock(databaseBlock: Readonly<DbCardioBlock>, index: number): CardioBlock {
  return {
    kind: 'cardio',
    id: index + 1,
    config: {
      activity: databaseBlock.config.activity,
      targetDurationSeconds: databaseBlock.config.targetDurationSeconds,
      targetDistanceMeters: databaseBlock.config.targetDistanceMeters,
    },
    result: databaseBlock.result ? databaseToCardioResult(databaseBlock.result) : null,
  }
}

// ============================================
// Template Conversion
// ============================================

function cardioBlockToTemplate(block: Readonly<DbCardioBlock>): DbTemplateCardioBlock {
  return {
    kind: 'cardio',
    config: block.config,
  }
}

function templateToCardioBlock(
  templateBlock: Readonly<DbTemplateCardioBlock>,
  context: TemplateInstantiationContext,
): DbCardioBlock {
  return {
    kind: 'cardio',
    id: context.generateId(),
    config: templateBlock.config,
    result: null,
    orderIndex: context.orderIndex,
  }
}

// ============================================
// Markdown Codec (spec v1)
// ============================================

function formatCardioBlock(block: DbCardioBlock): string {
  const lines: Array<string> = []

  const activityName = capitalizeFirst(block.config.activity)
  lines.push(`## ${activityName} (Cardio)`, `Activity: ${block.config.activity}`)

  if (block.result) {
    lines.push('', '**Result:**')

    if (block.result.actualDurationSeconds) {
      lines.push(`- Duration: ${formatDuration(block.result.actualDurationSeconds)}`)
    }
    if (block.result.distanceMeters) {
      const km = (block.result.distanceMeters / 1000).toFixed(1)
      lines.push(`- Distance: ${km} km`)
    }
    if (block.result.avgPaceSecondsPerKm) {
      lines.push(`- Pace: ${formatPace(block.result.avgPaceSecondsPerKm)} /km`)
    }
    if (block.result.calories) {
      lines.push(`- Calories: ${block.result.calories}`)
    }
    if (block.result.notes) {
      lines.push('', `Notes: ${block.result.notes}`)
    }
  }

  return lines.join('\n')
}

function formatPace(secondsPerKm: number): string {
  const mins = Math.floor(secondsPerKm / 60)
  const secs = Math.floor(secondsPerKm % 60)
  return `${mins}:${String(secs).padStart(2, '0')}`
}

function capitalizeFirst(string_: string): string {
  return string_.charAt(0).toUpperCase() + string_.slice(1)
}

interface CardioBlockState {
  activity: string
  resultData: Partial<NonNullable<ParsedCardioBlock['result']>>
  hasResult: boolean
}

const parseCardioActivity: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(ACTIVITY_PATTERN)
  if (match?.[1]) {
    state.activity = match[1].toLowerCase()
    return true
  }
  return false
}

const parseCardioDuration: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(DURATION_PATTERN)
  if (match?.[1]) {
    state.resultData.actualDurationSeconds = parseDurationString(match[1].trim()) ?? 0
    state.hasResult = true
    return true
  }
  return false
}

const parseCardioDistance: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(DISTANCE_PATTERN)
  if (match?.[1]) {
    state.resultData.distanceMeters = Number.parseFloat(match[1]) * 1000
    state.hasResult = true
    return true
  }
  return false
}

const parseCardioPace: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(PACE_PATTERN)
  if (match?.[1] && match[2]) {
    state.resultData.avgPaceSecondsPerKm =
      Number.parseInt(match[1], 10) * 60 + Number.parseInt(match[2], 10)
    state.hasResult = true
    return true
  }
  return false
}

const parseCardioCalories: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(CALORIES_PATTERN)
  if (match?.[1]) {
    state.resultData.calories = Number.parseInt(match[1], 10)
    state.hasResult = true
    return true
  }
  return false
}

const parseCardioNotes: FieldParser<CardioBlockState> = (line, state) => {
  const match = line.match(NOTES_PATTERN)
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

function parseCardioBlock(
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

export const cardioCodec: BlockCodec<'cardio'> = {
  toDb: cardioBlockToDatabase,
  fromDb: databaseToCardioBlock,
  toTemplate: cardioBlockToTemplate,
  fromTemplate: templateToCardioBlock,
  formatMarkdown: formatCardioBlock,
  parseMarkdown: parseCardioBlock,
}
