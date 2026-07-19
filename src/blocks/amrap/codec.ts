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
import type { ParseResult, ParsedBlockExercise } from '../shared/markdown'
import {
  formatDurationMs,
  formatExerciseLine,
  getBlockDisplayName,
  parseDurationToMs,
  parseExerciseLine,
  parseSuccess,
} from '../shared/markdown'
import type {
  AmrapBlock,
  AmrapResult,
  DbAmrapBlock,
  DbAmrapConfig,
  DbAmrapResult,
  DbTemplateAmrapBlock,
  ParsedAmrapBlock,
} from './types'

const DURATION_PATTERN = /^duration:\s*(\d+)\s*min/i
const RESULT_PATTERN = /\*\*result:\*\*\s*(\d+)\s*rounds?\s*\+\s*(\d+)\s*reps?\s*\(([^)]+)\)/i

// ============================================
// Import-Validation Schemas
// ============================================

const dbAmrapConfigSchema = schemaFor<DbAmrapConfig>()(
  z
    .object({
      durationSeconds: z.number().int().min(1).max(7200), // max 2 hours
    })
    .strict(),
)

const dbAmrapResultSchema = schemaFor<DbAmrapResult>()(
  z
    .object({
      rounds: z.number().int().min(0),
      partialReps: z.number().int().min(0),
      actualDuration: z.number().int().min(0),
    })
    .strict(),
)

/**
 * DbAmrapBlock schema matching the DbAmrapBlock type.
 */
export const dbAmrapBlockSchema = schemaFor<DbAmrapBlock>()(
  z
    .object({
      kind: z.literal('amrap'),
      id: safeIdSchema,
      config: dbAmrapConfigSchema,
      exercises: z.array(dbBlockExerciseSchema).max(20),
      result: dbAmrapResultSchema.nullable(),
      orderIndex: z.number().int().min(0),
    })
    .strict(),
)

/**
 * DbTemplateAmrapBlock schema matching the DbTemplateAmrapBlock type.
 */
export const dbTemplateAmrapBlockSchema = schemaFor<DbTemplateAmrapBlock>()(
  z
    .object({
      kind: z.literal('amrap'),
      config: dbAmrapConfigSchema,
      exercises: z.array(dbTemplateBlockExerciseSchema).max(20),
    })
    .strict(),
)

function amrapResultToDatabase(result: Readonly<AmrapResult>): DbAmrapResult {
  return {
    rounds: result.rounds,
    partialReps: result.partialReps,
    actualDuration: result.actualDuration,
  }
}

function databaseToAmrapResult(databaseResult: Readonly<DbAmrapResult>): AmrapResult {
  return {
    rounds: databaseResult.rounds,
    partialReps: databaseResult.partialReps,
    actualDuration: databaseResult.actualDuration,
  }
}

function amrapBlockToDatabase(block: Readonly<AmrapBlock>, orderIndex: number): DbAmrapBlock {
  return {
    kind: 'amrap',
    id: String(block.id),
    config: {
      durationSeconds: block.config.durationSeconds,
    },
    exercises: block.exercises.map(blockExerciseToDatabase),
    result: block.result ? amrapResultToDatabase(block.result) : null,
    orderIndex,
  }
}

function databaseToAmrapBlock(databaseBlock: Readonly<DbAmrapBlock>, index: number): AmrapBlock {
  return {
    kind: 'amrap',
    id: index + 1,
    config: {
      durationSeconds: databaseBlock.config.durationSeconds,
    },
    exercises: databaseBlock.exercises.map(databaseToBlockExercise),
    result: databaseBlock.result ? databaseToAmrapResult(databaseBlock.result) : null,
  }
}

// ============================================
// Template Conversion
// ============================================

function amrapBlockToTemplate(block: Readonly<DbAmrapBlock>): DbTemplateAmrapBlock {
  return {
    kind: 'amrap',
    config: block.config,
    exercises: block.exercises.map(blockExerciseToTemplate),
  }
}

function templateToAmrapBlock(
  templateBlock: Readonly<DbTemplateAmrapBlock>,
  context: TemplateInstantiationContext,
): DbAmrapBlock {
  return {
    kind: 'amrap',
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

function formatAmrapBlock(block: DbAmrapBlock): string {
  const lines: Array<string> = []

  // Header - use block name if exercises exist, else generic
  const name = getBlockDisplayName(block.exercises, 'AMRAP')
  lines.push(`## ${name} (AMRAP)`)

  // Duration
  const minutes = Math.floor(block.config.durationSeconds / 60)
  lines.push(`Duration: ${minutes} min`, '')

  // Exercises
  for (const ex of block.exercises) {
    lines.push(formatExerciseLine(ex))
  }

  // Result
  if (block.result) {
    lines.push('')
    const duration = formatDurationMs(block.result.actualDuration)
    lines.push(
      `**Result:** ${block.result.rounds} rounds + ${block.result.partialReps} reps (${duration})`,
    )
  }

  return lines.join('\n')
}

function parseAmrapBlock(
  name: string,
  lines: ReadonlyArray<string>,
): ParseResult<ParsedAmrapBlock> {
  let durationSeconds = 600 // default 10 min
  const exercises: Array<ParsedBlockExercise> = []
  let result: ParsedAmrapBlock['result'] = null

  for (const line of lines) {
    // Duration
    const durationMatch = line.match(DURATION_PATTERN)
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
    const resultMatch = line.match(RESULT_PATTERN)
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

export const amrapCodec: BlockCodec<'amrap'> = {
  toDb: amrapBlockToDatabase,
  fromDb: databaseToAmrapBlock,
  toTemplate: amrapBlockToTemplate,
  fromTemplate: templateToAmrapBlock,
  formatMarkdown: formatAmrapBlock,
  parseMarkdown: parseAmrapBlock,
}
