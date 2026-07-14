/**
 * Block unions and the Block Codec contract.
 *
 * Per-kind types live in `src/blocks/<kind>/types.ts`; this module composes
 * them into the discriminated unions and defines the codec shape every kind
 * implements (see ADR 002: Per-Kind Block Codecs).
 */

import type { ParseResult } from './shared/markdown'
import type {
  DbStrengthBlock,
  DbTemplateStrengthBlock,
  ParsedStrengthBlock,
  StrengthBlock,
} from './strength/types'
import type {
  AmrapBlock,
  AmrapResult,
  DbAmrapBlock,
  DbTemplateAmrapBlock,
  ParsedAmrapBlock,
} from './amrap/types'
import type {
  DbEmomBlock,
  DbTemplateEmomBlock,
  EmomBlock,
  EmomResult,
  ParsedEmomBlock,
} from './emom/types'
import type {
  DbTabataBlock,
  DbTemplateTabataBlock,
  ParsedTabataBlock,
  TabataBlock,
  TabataResult,
} from './tabata/types'
import type {
  DbForTimeBlock,
  DbTemplateForTimeBlock,
  ForTimeBlock,
  ForTimeResult,
  ParsedForTimeBlock,
} from './fortime/types'
import type {
  CardioBlock,
  DbCardioBlock,
  DbTemplateCardioBlock,
  ParsedCardioBlock,
} from './cardio/types'

// ============================================
// Discriminated Unions
// ============================================

export type TimedBlock = EmomBlock | AmrapBlock | TabataBlock | ForTimeBlock

export type WorkoutBlock = StrengthBlock | TimedBlock | CardioBlock

type DbTimedBlock = DbEmomBlock | DbAmrapBlock | DbTabataBlock | DbForTimeBlock

export type DbWorkoutBlock = DbStrengthBlock | DbTimedBlock | DbCardioBlock

export type DbTemplateBlock =
  | DbTemplateStrengthBlock
  | DbTemplateEmomBlock
  | DbTemplateAmrapBlock
  | DbTemplateTabataBlock
  | DbTemplateForTimeBlock
  | DbTemplateCardioBlock

/**
 * Union type for all timed block results
 * @public - Used by isTimedBlockResult() type guard
 */
export type TimedBlockResult = AmrapResult | EmomResult | TabataResult | ForTimeResult

// ============================================
// Kind Helpers
// ============================================

export type BlockKind = WorkoutBlock['kind']

export type TimedBlockKind = TimedBlock['kind']

export type BlockByKind = {
  [K in BlockKind]: Extract<WorkoutBlock, { kind: K }>
}

export type DbBlockByKind = {
  [K in BlockKind]: Extract<DbWorkoutBlock, { kind: K }>
}

export type DbTemplateBlockByKind = {
  [K in BlockKind]: Extract<DbTemplateBlock, { kind: K }>
}

/**
 * Union of the per-kind markdown parse intermediates (spec v1).
 * Exercise-catalog resolution happens in the import orchestrator, not here.
 */
export type ParsedBlock =
  | ParsedStrengthBlock
  | ParsedAmrapBlock
  | ParsedEmomBlock
  | ParsedTabataBlock
  | ParsedForTimeBlock
  | ParsedCardioBlock

export type ParsedBlockByKind = {
  [K in BlockKind]: Extract<ParsedBlock, { kind: K }>
}

// ============================================
// Block Codec Contract
// ============================================

/**
 * Injected effects for template instantiation: ID generation lives in the
 * database layer (`src/db`), which `src/blocks` must not import.
 */
export type TemplateInstantiationContext = {
  orderIndex: number
  generateId: () => string
}

/**
 * The per-kind representation mappings. Every kind implements this contract;
 * the registry (`src/blocks/registry.ts`) enforces exhaustive coverage.
 */
export type BlockCodec<K extends BlockKind> = {
  toDb: (block: Readonly<BlockByKind[K]>, orderIndex: number) => DbBlockByKind[K]
  fromDb: (databaseBlock: Readonly<DbBlockByKind[K]>, index: number) => BlockByKind[K]
  /** Extracts the kind's reusable template shape from a stored workout block. */
  toTemplate: (block: Readonly<DbBlockByKind[K]>) => DbTemplateBlockByKind[K]
  /** Instantiates a fresh stored workout block from a template block. */
  fromTemplate: (
    templateBlock: Readonly<DbTemplateBlockByKind[K]>,
    context: TemplateInstantiationContext,
  ) => DbBlockByKind[K]
  /** Formats the kind's Db block into its markdown section (lossy, spec v1). */
  formatMarkdown: (block: Readonly<DbBlockByKind[K]>) => string
  /** Parses a markdown section body into the kind's Parsed intermediate. */
  parseMarkdown: (name: string, lines: ReadonlyArray<string>) => ParseResult<ParsedBlockByKind[K]>
}

// ============================================
// Display Metadata
// ============================================

export type BlockColor = {
  bg: string
  text: string
  accent: string
}

/**
 * Per-kind display metadata. Deliberately off the codec — codecs own
 * representation, not presentation (ADR 002).
 */
export type BlockMeta = {
  label: string
  icon: string
  color: BlockColor
}
