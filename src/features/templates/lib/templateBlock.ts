import { popularExercises } from '@/data/popularExercises'
import type { Exercise } from '@/composables/useExerciseSearch'
import type { DbTemplateBlock, DbTemplateBlockExercise, DbTemplateStrengthBlock } from '@/db/schema'
import type {
  AmrapConfig,
  BlockExercise,
  CardioConfig,
  EmomConfig,
  ForTimeConfig,
  TabataConfig,
} from '@/types/blocks'

/**
 * Converts a BlockExercise to DbTemplateBlockExercise format.
 */
function toTemplateBlockExercise(exercise: BlockExercise): DbTemplateBlockExercise {
  return {
    exerciseDefinitionId: null,
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    image: exercise.image,
  }
}

/**
 * Creates a strength template block from an Exercise.
 * Prefers popular exercise data when available.
 */
export function createTemplateStrengthBlock(exercise: Exercise): DbTemplateStrengthBlock {
  const popularExercise = popularExercises.find((ex) => ex.name === exercise.name)

  return {
    kind: 'strength',
    exerciseDefinitionId: exercise.id ?? null,
    name: exercise.name,
    equipment: popularExercise?.equipment ?? exercise.equipment ?? 'bodyweight',
    targetReps: 0,
    targetDuration: null,
    targetWeight: null,
    image: exercise.image ?? null,
    defaultSetCount: 3,
  }
}

/**
 * Creates an AMRAP template block from config and exercises.
 */
export function createTemplateAmrapBlock(
  config: AmrapConfig,
  exercises: ReadonlyArray<BlockExercise>,
): DbTemplateBlock {
  return {
    kind: 'amrap',
    config: { durationSeconds: config.durationSeconds },
    exercises: exercises.map(toTemplateBlockExercise),
  }
}

/**
 * Creates an EMOM template block from config and exercises.
 */
export function createTemplateEmomBlock(
  config: EmomConfig,
  exercises: ReadonlyArray<BlockExercise>,
): DbTemplateBlock {
  return {
    kind: 'emom',
    config: { minutes: config.minutes, exerciseRotation: config.exerciseRotation },
    exercises: exercises.map(toTemplateBlockExercise),
  }
}

/**
 * Creates a Tabata template block from config and single exercise.
 */
export function createTemplateTabataBlock(
  config: TabataConfig,
  exercise: BlockExercise,
): DbTemplateBlock {
  return {
    kind: 'tabata',
    config: {
      rounds: config.rounds,
      workSeconds: config.workSeconds,
      restSeconds: config.restSeconds,
    },
    exercise: toTemplateBlockExercise(exercise),
  }
}

/**
 * Creates a For Time template block from config and exercises.
 */
export function createTemplateForTimeBlock(
  config: ForTimeConfig,
  exercises: ReadonlyArray<BlockExercise>,
): DbTemplateBlock {
  return {
    kind: 'fortime',
    config: { timeCapSeconds: config.timeCapSeconds },
    exercises: exercises.map(toTemplateBlockExercise),
  }
}

/**
 * Creates a cardio template block from config.
 */
export function createTemplateCardioBlock(config: CardioConfig): DbTemplateBlock {
  return {
    kind: 'cardio',
    config: {
      activity: config.activity,
      targetDurationSeconds: config.targetDurationSeconds,
      targetDistanceMeters: config.targetDistanceMeters,
    },
  }
}

/**
 * Returns the exercise names contained in a template block, for display on
 * block cards. Timed-block cards previously showed only a summary line
 * like "12 min · 1 exercise" with no indication of which exercises).
 *
 * Strength blocks track their own exercise via `name` (shown separately by
 * the card), and cardio blocks have no exercises, so both return an empty
 * list. Tabata is singular (`exercise`, not `exercises`).
 */
export function getTemplateBlockExerciseNames(block: DbTemplateBlock): ReadonlyArray<string> {
  switch (block.kind) {
    case 'amrap':
    case 'emom':
    case 'fortime': {
      return block.exercises.map((exercise) => exercise.name)
    }
    case 'tabata': {
      return [block.exercise.name]
    }
    case 'strength':
    case 'cardio': {
      return []
    }
  }
}
