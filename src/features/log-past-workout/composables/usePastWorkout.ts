/* eslint-disable @typescript-eslint/consistent-type-assertions -- Type assertions needed for discriminated union block conversion */
import { ref, shallowRef } from 'vue'
import type { WorkoutBlock, StrengthBlock, AmrapBlock, EmomBlock, TabataBlock, ForTimeBlock, CardioBlock } from '@/types/blocks'
import { isStrengthBlock } from '@/types/blocks'
import type { Set } from '@/types/workout'
import { getTemplatesRepository } from '@/db'
import { getWorkoutsRepository } from '@/db'
import type { DbNormalizedTemplateBlock, DbNormalizedTemplateBlockExercise } from '@/db/schema'
import { tryCatch } from '@/lib/tryCatch'

function createStrengthBlockFromTemplate(
  templateBlock: { kind: 'strength'; name: string; equipment: string; targetReps?: number; defaultSetCount?: number; thumbnail: string; exerciseDefinitionId?: string | null },
  newId: number,
): StrengthBlock {
  const setCount = templateBlock.defaultSetCount ?? 3
  const sets: Array<Set> = Array.from({ length: setCount }, (_, i) => ({
    id: i + 1,
    kg: '',
    reps: String(templateBlock.targetReps ?? ''),
    rir: '',
    status: 'completed',
  }))

  return {
    kind: 'strength',
    id: newId,
    exerciseDefinitionId: templateBlock.exerciseDefinitionId ?? null,
    name: templateBlock.name,
    equipment: templateBlock.equipment,
    targetReps: templateBlock.targetReps ?? 8,
    sets,
    thumbnail: templateBlock.thumbnail,
  }
}

function createStrengthBlockFromHistory(
  historyBlock: { kind: 'strength'; name: string; equipment: string; targetReps?: number; sets: ReadonlyArray<{ kg: string; reps: string; rir: string }>; thumbnail: string; exerciseDefinitionId?: string | null },
  newId: number,
): StrengthBlock {
  const sets: Array<Set> = historyBlock.sets.map((set, setIndex) => ({
    id: setIndex + 1,
    kg: set.kg,
    reps: set.reps,
    rir: set.rir,
    status: 'completed',
  }))

  return {
    kind: 'strength',
    id: newId,
    exerciseDefinitionId: historyBlock.exerciseDefinitionId ?? null,
    name: historyBlock.name,
    equipment: historyBlock.equipment,
    targetReps: historyBlock.targetReps ?? 8,
    sets,
    thumbnail: historyBlock.thumbnail,
  }
}

function convertTemplateBlockExerciseToBlockExercise(
  exercise: { exerciseDefinitionId: string | null; name: string; prescribedReps: number; load: string | null; thumbnail: string },
): { id: string; name: string; prescribedReps: number; load: string | null; thumbnail: string } {
  return {
    id: exercise.exerciseDefinitionId ?? crypto.randomUUID(),
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    thumbnail: exercise.thumbnail,
  }
}

function createAmrapBlockFromTemplate(
  templateBlock: { kind: 'amrap'; config: { durationSeconds: number }; exercises: ReadonlyArray<{ exerciseDefinitionId: string | null; name: string; prescribedReps: number; load: string | null; thumbnail: string }> },
  newId: number,
): AmrapBlock {
  return {
    kind: 'amrap',
    id: newId,
    config: { durationSeconds: templateBlock.config.durationSeconds },
    exercises: templateBlock.exercises.map(convertTemplateBlockExerciseToBlockExercise),
    result: null,
  }
}

function createEmomBlockFromTemplate(
  templateBlock: { kind: 'emom'; config: { minutes: number; exerciseRotation: 'each-minute' | 'full-round' }; exercises: ReadonlyArray<{ exerciseDefinitionId: string | null; name: string; prescribedReps: number; load: string | null; thumbnail: string }> },
  newId: number,
): EmomBlock {
  return {
    kind: 'emom',
    id: newId,
    config: { minutes: templateBlock.config.minutes, exerciseRotation: templateBlock.config.exerciseRotation },
    exercises: templateBlock.exercises.map(convertTemplateBlockExerciseToBlockExercise),
    result: null,
  }
}

function createTabataBlockFromTemplate(
  templateBlock: { kind: 'tabata'; config: { rounds: number; workSeconds: number; restSeconds: number }; exercise: { exerciseDefinitionId: string | null; name: string; prescribedReps: number; load: string | null; thumbnail: string } },
  newId: number,
): TabataBlock {
  return {
    kind: 'tabata',
    id: newId,
    config: { rounds: templateBlock.config.rounds, workSeconds: templateBlock.config.workSeconds, restSeconds: templateBlock.config.restSeconds },
    exercise: convertTemplateBlockExerciseToBlockExercise(templateBlock.exercise),
    result: null,
  }
}

