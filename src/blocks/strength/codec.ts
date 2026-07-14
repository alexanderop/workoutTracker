import { z } from 'zod'
import type { BlockCodec, TemplateInstantiationContext } from '../types'
import {
  equipmentSchema,
  safeIdSchema,
  safeStringSchema,
  timestampSchema,
} from '../shared/schemaPrimitives'
import { schemaFor } from '../shared/schemaFor'
import type { FieldParser, ParseResult, ParsedSet } from '../shared/markdown'
import { createFieldParserLoop, parseSuccess } from '../shared/markdown'
import type {
  DbSet,
  DbStrengthBlock,
  DbTemplateStrengthBlock,
  ParsedStrengthBlock,
  Set,
  StrengthBlock,
} from './types'

// ============================================
// Import-Validation Schemas
// ============================================

/**
 * Set status matching the SetStatus type in ./types.
 */
const setStatusSchema = z.enum(['completed', 'active', 'planned'])

/**
 * DbSet schema matching the DbSet type.
 */
const dbSetSchema = schemaFor<DbSet>()(
  z
    .object({
      id: safeIdSchema,
      kg: z.string().max(20),
      reps: z.string().max(20),
      duration: z.string().max(20).optional().default(''),
      rir: z.string().max(20),
      status: setStatusSchema,
      completedAt: timestampSchema.nullable(),
    })
    .strict(),
)

// Base fields shared between DbStrengthBlock and DbTemplateStrengthBlock.
// DbStrengthBlock adds `id`, `sets`, `orderIndex`.
// DbTemplateStrengthBlock adds `defaultSetCount`.
const strengthBlockFieldsBase = {
  exerciseDefinitionId: safeIdSchema.nullable(),
  name: safeStringSchema.min(1).max(200),
  equipment: equipmentSchema,
  targetReps: z.number().int().min(0).max(1000),
  targetDuration: z.number().int().min(0).max(3600).nullable(), // seconds for isometric exercises
  targetWeight: z.number().min(0).max(1000).nullable(), // kg for weighted holds
  image: z.null(), // Blob can't be serialized to JSON, so always null in exports
}

/**
 * DbStrengthBlock schema matching the DbStrengthBlock type.
 */
export const dbStrengthBlockSchema = schemaFor<DbStrengthBlock>()(
  z
    .object({
      kind: z.literal('strength'),
      id: safeIdSchema,
      ...strengthBlockFieldsBase,
      sets: z.array(dbSetSchema).max(50),
      orderIndex: z.number().int().min(0),
    })
    .strict(),
)

/**
 * DbTemplateStrengthBlock schema matching the DbTemplateStrengthBlock type.
 */
export const dbTemplateStrengthBlockSchema = schemaFor<DbTemplateStrengthBlock>()(
  z
    .object({
      kind: z.literal('strength'),
      ...strengthBlockFieldsBase,
      defaultSetCount: z.number().int().min(1).max(20),
    })
    .strict(),
)

/**
 * Convert in-memory Set to database format.
 */
function setToDatabase(set: Readonly<Set>): DbSet {
  return {
    id: String(set.id),
    kg: set.kg,
    reps: set.reps,
    duration: set.duration,
    rir: set.rir,
    status: set.status,
    completedAt: set.status === 'completed' ? Date.now() : null,
  }
}

/**
 * Convert database Set to in-memory format.
 */
function databaseToSet(databaseSet: Readonly<DbSet>, index: number): Set {
  return {
    id: index + 1,
    kg: databaseSet.kg,
    reps: databaseSet.reps,
    duration: databaseSet.duration ?? '', // backward compatibility for pre-isometric data
    rir: databaseSet.rir,
    status: databaseSet.status,
  }
}

function strengthBlockToDatabase(
  block: Readonly<StrengthBlock>,
  orderIndex: number,
): DbStrengthBlock {
  return {
    kind: 'strength',
    id: String(block.id),
    exerciseDefinitionId: block.exerciseDefinitionId,
    name: block.name,
    equipment: block.equipment,
    targetReps: block.targetReps,
    targetDuration: block.targetDuration,
    targetWeight: block.targetWeight,
    sets: block.sets.map(setToDatabase),
    orderIndex,
    image: block.image,
  }
}

