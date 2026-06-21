import type { Equipment } from '@/types/exercises'
import type { Set } from '@/types/workout'
import type {
  AmrapBlock,
  AmrapConfig,
  BlockExercise,
  CardioBlock,
  CardioConfig,
  EmomBlock,
  EmomConfig,
  ForTimeBlock,
  ForTimeConfig,
  StrengthBlock,
  TabataBlock,
  TabataConfig,
  TimedBlock,
  WorkoutBlock,
} from '@/types/blocks'

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

type TemplateStrengthBlockSource = {
  kind: 'strength'
  name: string
  equipment: Equipment
  targetReps?: number
  targetDuration?: number | null
  targetWeight?: number | null
  defaultSetCount?: number
  image: Blob | null
  exerciseDefinitionId?: string | null
}

type HistoryStrengthBlockSource = {
  kind: 'strength'
  name: string
  equipment: Equipment
  targetReps?: number
  targetDuration?: number | null
  targetWeight?: number | null
  sets: ReadonlyArray<{ kg: string; reps: string; rir: string }>
  image: Blob | null
  exerciseDefinitionId?: string | null
}

type TemplateWorkoutBlockSource =
  | TemplateStrengthBlockSource
  | { kind: 'amrap'; config: AmrapConfig; exercises: ReadonlyArray<TemplateBlockExerciseSource> }
  | { kind: 'emom'; config: EmomConfig; exercises: ReadonlyArray<TemplateBlockExerciseSource> }
  | { kind: 'tabata'; config: TabataConfig; exercise: TemplateBlockExerciseSource }
  | { kind: 'fortime'; config: ForTimeConfig; exercises: ReadonlyArray<TemplateBlockExerciseSource> }
  | { kind: 'cardio'; config: CardioConfig }

type HistoryWorkoutBlockSource =
  | HistoryStrengthBlockSource
  | { kind: 'amrap'; config: AmrapConfig; exercises: ReadonlyArray<HistoryBlockExerciseSource> }
  | { kind: 'emom'; config: EmomConfig; exercises: ReadonlyArray<HistoryBlockExerciseSource> }
  | { kind: 'tabata'; config: TabataConfig; exercise: HistoryBlockExerciseSource }
  | { kind: 'fortime'; config: ForTimeConfig; exercises: ReadonlyArray<HistoryBlockExerciseSource> }
  | { kind: 'cardio'; config: CardioConfig }

export function createTimedWorkoutBlock(input: TimedBlockInput, id: number): TimedBlock {
  switch (input.kind) {
    case 'amrap': {
      return createAmrapWorkoutBlock(input.config, input.exercises, id)
    }
    case 'emom': {
      return createEmomWorkoutBlock(input.config, input.exercises, id)
    }
    case 'tabata': {
      return createTabataWorkoutBlock(input.config, input.exercise, id)
    }
    case 'fortime': {
      return createForTimeWorkoutBlock(input.config, input.exercises, id)
    }
  }
}

export function createAmrapWorkoutBlock(
  config: AmrapConfig,
  exercises: ReadonlyArray<BlockExercise>,
  id: number,
): AmrapBlock {
  return {
    kind: 'amrap',
    id,
    config: { durationSeconds: config.durationSeconds },
    exercises: [...exercises],
    result: null,
  }
}

export function createEmomWorkoutBlock(
  config: EmomConfig,
  exercises: ReadonlyArray<BlockExercise>,
  id: number,
): EmomBlock {
  return {
    kind: 'emom',
    id,
    config: { minutes: config.minutes, exerciseRotation: config.exerciseRotation },
    exercises: [...exercises],
    result: null,
  }
}

export function createTabataWorkoutBlock(
  config: TabataConfig,
  exercise: BlockExercise,
  id: number,
): TabataBlock {
  return {
    kind: 'tabata',
    id,
    config: {
      rounds: config.rounds,
      workSeconds: config.workSeconds,
      restSeconds: config.restSeconds,
    },
    exercise,
    result: null,
  }
}

export function createForTimeWorkoutBlock(
  config: ForTimeConfig,
  exercises: ReadonlyArray<BlockExercise>,
  id: number,
): ForTimeBlock {
  return {
    kind: 'fortime',
    id,
    config: { timeCapSeconds: config.timeCapSeconds },
    exercises: [...exercises],
    result: null,
  }
}

