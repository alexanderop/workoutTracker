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
  DbForTimeBlock,
  DbForTimeConfig,
  DbForTimeResult,
  DbTemplateForTimeBlock,
  ForTimeBlock,
  ForTimeResult,
  ParsedForTimeBlock,
} from './types'

// ============================================
// Import-Validation Schemas
// ============================================

const dbForTimeConfigSchema = schemaFor<DbForTimeConfig>()(
  z
    .object({
      timeCapSeconds: z.number().int().min(1).max(7200).nullable(),
    })
    .strict(),
)

const nonNegativeNumberSchema = z.number().min(0)

const dbForTimeResultSchema = schemaFor<DbForTimeResult>()(
  z
    .object({
      completionTime: z.number().int().min(0),
      completed: z.boolean(),
      // Benchmark split times are fractional seconds (split comparison works
      // with a 0.1s tolerance), so no .int(). Optional WITHOUT .default() so
      // export/import round-trips stay absent-preserving.
      splitTimes: z.array(nonNegativeNumberSchema).max(100).optional(),
    })
    .strict(),
)

/**
 * DbForTimeBlock schema matching the DbForTimeBlock type.
 */
export const dbForTimeBlockSchema = schemaFor<DbForTimeBlock>()(
  z
    .object({
      kind: z.literal('fortime'),
      id: safeIdSchema,
      config: dbForTimeConfigSchema,
      exercises: z.array(dbBlockExerciseSchema).max(20),
      result: dbForTimeResultSchema.nullable(),
      orderIndex: z.number().int().min(0),
    })
    .strict(),
)

/**
 * DbTemplateForTimeBlock schema matching the DbTemplateForTimeBlock type.
 */
export const dbTemplateForTimeBlockSchema = schemaFor<DbTemplateForTimeBlock>()(
  z
    .object({
      kind: z.literal('fortime'),
      config: dbForTimeConfigSchema,
      exercises: z.array(dbTemplateBlockExerciseSchema).max(20),
    })
    .strict(),
)

function forTimeResultToDatabase(result: Readonly<ForTimeResult>): DbForTimeResult {
  return {
    completionTime: result.completionTime,
    completed: result.completed,
    splitTimes: result.splitTimes,
  }
}

function databaseToForTimeResult(databaseResult: Readonly<DbForTimeResult>): ForTimeResult {
  return {
    completionTime: databaseResult.completionTime,
    completed: databaseResult.completed,
    splitTimes: databaseResult.splitTimes,
  }
}

function forTimeBlockToDatabase(block: Readonly<ForTimeBlock>, orderIndex: number): DbForTimeBlock {
  return {
    kind: 'fortime',
    id: String(block.id),
    config: {
      timeCapSeconds: block.config.timeCapSeconds,
    },
    exercises: block.exercises.map(blockExerciseToDatabase),
    result: block.result ? forTimeResultToDatabase(block.result) : null,
    orderIndex,
  }
}

function databaseToForTimeBlock(
  databaseBlock: Readonly<DbForTimeBlock>,
  index: number,
): ForTimeBlock {
  return {
    kind: 'fortime',
    id: index + 1,
    config: {
      timeCapSeconds: databaseBlock.config.timeCapSeconds,
    },
    exercises: databaseBlock.exercises.map(databaseToBlockExercise),
    result: databaseBlock.result ? databaseToForTimeResult(databaseBlock.result) : null,
  }
}

// ============================================
// Template Conversion
// ============================================

function forTimeBlockToTemplate(block: Readonly<DbForTimeBlock>): DbTemplateForTimeBlock {
  return {
    kind: 'fortime',
    config: block.config,
    exercises: block.exercises.map(blockExerciseToTemplate),
  }
}

function templateToForTimeBlock(
  templateBlock: Readonly<DbTemplateForTimeBlock>,
  context: TemplateInstantiationContext,
): DbForTimeBlock {
  return {
    kind: 'fortime',
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

function formatForTimeBlock(block: DbForTimeBlock): string {
  const lines: Array<string> = []

  const name = getBlockDisplayName(block.exercises, 'For Time')
  lines.push(`## ${name} (ForTime)`)

  if (block.config.timeCapSeconds) {
    const minutes = Math.floor(block.config.timeCapSeconds / 60)
    lines.push(`Time cap: ${minutes} min`)
  }
  lines.push('')

  for (const ex of block.exercises) {
    lines.push(formatExerciseLine(ex))
  }

  if (block.result) {
    lines.push('')
    const time = formatDurationMs(block.result.completionTime)
    const check = block.result.completed ? ' \u{2713}' : ''
    lines.push(`**Result:** ${time}${check}`)
  }

  return lines.join('\n')
}

function parseForTimeBlock(
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
        completed: resultMatch[2] === '\u{2713}',
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

export const fortimeCodec: BlockCodec<'fortime'> = {
  toDb: forTimeBlockToDatabase,
  fromDb: databaseToForTimeBlock,
  toTemplate: forTimeBlockToTemplate,
  fromTemplate: templateToForTimeBlock,
  formatMarkdown: formatForTimeBlock,
  parseMarkdown: parseForTimeBlock,
}
