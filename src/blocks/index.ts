/**
 * Public surface of the block system (ADR 002: Per-Kind Block Codecs).
 *
 * External code imports from `@/blocks`; the per-kind folders and shared
 * modules are internal. The transitional compat barrels
 * (`src/types/blocks.ts`, parts of `src/db/schema.ts`,
 * `src/lib/workoutBlockFactory.ts`, `markdownSpec.ts`) keep their deep
 * imports until they are retired.
 */

// ============================================
// Registry: codec dispatch, display metadata, import-validation unions
// ============================================

export {
  BLOCK_CODECS,
  BLOCK_META,
  blockToDatabase,
  databaseToBlock,
  dbTemplateBlockSchema,
  dbWorkoutBlockSchema,
} from './registry'

// ============================================
// Unions, kind helpers, and the codec contract
// ============================================

export type {
  BlockByKind,
  BlockCodec,
  BlockColor,
  BlockKind,
  BlockMeta,
  DbBlockByKind,
  DbTemplateBlock,
  DbTemplateBlockByKind,
  DbWorkoutBlock,
  ParsedBlock,
  ParsedBlockByKind,
  TemplateInstantiationContext,
  TimedBlock,
  TimedBlockKind,
  TimedBlockResult,
  WorkoutBlock,
} from './types'

// ============================================
// Guards
// ============================================

export {
  isCardioBlock,
  isStrengthBlock,
  isTimedBlock,
  isTimedBlockResult,
  TimedBlockResultSchema,
} from './guards'

// ============================================
// Display helpers
// ============================================

export {
  BLOCK_COLORS,
  BLOCK_ICONS,
  BLOCK_LABELS,
  CARDIO_ACTIVITIES,
  getBlockDurationDisplay,
  getBlockExerciseList,
  getBlockImage,
  getBlockName,
} from './display'

// ============================================
// Block creation
// ============================================

export {
  createTimedWorkoutBlock,
  createWorkoutBlockFromHistory,
  createWorkoutBlockFromTemplate,
} from './create'
export { createAmrapWorkoutBlock } from './amrap/create'
export { createEmomWorkoutBlock } from './emom/create'
export { createTabataWorkoutBlock } from './tabata/create'
export { createForTimeWorkoutBlock } from './fortime/create'
export { createCardioWorkoutBlock } from './cardio/create'

// ============================================
// Shared exercise types and markdown/schema primitives
// ============================================

export type { BlockExercise, DbBlockExercise, DbTemplateBlockExercise } from './shared/types'
export type {
  FieldParser,
  ParsedBlockExercise,
  ParsedSet,
  ParseFailure,
  ParseResult,
  ParseSuccess,
} from './shared/markdown'
export {
  createFieldParserLoop,
  formatDuration,
  formatDurationMs,
  formatExerciseLine,
  getBlockDisplayName,
  parseDurationString,
  parseDurationToMs,
  parseExerciseLine,
  parseSuccess,
  singleError,
} from './shared/markdown'
export {
  equipmentSchema,
  safeIdSchema,
  safeStringSchema,
  timestampSchema,
} from './shared/schemaPrimitives'

// ============================================
// Per-kind types
// ============================================

export type {
  DbSet,
  DbStrengthBlock,
  DbTemplateStrengthBlock,
  ParsedStrengthBlock,
  Set,
  SetStatus,
  StrengthBlock,
} from './strength/types'
export type {
  AmrapBlock,
  AmrapConfig,
  AmrapResult,
  DbAmrapBlock,
  DbAmrapResult,
  DbTemplateAmrapBlock,
  ParsedAmrapBlock,
} from './amrap/types'
export type {
  DbEmomBlock,
  DbEmomResult,
  DbTemplateEmomBlock,
  EmomBlock,
  EmomConfig,
  EmomResult,
  ParsedEmomBlock,
} from './emom/types'
export type {
  DbTabataBlock,
  DbTabataResult,
  DbTemplateTabataBlock,
  ParsedTabataBlock,
  TabataBlock,
  TabataConfig,
  TabataResult,
} from './tabata/types'
export type {
  DbForTimeBlock,
  DbForTimeResult,
  DbTemplateForTimeBlock,
  ForTimeBlock,
  ForTimeConfig,
  ForTimeResult,
  ParsedForTimeBlock,
} from './fortime/types'
export { CARDIO_ACTIVITY_VALUES } from './cardio/types'
export type {
  CardioActivity,
  CardioBlock,
  CardioConfig,
  CardioResult,
  DbCardioBlock,
  DbCardioResult,
  DbTemplateCardioBlock,
  ParsedCardioBlock,
} from './cardio/types'
