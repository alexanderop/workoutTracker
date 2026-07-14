import { z } from 'zod'
import type { BlockCodec, TemplateInstantiationContext } from '../types'
import {
  blockExerciseToDatabase,
  blockExerciseToTemplate,
  databaseToBlockExercise,
  templateExercisesToBlocks,
} from '../shared/converters'
import { dbBlockExerciseSchema, dbTemplateBlockExerciseSchema } from '../shared/schemas'
import { safeIdSchema } from '../shared/schemaPrimitives'
import { schemaFor } from '../shared/schemaFor'
import type { FieldParser, ParseResult, ParsedBlockExercise } from '../shared/markdown'
import {
  createFieldParserLoop,
  formatExerciseLine,
  getBlockDisplayName,
  parseExerciseLine,
  parseSuccess,
} from '../shared/markdown'
import type {
  DbEmomBlock,
  DbEmomConfig,
  DbEmomResult,
  DbTemplateEmomBlock,
  EmomBlock,
  EmomResult,
  ParsedEmomBlock,
} from './types'

// ============================================
// Import-Validation Schemas
// ============================================

/**
 * EMOM exercise rotation matching the DbEmomConfig type.
 */
const exerciseRotationSchema = z.enum(['each-minute', 'full-round'])

const dbEmomConfigSchema = schemaFor<DbEmomConfig>()(
  z
    .object({
      minutes: z.number().int().min(1).max(120),
      exerciseRotation: exerciseRotationSchema,
    })
    .strict(),
)

const nonNegativeIntSchema = z.number().int().min(0)

const dbEmomResultSchema = schemaFor<DbEmomResult>()(
  z
    .object({
      completedMinutes: z.number().int().min(0),
      missedMinutes: z.array(nonNegativeIntSchema).max(120),
    })
    .strict(),
)

/**
 * DbEmomBlock schema matching the DbEmomBlock type.
 */
export const dbEmomBlockSchema = schemaFor<DbEmomBlock>()(
  z
    .object({
      kind: z.literal('emom'),
      id: safeIdSchema,
      config: dbEmomConfigSchema,
      exercises: z.array(dbBlockExerciseSchema).max(20),
      result: dbEmomResultSchema.nullable(),
      orderIndex: z.number().int().min(0),
    })
    .strict(),
)

/**
 * DbTemplateEmomBlock schema matching the DbTemplateEmomBlock type.
 */
export const dbTemplateEmomBlockSchema = schemaFor<DbTemplateEmomBlock>()(
  z
    .object({
      kind: z.literal('emom'),
      config: dbEmomConfigSchema,
      exercises: z.array(dbTemplateBlockExerciseSchema).max(20),
    })
    .strict(),
)

function emomResultToDatabase(result: Readonly<EmomResult>): DbEmomResult {
  return {
    completedMinutes: result.completedMinutes,
    missedMinutes: [...result.missedMinutes],
  }
}

function databaseToEmomResult(databaseResult: Readonly<DbEmomResult>): EmomResult {
  return {
    completedMinutes: databaseResult.completedMinutes,
    missedMinutes: [...databaseResult.missedMinutes],
  }
}

function emomBlockToDatabase(block: Readonly<EmomBlock>, orderIndex: number): DbEmomBlock {
  return {
    kind: 'emom',
    id: String(block.id),
    config: {
      minutes: block.config.minutes,
      exerciseRotation: block.config.exerciseRotation,
    },
    exercises: block.exercises.map(blockExerciseToDatabase),
    result: block.result ? emomResultToDatabase(block.result) : null,
    orderIndex,
  }
}

function databaseToEmomBlock(databaseBlock: Readonly<DbEmomBlock>, index: number): EmomBlock {
  return {
    kind: 'emom',
    id: index + 1,
    config: {
      minutes: databaseBlock.config.minutes,
      exerciseRotation: databaseBlock.config.exerciseRotation,
    },
    exercises: databaseBlock.exercises.map(databaseToBlockExercise),
    result: databaseBlock.result ? databaseToEmomResult(databaseBlock.result) : null,
  }
}

// ============================================
// Template Conversion
// ============================================

function emomBlockToTemplate(block: Readonly<DbEmomBlock>): DbTemplateEmomBlock {
  return {
    kind: 'emom',
    config: block.config,
    exercises: block.exercises.map(blockExerciseToTemplate),
  }
}

function templateToEmomBlock(
  templateBlock: Readonly<DbTemplateEmomBlock>,
  context: TemplateInstantiationContext,
): DbEmomBlock {
  return {
    kind: 'emom',
    id: context.generateId(),
    config: templateBlock.config,
    exercises: templateExercisesToBlocks(templateBlock.exercises, context.generateId),
    result: null,
    orderIndex: context.orderIndex,
  }
}

// ============================================
// Markdown Codec (spec v1)
// ============================================

function formatEmomBlock(block: DbEmomBlock): string {
  const lines: Array<string> = []

  const name = getBlockDisplayName(block.exercises, 'EMOM')
  lines.push(
    `## ${name} (EMOM)`,
    `Duration: ${block.config.minutes} min`,
    `Rotation: ${block.config.exerciseRotation}`,
    '',
  )

  for (const ex of block.exercises) {
    lines.push(formatExerciseLine(ex))
  }

  if (block.result) {
    lines.push(
      '',
      `**Result:** ${block.result.completedMinutes}/${block.config.minutes} minutes completed`,
    )
  }

  return lines.join('\n')
}

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

function parseEmomBlock(name: string, lines: ReadonlyArray<string>): ParseResult<ParsedEmomBlock> {
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

export const emomCodec: BlockCodec<'emom'> = {
  toDb: emomBlockToDatabase,
  fromDb: databaseToEmomBlock,
  toTemplate: emomBlockToTemplate,
  fromTemplate: templateToEmomBlock,
  formatMarkdown: formatEmomBlock,
  parseMarkdown: parseEmomBlock,
}