function createForTimeBlockFromTemplate(
  templateBlock: { kind: 'fortime'; config: { timeCapSeconds: number | null }; exercises: ReadonlyArray<{ exerciseDefinitionId: string | null; name: string; prescribedReps: number; load: string | null; thumbnail: string }> },
  newId: number,
): ForTimeBlock {
  return {
    kind: 'fortime',
    id: newId,
    config: { timeCapSeconds: templateBlock.config.timeCapSeconds },
    exercises: templateBlock.exercises.map(convertTemplateBlockExerciseToBlockExercise),
    result: null,
  }
}

function createCardioBlockFromTemplate(
  templateBlock: { kind: 'cardio'; config: { activity: CardioBlock['config']['activity']; targetDurationSeconds: number | null; targetDistanceMeters: number | null } },
  newId: number,
): CardioBlock {
  return {
    kind: 'cardio',
    id: newId,
    config: {
      activity: templateBlock.config.activity,
      targetDurationSeconds: templateBlock.config.targetDurationSeconds,
      targetDistanceMeters: templateBlock.config.targetDistanceMeters,
    },
    result: null,
  }
}

function convertDbBlockExerciseToBlockExercise(
  exercise: { id: string; name: string; prescribedReps: number; load: string | null; thumbnail: string },
): { id: string; name: string; prescribedReps: number; load: string | null; thumbnail: string } {
  return {
    id: exercise.id,
    name: exercise.name,
    prescribedReps: exercise.prescribedReps,
    load: exercise.load,
    thumbnail: exercise.thumbnail,
  }
}

function createAmrapBlockFromHistory(
  dbBlock: { kind: 'amrap'; config: { durationSeconds: number }; exercises: ReadonlyArray<{ id: string; name: string; prescribedReps: number; load: string | null; thumbnail: string }> },
  newId: number,
): AmrapBlock {
  return {
    kind: 'amrap',
    id: newId,
    config: { durationSeconds: dbBlock.config.durationSeconds },
    exercises: dbBlock.exercises.map(convertDbBlockExerciseToBlockExercise),
    result: null,
  }
}

function createEmomBlockFromHistory(
  dbBlock: { kind: 'emom'; config: { minutes: number; exerciseRotation: 'each-minute' | 'full-round' }; exercises: ReadonlyArray<{ id: string; name: string; prescribedReps: number; load: string | null; thumbnail: string }> },
  newId: number,
): EmomBlock {
  return {
    kind: 'emom',
    id: newId,
    config: { minutes: dbBlock.config.minutes, exerciseRotation: dbBlock.config.exerciseRotation },
    exercises: dbBlock.exercises.map(convertDbBlockExerciseToBlockExercise),
    result: null,
  }
}

function createTabataBlockFromHistory(
  dbBlock: { kind: 'tabata'; config: { rounds: number; workSeconds: number; restSeconds: number }; exercise: { id: string; name: string; prescribedReps: number; load: string | null; thumbnail: string } },
  newId: number,
): TabataBlock {
  return {
    kind: 'tabata',
    id: newId,
    config: { rounds: dbBlock.config.rounds, workSeconds: dbBlock.config.workSeconds, restSeconds: dbBlock.config.restSeconds },
    exercise: convertDbBlockExerciseToBlockExercise(dbBlock.exercise),
    result: null,
  }
}

function createForTimeBlockFromHistory(
  dbBlock: { kind: 'fortime'; config: { timeCapSeconds: number | null }; exercises: ReadonlyArray<{ id: string; name: string; prescribedReps: number; load: string | null; thumbnail: string }> },
  newId: number,
): ForTimeBlock {
  return {
    kind: 'fortime',
    id: newId,
    config: { timeCapSeconds: dbBlock.config.timeCapSeconds },
    exercises: dbBlock.exercises.map(convertDbBlockExerciseToBlockExercise),
    result: null,
  }
}

function createCardioBlockFromHistory(
  dbBlock: { kind: 'cardio'; config: { activity: CardioBlock['config']['activity']; targetDurationSeconds: number | null; targetDistanceMeters: number | null } },
  newId: number,
): CardioBlock {
  return {
    kind: 'cardio',
    id: newId,
    config: {
      activity: dbBlock.config.activity,
      targetDurationSeconds: dbBlock.config.targetDurationSeconds,
      targetDistanceMeters: dbBlock.config.targetDistanceMeters,
    },
    result: null,
  }
}

/**
 * Converts a normalized template block to a workout block based on its kind.
 */
