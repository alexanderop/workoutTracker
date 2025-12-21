import { ref, shallowRef } from 'vue'
import type { WorkoutBlock, StrengthBlock, AmrapBlock, EmomBlock, TabataBlock, ForTimeBlock, CardioBlock } from '@/types/blocks'
import { isStrengthBlock } from '@/types/blocks'
import type { Set } from '@/types/workout'
import { getTemplatesRepository } from '@/db'
import { getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

function createStrengthBlockFromTemplate(
  templateBlock: { kind: 'strength'; name: string; equipment: string; targetReps?: number; defaultSetCount?: number; image: Blob | null; exerciseDefinitionId?: string | null },
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
    image: templateBlock.image,
  }
}

function createStrengthBlockFromHistory(
  historyBlock: { kind: 'strength'; name: string; equipment: string; targetReps?: number; sets: ReadonlyArray<{ kg: string; reps: string; rir: string }>; image: Blob | null; exerciseDefinitionId?: string | null },
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
    image: historyBlock.image,
  }
}

type BlockExercise = { id: string; name: string; prescribedReps: number; load: string | null; image: Blob | null }

function buildBlockExercise(
  id: string,
  source: { name: string; prescribedReps: number; load: string | null; image: Blob | null },
): BlockExercise {
  return {
    id,
    name: source.name,
    prescribedReps: source.prescribedReps,
    load: source.load,
    image: source.image,
  }
}

function convertTemplateBlockExercise(
  exercise: { exerciseDefinitionId: string | null; name: string; prescribedReps: number; load: string | null; image: Blob | null },
): BlockExercise {
  return buildBlockExercise(exercise.exerciseDefinitionId ?? crypto.randomUUID(), exercise)
}

function convertDbBlockExercise(
  exercise: { id: string; name: string; prescribedReps: number; load: string | null; image: Blob | null },
): BlockExercise {
  return buildBlockExercise(exercise.id, exercise)
}

function createAmrapBlockFromTemplate(
  templateBlock: { kind: 'amrap'; config: { durationSeconds: number }; exercises: ReadonlyArray<{ exerciseDefinitionId: string | null; name: string; prescribedReps: number; load: string | null; image: Blob | null }> },
  newId: number,
): AmrapBlock {
  return {
    kind: 'amrap',
    id: newId,
    config: { durationSeconds: templateBlock.config.durationSeconds },
    exercises: templateBlock.exercises.map(convertTemplateBlockExercise),
    result: null,
  }
}

function createEmomBlockFromTemplate(
  templateBlock: { kind: 'emom'; config: { minutes: number; exerciseRotation: 'each-minute' | 'full-round' }; exercises: ReadonlyArray<{ exerciseDefinitionId: string | null; name: string; prescribedReps: number; load: string | null; image: Blob | null }> },
  newId: number,
): EmomBlock {
  return {
    kind: 'emom',
    id: newId,
    config: { minutes: templateBlock.config.minutes, exerciseRotation: templateBlock.config.exerciseRotation },
    exercises: templateBlock.exercises.map(convertTemplateBlockExercise),
    result: null,
  }
}

function createTabataBlockFromTemplate(
  templateBlock: { kind: 'tabata'; config: { rounds: number; workSeconds: number; restSeconds: number }; exercise: { exerciseDefinitionId: string | null; name: string; prescribedReps: number; load: string | null; image: Blob | null } },
  newId: number,
): TabataBlock {
  return {
    kind: 'tabata',
    id: newId,
    config: { rounds: templateBlock.config.rounds, workSeconds: templateBlock.config.workSeconds, restSeconds: templateBlock.config.restSeconds },
    exercise: convertTemplateBlockExercise(templateBlock.exercise),
    result: null,
  }
}

function createForTimeBlockFromTemplate(
  templateBlock: { kind: 'fortime'; config: { timeCapSeconds: number | null }; exercises: ReadonlyArray<{ exerciseDefinitionId: string | null; name: string; prescribedReps: number; load: string | null; image: Blob | null }> },
  newId: number,
): ForTimeBlock {
  return {
    kind: 'fortime',
    id: newId,
    config: { timeCapSeconds: templateBlock.config.timeCapSeconds },
    exercises: templateBlock.exercises.map(convertTemplateBlockExercise),
    result: null,
  }
}