function databaseToStrengthBlock(
  databaseBlock: Readonly<DbStrengthBlock>,
  index: number,
): StrengthBlock {
  return {
    kind: 'strength',
    id: index + 1,
    exerciseDefinitionId: databaseBlock.exerciseDefinitionId,
    name: databaseBlock.name,
    equipment: databaseBlock.equipment,
    targetReps: databaseBlock.targetReps,
    targetDuration: databaseBlock.targetDuration,
    targetWeight: databaseBlock.targetWeight,
    sets: databaseBlock.sets.map(databaseToSet),
    image: databaseBlock.image,
  }
}

// ============================================
// Template Conversion
// ============================================

function strengthBlockToTemplate(block: Readonly<DbStrengthBlock>): DbTemplateStrengthBlock {
  return {
    kind: 'strength',
    exerciseDefinitionId: block.exerciseDefinitionId,
    name: block.name,
    equipment: block.equipment,
    targetReps: block.targetReps,
    targetDuration: block.targetDuration ?? null,
    targetWeight: block.targetWeight ?? null,
    defaultSetCount: block.sets.length,
    image: block.image,
  }
}

function templateToStrengthBlock(
  templateBlock: Readonly<DbTemplateStrengthBlock>,
  context: TemplateInstantiationContext,
): DbStrengthBlock {
  const sets: ReadonlyArray<DbSet> = Array.from(
    { length: templateBlock.defaultSetCount },
    (_, setIndex) => ({
      id: context.generateId(),
      kg: '',
      reps: '',
      duration: '',
      rir: '',
      status: setIndex === 0 ? 'active' : 'planned',
      completedAt: null,
    }),
  )

  return {
    kind: 'strength',
    id: context.generateId(),
    exerciseDefinitionId: templateBlock.exerciseDefinitionId,
    name: templateBlock.name,
    equipment: templateBlock.equipment,
    targetReps: templateBlock.targetReps,
    targetDuration: templateBlock.targetDuration ?? null,
    targetWeight: templateBlock.targetWeight ?? null,
    sets,
    orderIndex: context.orderIndex,
    image: templateBlock.image,
  }
}

// ============================================
// Markdown Codec (spec v1)
// ============================================

function formatStrengthBlock(block: DbStrengthBlock): string {
  const lines: Array<string> = [`## ${block.name} (Strength)`]

  // Header

  // Equipment
  if (block.equipment && block.equipment !== 'bodyweight') {
    lines.push(`Equipment: ${block.equipment}`)
  }

  // Target reps
  if (block.targetReps > 0) {
    lines.push(`Target: ${block.targetReps} reps`)
  }

  lines.push('', '| Set | Weight | Reps | RIR |', '|-----|--------|------|-----|')

  const completedSets = block.sets.filter((set) => !isSetEmpty(set))
  for (const [index, set] of completedSets.entries()) {
    lines.push(formatSetRow(set, index + 1))
  }

  return lines.join('\n')
}

function formatSetRow(set: DbSet, setNumber: number): string {
  const weight = set.kg ? `${set.kg}kg` : '-'
  const reps = set.reps || '-'
  const rir = set.rir || '-'
  return `| ${setNumber} | ${weight} | ${reps} | ${rir} |`
}

function isSetEmpty(set: DbSet): boolean {
  return !set.kg && !set.reps && !set.rir
}

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

function parseStrengthBlock(
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

function stripOuterPipes(value: string): string {
  const withoutLeading = value.startsWith('|') ? value.slice(1) : value
  return withoutLeading.endsWith('|') ? withoutLeading.slice(0, -1) : withoutLeading
}

function parseSetRow(line: string): ParsedSet | null {
  // | 1   | 80kg | 5    | 2   |
  // Position-preserving: strip only the outer pipes, keep empty cells. Markdown
  // written by older exporters left the RIR cell empty; filtering falsy cells
  // would silently drop the whole set row.
  const cells = stripOuterPipes(line.trim())
    .split('|')
    .map((c) => c.trim())
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

export const strengthCodec: BlockCodec<'strength'> = {
  toDb: strengthBlockToDatabase,
  fromDb: databaseToStrengthBlock,
  toTemplate: strengthBlockToTemplate,
  fromTemplate: templateToStrengthBlock,
  formatMarkdown: formatStrengthBlock,
  parseMarkdown: parseStrengthBlock,
}