function convertNormalizedTemplateBlockToWorkoutBlock(
  block: DbNormalizedTemplateBlock,
  blockExercisesMap: Map<string, ReadonlyArray<DbNormalizedTemplateBlockExercise>>,
  newId: number,
): WorkoutBlock | null {
  if (!block) return null

  const blockExercises = blockExercisesMap.get(block.id) ?? []

  switch (block.kind) {
    case 'strength':
      return createStrengthBlockFromTemplate(
        {
          kind: 'strength',
          name: block.exerciseName ?? '',
          equipment: block.equipment ?? '',
          targetReps: block.targetReps ?? 8,
          defaultSetCount: block.defaultSetCount ?? 3,
          thumbnail: block.thumbnail ?? '',
          exerciseDefinitionId: block.exerciseId,
        },
        newId,
      )
    case 'amrap': {
      const config = block.config as { kind: 'amrap'; durationSeconds: number }
      return createAmrapBlockFromTemplate(
        {
          kind: 'amrap',
          config: { durationSeconds: config.durationSeconds },
          exercises: blockExercises.map((ex) => ({
            exerciseDefinitionId: ex.exerciseId,
            name: ex.name,
            prescribedReps: ex.prescribedReps,
            load: ex.load,
            thumbnail: ex.thumbnail,
          })),
        },
        newId,
      )
    }
    case 'emom': {
      const config = block.config as { kind: 'emom'; minutes: number; exerciseRotation: 'each-minute' | 'full-round' }
      return createEmomBlockFromTemplate(
        {
          kind: 'emom',
          config: { minutes: config.minutes, exerciseRotation: config.exerciseRotation },
          exercises: blockExercises.map((ex) => ({
            exerciseDefinitionId: ex.exerciseId,
            name: ex.name,
            prescribedReps: ex.prescribedReps,
            load: ex.load,
            thumbnail: ex.thumbnail,
          })),
        },
        newId,
      )
    }
    case 'tabata': {
      const config = block.config as { kind: 'tabata'; rounds: number; workSeconds: number; restSeconds: number }
      const exercise = blockExercises[0]
      return createTabataBlockFromTemplate(
        {
          kind: 'tabata',
          config: { rounds: config.rounds, workSeconds: config.workSeconds, restSeconds: config.restSeconds },
          exercise: exercise
            ? {
                exerciseDefinitionId: exercise.exerciseId,
                name: exercise.name,
                prescribedReps: exercise.prescribedReps,
                load: exercise.load,
                thumbnail: exercise.thumbnail,
              }
            : { exerciseDefinitionId: null, name: '', prescribedReps: 0, load: null, thumbnail: '' },
        },
        newId,
      )
    }
    case 'fortime': {
      const config = block.config as { kind: 'fortime'; timeCapSeconds: number | null }
      return createForTimeBlockFromTemplate(
        {
          kind: 'fortime',
          config: { timeCapSeconds: config.timeCapSeconds },
          exercises: blockExercises.map((ex) => ({
            exerciseDefinitionId: ex.exerciseId,
            name: ex.name,
            prescribedReps: ex.prescribedReps,
            load: ex.load,
            thumbnail: ex.thumbnail,
          })),
        },
        newId,
      )
    }
    case 'cardio': {
      const config = block.config as { kind: 'cardio'; activity: CardioBlock['config']['activity']; targetDurationSeconds: number | null; targetDistanceMeters: number | null }
      return createCardioBlockFromTemplate(
        {
          kind: 'cardio',
          config: {
            activity: config.activity,
            targetDurationSeconds: config.targetDurationSeconds,
            targetDistanceMeters: config.targetDistanceMeters,
          },
        },
        newId,
      )
    }
    default:
      return null
  }
}

/**
 * Converts a history block to a workout block based on its kind.
 */
function convertHistoryBlockToWorkoutBlock(
  block: NonNullable<Awaited<ReturnType<ReturnType<typeof getWorkoutsRepository>['getById']>>>['blocks'][number],
  newId: number,
): WorkoutBlock | null {
  if (!block) return null

  switch (block.kind) {
    case 'strength':
      return createStrengthBlockFromHistory(block, newId)
    case 'amrap':
      return createAmrapBlockFromHistory(block, newId)
    case 'emom':
      return createEmomBlockFromHistory(block, newId)
    case 'tabata':
      return createTabataBlockFromHistory(block, newId)
    case 'fortime':
      return createForTimeBlockFromHistory(block, newId)
    case 'cardio':
      return createCardioBlockFromHistory(block, newId)
    default:
      return null
  }
}

/**
 * Composable for managing past workout state during hindsight logging.
 * Provides state management for the multi-step past workout entry flow.
 */
