/**
 * Block-based workout architecture types.
 *
 * Both bodybuilding and CrossFit workouts are modeled as a sequence of blocks.
 * Each block has a kind that determines its behavior and UI.
 *
 * Per-kind types, guards, and display helpers live in `src/blocks/` (ADR 002:
 * Per-Kind Block Codecs); this module re-exports them so existing import
 * paths keep working.
 */

export type { BlockExercise } from '@/blocks/shared/types'
export type { StrengthBlock } from '@/blocks/strength/types'
export type { AmrapBlock, AmrapConfig, AmrapResult } from '@/blocks/amrap/types'
export type { EmomBlock, EmomConfig, EmomResult } from '@/blocks/emom/types'
export type { TabataBlock, TabataConfig, TabataResult } from '@/blocks/tabata/types'
export type { ForTimeBlock, ForTimeConfig, ForTimeResult } from '@/blocks/fortime/types'
export type { CardioActivity, CardioBlock, CardioConfig, CardioResult } from '@/blocks/cardio/types'
export type { TimedBlock, TimedBlockKind, TimedBlockResult, WorkoutBlock } from '@/blocks/types'

export {
  isCardioBlock,
  isStrengthBlock,
  isTimedBlock,
  isTimedBlockResult,
  TimedBlockResultSchema,
} from '@/blocks/guards'

export {
  BLOCK_COLORS,
  BLOCK_ICONS,
  BLOCK_LABELS,
  CARDIO_ACTIVITIES,
  getBlockDurationDisplay,
  getBlockExerciseList,
  getBlockImage,
  getBlockName,
} from '@/blocks/display'

// ============================================
// Workout Mode
// ============================================

export type WorkoutMode = 'builder' | 'active' | 'completed'
