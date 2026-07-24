/**
 * Kind-neutral workout block creation.
 *
 * Per-kind creators live in `src/blocks/<kind>/create.ts`; this module owns
 * the source unions and the exhaustive per-kind dispatch maps (mapped over
 * the kind unions so a new kind is a compile error here, mirroring
 * `BLOCK_CODECS`).
 */

import type { BlockByKind, BlockKind, TimedBlock, TimedBlockKind, WorkoutBlock } from './types'
import type { BlockExercise } from './shared/types'
import type { AmrapConfig } from './amrap/types'
import type { CardioConfig } from './cardio/types'
import type { EmomConfig } from './emom/types'
import type { ForTimeConfig } from './fortime/types'
import type { TabataConfig } from './tabata/types'
import type { HistoryStrengthBlockSource, TemplateStrengthBlockSource } from './strength/create'
import { createStrengthBlockFromHistory, createStrengthBlockFromTemplate } from './strength/create'
import { createAmrapWorkoutBlock } from './amrap/create'
import { createEmomWorkoutBlock } from './emom/create'
import { createTabataWorkoutBlock } from './tabata/create'
import { createForTimeWorkoutBlock } from './fortime/create'
import { createCardioWorkoutBlock } from './cardio/create'

type TimedBlockInput =
  | { kind: 'amrap'; config: AmrapConfig; exercises: ReadonlyArray<BlockExercise> }
  | { kind: 'emom'; config: EmomConfig; exercises: ReadonlyArray<BlockExercise> }
  | { kind: 'tabata'; config: TabataConfig; exercise: BlockExercise }
  | { kind: 'fortime'; config: ForTimeConfig; exercises: ReadonlyArray<BlockExercise> }

type TemplateBlockExerciseSource = {
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  load: string | null
  image: Blob | null
}

type HistoryBlockExerciseSource = {
  id: string
  name: string
  prescribedReps: number
  load: string | null
  image: Blob | null
}

type TemplateWorkoutBlockSource =
  | TemplateStrengthBlockSource
  | { kind: 'amrap'; config: AmrapConfig; exercises: ReadonlyArray<TemplateBlockExerciseSource> }
  | { kind: 'emom'; config: EmomConfig; exercises: ReadonlyArray<TemplateBlockExerciseSource> }
  | { kind: 'tabata'; config: TabataConfig; exercise: TemplateBlockExerciseSource }
  | {
      kind: 'fortime'
      config: ForTimeConfig
      exercises: ReadonlyArray<TemplateBlockExerciseSource>
    }
  | { kind: 'cardio'; config: CardioConfig }

type HistoryWorkoutBlockSource =
  | HistoryStrengthBlockSource
  | { kind: 'amrap'; config: AmrapConfig; exercises: ReadonlyArray<HistoryBlockExerciseSource> }
  | { kind: 'emom'; config: EmomConfig; exercises: ReadonlyArray<HistoryBlockExerciseSource> }
  | { kind: 'tabata'; config: TabataConfig; exercise: HistoryBlockExerciseSource }
  | { kind: 'fortime'; config: ForTimeConfig; exercises: ReadonlyArray<HistoryBlockExerciseSource> }
  | { kind: 'cardio'; config: CardioConfig }

type TimedBlockInputByKind = {
  [K in TimedBlockKind]: Extract<TimedBlockInput, { kind: K }>
}

type TemplateSourceByKind = {
  [K in BlockKind]: Extract<TemplateWorkoutBlockSource, { kind: K }>
}

type HistorySourceByKind = {
  [K in BlockKind]: Extract<HistoryWorkoutBlockSource, { kind: K }>
}

function convertTemplateBlockExercise(exercise: TemplateBlockExerciseSource): BlockExercise {
  return buildBlockExercise(exercise.exerciseDefinitionId ?? crypto.randomUUID(), exercise)
}

function convertHistoryBlockExercise(exercise: HistoryBlockExerciseSource): BlockExercise {
  return buildBlockExercise(exercise.id, exercise)
}

function buildBlockExercise(
  id: string,
  exercise: { name: string; prescribedReps: number; load: string | null; image: Blob | null },
): BlockExercise {
  return {
    id,
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    image: exercise.image,
  }
}

const CREATE_TIMED_BLOCK: {
  [K in TimedBlockKind]: (input: TimedBlockInputByKind[K], id: number) => BlockByKind[K]
} = {
  amrap: (input, id) => createAmrapWorkoutBlock(input.config, input.exercises, id),
  emom: (input, id) => createEmomWorkoutBlock(input.config, input.exercises, id),
  tabata: (input, id) => createTabataWorkoutBlock(input.config, input.exercise, id),
  fortime: (input, id) => createForTimeWorkoutBlock(input.config, input.exercises, id),
}

const CREATE_FROM_TEMPLATE: {
  [K in BlockKind]: (source: TemplateSourceByKind[K], id: number) => BlockByKind[K]
} = {
  strength: createStrengthBlockFromTemplate,
  amrap: (source, id) =>
    createAmrapWorkoutBlock(source.config, source.exercises.map(convertTemplateBlockExercise), id),
  emom: (source, id) =>
    createEmomWorkoutBlock(source.config, source.exercises.map(convertTemplateBlockExercise), id),
  tabata: (source, id) =>
    createTabataWorkoutBlock(source.config, convertTemplateBlockExercise(source.exercise), id),
  fortime: (source, id) =>
    createForTimeWorkoutBlock(
      source.config,
      source.exercises.map(convertTemplateBlockExercise),
      id,
    ),
  cardio: (source, id) => createCardioWorkoutBlock(source.config, id),
}

const CREATE_FROM_HISTORY: {
  [K in BlockKind]: (source: HistorySourceByKind[K], id: number) => BlockByKind[K]
} = {
  strength: createStrengthBlockFromHistory,
  amrap: (source, id) =>
    createAmrapWorkoutBlock(source.config, source.exercises.map(convertHistoryBlockExercise), id),
  emom: (source, id) =>
    createEmomWorkoutBlock(source.config, source.exercises.map(convertHistoryBlockExercise), id),
  tabata: (source, id) =>
    createTabataWorkoutBlock(source.config, convertHistoryBlockExercise(source.exercise), id),
  fortime: (source, id) =>
    createForTimeWorkoutBlock(source.config, source.exercises.map(convertHistoryBlockExercise), id),
  cardio: (source, id) => createCardioWorkoutBlock(source.config, id),
}

/**
 * Create a timed workout block from user-configured input.
 * Generic indexed-access dispatch keeps this cast-free (see `blockToDatabase`).
 */
export function createTimedWorkoutBlock<K extends TimedBlockKind>(
  input: TimedBlockInputByKind[K],
  id: number,
): TimedBlock {
  const kind: K = input.kind
  return CREATE_TIMED_BLOCK[kind](input, id)
}

/**
 * Instantiate an in-memory workout block from a template block. Exercises
 * without an exercise-catalog link receive a fresh UUID.
 */
export function createWorkoutBlockFromTemplate<K extends BlockKind>(
  block: TemplateSourceByKind[K],
  id: number,
): WorkoutBlock {
  const kind: K = block.kind
  return CREATE_FROM_TEMPLATE[kind](block, id)
}

/**
 * Instantiate an in-memory workout block from a completed workout in history.
 * Exercise ids and set values are preserved verbatim.
 */
export function createWorkoutBlockFromHistory<K extends BlockKind>(
  block: HistorySourceByKind[K],
  id: number,
): WorkoutBlock {
  const kind: K = block.kind
  return CREATE_FROM_HISTORY[kind](block, id)
}