function createCardioBlock(
  config: {
    activity: CardioBlock['config']['activity']
    targetDurationSeconds: number | null
    targetDistanceMeters: number | null
  },
  newId: number,
): CardioBlock {
  return {
    kind: 'cardio',
    id: newId,
    config: {
      activity: config.activity,
      targetDurationSeconds: config.targetDurationSeconds,
      targetDistanceMeters: config.targetDistanceMeters,
    },
    result: null,
  }
}

function createAmrapBlockFromHistory(
  dbBlock: { kind: 'amrap'; config: { durationSeconds: number }; exercises: ReadonlyArray<{ id: string; name: string; prescribedReps: number; load: string | null; image: Blob | null }> },
  newId: number,
): AmrapBlock {
  return {
    kind: 'amrap',
    id: newId,
    config: { durationSeconds: dbBlock.config.durationSeconds },
    exercises: dbBlock.exercises.map(convertDbBlockExercise),
    result: null,
  }
}

function createEmomBlockFromHistory(
  dbBlock: { kind: 'emom'; config: { minutes: number; exerciseRotation: 'each-minute' | 'full-round' }; exercises: ReadonlyArray<{ id: string; name: string; prescribedReps: number; load: string | null; image: Blob | null }> },
  newId: number,
): EmomBlock {
  return {
    kind: 'emom',
    id: newId,
    config: { minutes: dbBlock.config.minutes, exerciseRotation: dbBlock.config.exerciseRotation },
    exercises: dbBlock.exercises.map(convertDbBlockExercise),
    result: null,
  }
}

function createTabataBlockFromHistory(
  dbBlock: { kind: 'tabata'; config: { rounds: number; workSeconds: number; restSeconds: number }; exercise: { id: string; name: string; prescribedReps: number; load: string | null; image: Blob | null } },
  newId: number,
): TabataBlock {
  return {
    kind: 'tabata',
    id: newId,
    config: { rounds: dbBlock.config.rounds, workSeconds: dbBlock.config.workSeconds, restSeconds: dbBlock.config.restSeconds },
    exercise: convertDbBlockExercise(dbBlock.exercise),
    result: null,
  }
}

function createForTimeBlockFromHistory(
  dbBlock: { kind: 'fortime'; config: { timeCapSeconds: number | null }; exercises: ReadonlyArray<{ id: string; name: string; prescribedReps: number; load: string | null; image: Blob | null }> },
  newId: number,
): ForTimeBlock {
  return {
    kind: 'fortime',
    id: newId,
    config: { timeCapSeconds: dbBlock.config.timeCapSeconds },
    exercises: dbBlock.exercises.map(convertDbBlockExercise),
    result: null,
  }
}

/**
 * Converts a template block to a workout block based on its kind.
 */
function convertTemplateBlockToWorkoutBlock(
  block: NonNullable<Awaited<ReturnType<ReturnType<typeof getTemplatesRepository>['getById']>>>['blocks'][number],
  newId: number,
): WorkoutBlock | null {
  if (!block) return null

  switch (block.kind) {
    case 'strength':
      return createStrengthBlockFromTemplate(block, newId)
    case 'amrap':
      return createAmrapBlockFromTemplate(block, newId)
    case 'emom':
      return createEmomBlockFromTemplate(block, newId)
    case 'tabata':
      return createTabataBlockFromTemplate(block, newId)
    case 'fortime':
      return createForTimeBlockFromTemplate(block, newId)
    case 'cardio':
      return createCardioBlock(block.config, newId)
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
      return createCardioBlock(block.config, newId)
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
      getTemplatesRepository().getById(templateId),
    )

    if (error || !template) {
      return
    }
    workoutName.value = template.name

    // Convert template blocks to workout blocks with empty sets
    const workoutBlocks: Array<WorkoutBlock> = template.blocks
      .map((block, index) => convertTemplateBlockToWorkoutBlock(block, index + 1))
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
