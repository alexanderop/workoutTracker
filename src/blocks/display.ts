/**
 * Kind-neutral block display helpers.
 *
 * Display metadata is deliberately separate from the Block Codecs — codecs own
 * representation, not presentation (ADR 002). The per-kind values live in
 * `src/blocks/<kind>/meta.ts`; the maps here are derived from `BLOCK_META`
 * and kept as exports for existing importers.
 */

import { BLOCK_META } from './registry'
import type { BlockExercise } from './shared/types'
import type { BlockColor, BlockKind, BlockMeta, TimedBlock, WorkoutBlock } from './types'
import type { CardioActivity } from './cardio/types'
import { CARDIO_ACTIVITY_VALUES } from './cardio/types'

type CardioActivityDisplay = {
  label: string
  supportsDistance: boolean
  distanceUnit: 'km' | 'laps' | null
}

/**
 * Display attributes per activity, keyed by the `CARDIO_ACTIVITY_VALUES`
 * tuple in `src/blocks/cardio/types.ts` — a new activity fails compilation
 * here until it gets a label.
 */
const CARDIO_ACTIVITY_DISPLAY: Record<CardioActivity, CardioActivityDisplay> = {
  running: { label: 'Running', supportsDistance: true, distanceUnit: 'km' },
  cycling: { label: 'Cycling', supportsDistance: true, distanceUnit: 'km' },
  rowing: { label: 'Rowing', supportsDistance: true, distanceUnit: 'km' },
  elliptical: { label: 'Elliptical', supportsDistance: false, distanceUnit: null },
  swimming: { label: 'Swimming', supportsDistance: true, distanceUnit: 'laps' },
  stairclimber: { label: 'Stair Climber', supportsDistance: false, distanceUnit: null },
  walking: { label: 'Walking', supportsDistance: true, distanceUnit: 'km' },
}

export const CARDIO_ACTIVITIES: ReadonlyArray<{ value: CardioActivity } & CardioActivityDisplay> =
  CARDIO_ACTIVITY_VALUES.map((value) => ({ value, ...CARDIO_ACTIVITY_DISPLAY[value] }))

function mapBlockMeta<T>(pick: (meta: BlockMeta) => T): Record<BlockKind, T> {
  return {
    strength: pick(BLOCK_META.strength),
    emom: pick(BLOCK_META.emom),
    amrap: pick(BLOCK_META.amrap),
    tabata: pick(BLOCK_META.tabata),
    fortime: pick(BLOCK_META.fortime),
    cardio: pick(BLOCK_META.cardio),
  }
}

export const BLOCK_LABELS: Record<BlockKind, string> = mapBlockMeta((meta) => meta.label)

export const BLOCK_ICONS: Record<BlockKind, string> = mapBlockMeta((meta) => meta.icon)

export const BLOCK_COLORS: Record<BlockKind, BlockColor> = mapBlockMeta((meta) => meta.color)

export function getBlockDurationDisplay(block: TimedBlock): string {
  switch (block.kind) {
    case 'emom': {
      return `${block.config.minutes} min`
    }
    case 'amrap': {
      return `${Math.floor(block.config.durationSeconds / 60)} min`
    }
    case 'tabata': {
      const totalSeconds =
        block.config.rounds * (block.config.workSeconds + block.config.restSeconds)
      return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
    }
    case 'fortime': {
      return block.config.timeCapSeconds
        ? `Cap: ${Math.floor(block.config.timeCapSeconds / 60)} min`
        : 'No cap'
    }
  }
}

export function getBlockExerciseList(block: TimedBlock): ReadonlyArray<BlockExercise> {
  if (block.kind === 'tabata') {
    return [block.exercise]
  }
  return block.exercises
}

/**
 * Get the image for a block, if it has one.
 */
export function getBlockImage(block: WorkoutBlock): Blob | null {
  if (block.kind === 'strength') {
    return block.image
  }
  return null
}

/**
 * Get the name to derive initials from for a block.
 */
export function getBlockName(block: WorkoutBlock): string {
  if (block.kind === 'strength') {
    return block.name
  }
  if (block.kind === 'cardio') {
    const activityInfo = CARDIO_ACTIVITIES.find((a) => a.value === block.config.activity)
    return activityInfo?.label ?? 'Cardio'
  }
  return BLOCK_LABELS[block.kind]
}