export function usePastWorkout() {
  const workoutName = ref('')
  const workoutDate = ref(new Date())
  const durationMinutes = ref(45)
  const blocks = shallowRef<Array<WorkoutBlock>>([])
  const sourceType = ref<'template' | 'history' | 'blank' | undefined>(undefined)
  const sourceId = ref<string | undefined>(undefined)

  /**
   * Loads blocks from a template.
   */
  async function loadFromTemplate(templateId: string): Promise<void> {
    const [error, template] = await tryCatch(
      getTemplatesRepository().getByIdWithBlocks(templateId),
    )

    if (error || !template) {
      return
    }
    workoutName.value = template.name

    // Convert template blocks to workout blocks with empty sets
    const workoutBlocks: Array<WorkoutBlock> = template.blocks
      .map((block, index) => convertNormalizedTemplateBlockToWorkoutBlock(block, template.blockExercises, index + 1))
      .filter((block): block is WorkoutBlock => block !== null)

    blocks.value = workoutBlocks
    sourceType.value = 'template'
    sourceId.value = templateId
  }

  /**
   * Loads blocks from a completed workout in history.
   */
  async function loadFromHistory(workoutId: string): Promise<void> {
    const [error, historicalWorkout] = await tryCatch(
      getWorkoutsRepository().getById(workoutId),
    )

    if (error || !historicalWorkout) {
      return
    }
    workoutName.value = `${historicalWorkout.name} (Copy)`

    // Convert DB blocks to workout blocks, preserving set values
    const workoutBlocks: Array<WorkoutBlock> = historicalWorkout.blocks
      .map((block, index) => convertHistoryBlockToWorkoutBlock(block, index + 1))
      .filter((block): block is WorkoutBlock => block !== null)

    blocks.value = workoutBlocks
    sourceType.value = 'history'
    sourceId.value = workoutId
  }

  /**
   * Starts with a blank workout.
   */
  function startBlank(): void {
    workoutName.value = ''
    blocks.value = []
    sourceType.value = 'blank'
    sourceId.value = undefined
  }

  /**
   * Adds a new block to the workout.
   */
  function addBlock(block: WorkoutBlock): void {
    const newId = blocks.value.length + 1
    blocks.value = [...blocks.value, { ...block, id: newId }]
  }

  /**
   * Removes a block by its ID.
   */
  function removeBlock(blockId: number): void {
    blocks.value = blocks.value.filter((b) => b.id !== blockId)
  }

  /**
   * Updates the sets for a strength block.
   */
  function updateStrengthSets(blockId: number, sets: Array<Set>): void {
    blocks.value = blocks.value.map((block) => {
      if (block.id !== blockId || !isStrengthBlock(block)) {
        return block
      }

      return {
        ...block,
        sets,
      }
    })
  }

  /**
   * Updates a single set within a strength block.
   */
  function updateSet(blockId: number, setIndex: number, values: Partial<Set>): void {
    blocks.value = blocks.value.map((block) => {
      if (block.id !== blockId || !isStrengthBlock(block)) {
        return block
      }

      const newSets = block.sets.map((set, idx) => {
        if (idx !== setIndex) {
          return set
        }
        return { ...set, ...values }
      })

      return {
        ...block,
        sets: newSets,
      }
    })
  }

  /**
   * Adds a new set to a strength block.
   */
  function addSetToBlock(blockId: number): void {
    blocks.value = blocks.value.map((block) => {
      if (block.id !== blockId || !isStrengthBlock(block)) {
        return block
      }

      const lastSet = block.sets[block.sets.length - 1]
      const newSet: Set = {
        id: block.sets.length + 1,
        kg: lastSet?.kg ?? '',
        reps: lastSet?.reps ?? '',
        rir: lastSet?.rir ?? '',
        status: 'completed',
      }

      return {
        ...block,
        sets: [...block.sets, newSet],
      }
    })
  }

  /**
   * Removes a set from a strength block.
   */
  function removeSetFromBlock(blockId: number, setIndex: number): void {
    blocks.value = blocks.value.map((block) => {
      if (block.id !== blockId || !isStrengthBlock(block)) {
        return block
      }

      const newSets = block.sets.filter((_, idx) => idx !== setIndex)

      return {
        ...block,
        sets: newSets,
      }
    })
  }

  /**
   * Resets all state to initial values.
   */
  function reset(): void {
    workoutName.value = ''
    workoutDate.value = new Date()
    durationMinutes.value = 45
    blocks.value = []
    sourceType.value = undefined
    sourceId.value = undefined
  }

  return {
    // State
    workoutName,
    workoutDate,
    durationMinutes,
    blocks,
    sourceType,
    sourceId,

    // Actions
    loadFromTemplate,
    loadFromHistory,
    startBlank,
    addBlock,
    removeBlock,
    updateStrengthSets,
    updateSet,
    addSetToBlock,
    removeSetFromBlock,
    reset,
  }
}