export function createCardioWorkoutBlock(config: CardioConfig, id: number): CardioBlock {
  return {
    kind: 'cardio',
    id,
    config: {
      activity: config.activity,
      targetDurationSeconds: config.targetDurationSeconds,
      targetDistanceMeters: config.targetDistanceMeters,
    },
    result: null,
  }
}

export function createWorkoutBlockFromTemplate(
  block: TemplateWorkoutBlockSource,
  id: number,
): WorkoutBlock {
  switch (block.kind) {
    case 'strength': {
      return createStrengthBlockFromTemplate(block, id)
    }
    case 'amrap': {
      return createAmrapWorkoutBlock(
        block.config,
        block.exercises.map(convertTemplateBlockExercise),
        id,
      )
    }
    case 'emom': {
      return createEmomWorkoutBlock(
        block.config,
        block.exercises.map(convertTemplateBlockExercise),
        id,
      )
    }
    case 'fortime': {
      return createForTimeWorkoutBlock(
        block.config,
        block.exercises.map(convertTemplateBlockExercise),
        id,
      )
    }
    case 'tabata': {
      return createTimedWorkoutBlock({
        kind: 'tabata',
        config: block.config,
        exercise: convertTemplateBlockExercise(block.exercise),
      }, id)
    }
    case 'cardio': {
      return createCardioWorkoutBlock(block.config, id)
    }
  }
}

export function createWorkoutBlockFromHistory(
  block: HistoryWorkoutBlockSource,
  id: number,
): WorkoutBlock {
  switch (block.kind) {
    case 'strength': {
      return createStrengthBlockFromHistory(block, id)
    }
    case 'amrap': {
      return createAmrapWorkoutBlock(
        block.config,
        block.exercises.map(convertHistoryBlockExercise),
        id,
      )
    }
    case 'emom': {
      return createEmomWorkoutBlock(
        block.config,
        block.exercises.map(convertHistoryBlockExercise),
        id,
      )
    }
    case 'fortime': {
      return createForTimeWorkoutBlock(
        block.config,
        block.exercises.map(convertHistoryBlockExercise),
        id,
      )
    }
    case 'tabata': {
      return createTimedWorkoutBlock({
        kind: 'tabata',
        config: block.config,
        exercise: convertHistoryBlockExercise(block.exercise),
      }, id)
    }
    case 'cardio': {
      return createCardioWorkoutBlock(block.config, id)
    }
  }
}

function convertTemplateBlockExercise(exercise: TemplateBlockExerciseSource): BlockExercise {
  return {
    id: exercise.exerciseDefinitionId ?? crypto.randomUUID(),
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    image: exercise.image,
  }
}

function convertHistoryBlockExercise(exercise: HistoryBlockExerciseSource): BlockExercise {
  return {
    id: exercise.id,
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    image: exercise.image,
  }
}

function createStrengthBlockFromTemplate(
  block: TemplateStrengthBlockSource,
  id: number,
): StrengthBlock {
  const setCount = block.defaultSetCount ?? 3
  const sets: Array<Set> = Array.from({ length: setCount }, (_, index) => ({
    id: index + 1,
    kg: '',
    reps: String(block.targetReps ?? ''),
    duration: '',
    rir: '',
    status: 'completed',
  }))

  return {
    kind: 'strength',
    id,
    exerciseDefinitionId: block.exerciseDefinitionId ?? null,
    name: block.name,
    equipment: block.equipment,
    targetReps: block.targetReps ?? 8,
    targetDuration: block.targetDuration ?? null,
    targetWeight: block.targetWeight ?? null,
    sets,
    image: block.image,
  }
}

function createStrengthBlockFromHistory(
  block: HistoryStrengthBlockSource,
  id: number,
): StrengthBlock {
  const sets: Array<Set> = block.sets.map((set, index) => ({
    id: index + 1,
    kg: set.kg,
    reps: set.reps,
    duration: '',
    rir: set.rir,
    status: 'completed',
  }))

  return {
    kind: 'strength',
    id,
    exerciseDefinitionId: block.exerciseDefinitionId ?? null,
    name: block.name,
    equipment: block.equipment,
    targetReps: block.targetReps ?? 8,
    targetDuration: block.targetDuration ?? null,
    targetWeight: block.targetWeight ?? null,
    sets,
    image: block.image,
  }
}
