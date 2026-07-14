import { z } from 'zod'
import type { BlockCodec, TemplateInstantiationContext } from '../types'
import {
  blockExerciseToDatabase,
  blockExerciseToTemplate,
  databaseToBlockExercise,
  templateExerciseToBlock,
} from '../shared/converters'
import { dbBlockExerciseSchema, dbTemplateBlockExerciseSchema } from '../shared/schemas'
import { safeIdSchema } from '../shared/schemaPrimitives'
import { schemaFor } from '../shared/schemaFor'
import type { ParseResult, ParsedBlockExercise } from '../shared/markdown'
import { formatExerciseLine, parseExerciseLine, parseSuccess } from '../shared/markdown'
import type {
  DbTabataBlock,
  DbTabataConfig,
  DbTabataResult,
  DbTemplateTabataBlock,
  ParsedTabataBlock,
  TabataBlock,
  TabataResult,
} from './types'

// ============================================
// Import-Validation Schemas
// ============================================

const dbTabataConfigSchema = schemaFor<DbTabataConfig>()(
  z
    .object({
      rounds: z.number().int().min(1).max(100),
      workSeconds: z.number().int().min(1).max(600),
      restSeconds: z.number().int().min(0).max(600),
    })
    .strict(),
)

const nonNegativeIntSchema = z.number().int().min(0)

const dbTabataResultSchema = schemaFor<DbTabataResult>()(
  z
    .object({
      repsPerRound: z.array(nonNegativeIntSchema).max(100),
    })
    .strict(),
)

/**
 * DbTabataBlock schema matching the DbTabataBlock type.
 */
export const dbTabataBlockSchema = schemaFor<DbTabataBlock>()(
  z
    .object({
      kind: z.literal('tabata'),
      id: safeIdSchema,
      config: dbTabataConfigSchema,
      exercise: dbBlockExerciseSchema,
      result: dbTabataResultSchema.nullable(),
      orderIndex: z.number().int().min(0),
    })
    .strict(),
)

/**
 * DbTemplateTabataBlock schema matching the DbTemplateTabataBlock type.
 */
export const dbTemplateTabataBlockSchema = schemaFor<DbTemplateTabataBlock>()(
  z
    .object({
      kind: z.literal('tabata'),
      config: dbTabataConfigSchema,
      exercise: dbTemplateBlockExerciseSchema,
    })
    .strict(),
)

function tabataResultToDatabase(result: Readonly<TabataResult>): DbTabataResult {
  return {
    repsPerRound: [...result.repsPerRound],
  }
}

function databaseToTabataResult(databaseResult: Readonly<DbTabataResult>): TabataResult {
  return {
    repsPerRound: [...databaseResult.repsPerRound],
  }
}

function tabataBlockToDatabase(block: Readonly<TabataBlock>, orderIndex: number): DbTabataBlock {
  return {
    kind: 'tabata',
    id: String(block.id),
    config: {
      rounds: block.config.rounds,
      workSeconds: block.config.workSeconds,
      restSeconds: block.config.restSeconds,
    },
    exercise: blockExerciseToDatabase(block.exercise),
    result: block.result ? tabataResultToDatabase(block.result) : null,
    orderIndex,
  }
}

function databaseToTabataBlock(databaseBlock: Readonly<DbTabataBlock>, index: number): TabataBlock {
  return {
    kind: 'tabata',
    id: index + 1,
    config: {
      rounds: databaseBlock.config.rounds,
      workSeconds: databaseBlock.config.workSeconds,
      restSeconds: databaseBlock.config.restSeconds,
    },
    exercise: databaseToBlockExercise(databaseBlock.exercise),
    result: databaseBlock.result ? databaseToTabataResult(databaseBlock.result) : null,
  }
}

// ============================================
// Template Conversion
// ============================================

function tabataBlockToTemplate(block: Readonly<DbTabataBlock>): DbTemplateTabataBlock {
  return {
    kind: 'tabata',
    config: block.config,
    exercise: blockExerciseToTemplate(block.exercise),
  }
}

function templateToTabataBlock(
  templateBlock: Readonly<DbTemplateTabataBlock>,
  context: TemplateInstantiationContext,
): DbTabataBlock {
  return {
    kind: 'tabata',
    id: context.generateId(),
    config: templateBlock.config,
    exercise: templateExerciseToBlock(templateBlock.exercise, context.generateId),
    result: null,
    orderIndex: context.orderIndex,
  }
}

// ============================================
// Markdown Codec (spec v1)
// ============================================

function formatTabataBlock(block: DbTabataBlock): string {
  const lines: Array<string> = []

  const name = block.exercise.name || 'Tabata'
  lines.push(
    `## ${name} (Tabata)`,
    `Rounds: ${block.config.rounds}`,
    `Work/Rest: ${block.config.workSeconds}s/${block.config.restSeconds}s`,
    '',
    formatExerciseLine(block.exercise),
  )

  if (block.result) {
    lines.push('')
    const reps = block.result.repsPerRound.join(', ')
    lines.push(`**Result:** ${reps} reps`)
  }

  return lines.join('\n')
}

function parseTabataBlock(
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

export const tabataCodec: BlockCodec<'tabata'> = {
  toDb: tabataBlockToDatabase,
  fromDb: databaseToTabataBlock,
  toTemplate: tabataBlockToTemplate,
  fromTemplate: templateToTabataBlock,
  formatMarkdown: formatTabataBlock,
  parseMarkdown: parseTabataBlock,
}
