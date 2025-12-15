import { ref, shallowRef } from 'vue'
import type { WorkoutBlock, StrengthBlock, AmrapBlock, EmomBlock, TabataBlock, ForTimeBlock, CardioBlock } from '@/types/blocks'
import { isStrengthBlock } from '@/types/blocks'
import type { Set } from '@/types/workout'
import { getTemplatesRepository } from '@/db'
import { getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

function createStrengthBlockFromTemplate(
  templateBlock: { kind: 'strength'; name: string; equipment: string; targetReps?: number; defaultSetCount?: number; thumbnail: string; exerciseDefinitionId?: string | null },
  index: number,
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
    id: index + 1,
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
  index: number,
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
    id: index + 1,
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
    const workoutBlocks: Array<WorkoutBlock> = []

    for (let index = 0; index < template.blocks.length; index++) {
      const block = template.blocks[index]
      if (!block) continue

      if (block.kind === 'strength') {
        workoutBlocks.push(createStrengthBlockFromTemplate(block, index))
        continue
      }

      if (block.kind === 'amrap') {
        workoutBlocks.push(createAmrapBlockFromTemplate(block, index + 1))
        continue
      }

      if (block.kind === 'emom') {
        workoutBlocks.push(createEmomBlockFromTemplate(block, index + 1))
        continue
      }

      if (block.kind === 'tabata') {
        workoutBlocks.push(createTabataBlockFromTemplate(block, index + 1))
        continue
      }

      if (block.kind === 'fortime') {
        workoutBlocks.push(createForTimeBlockFromTemplate(block, index + 1))
        continue
      }

      if (block.kind === 'cardio') {
        workoutBlocks.push(createCardioBlockFromTemplate(block, index + 1))
      }
    }

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
    const workoutBlocks: Array<WorkoutBlock> = []

    for (let index = 0; index < historicalWorkout.blocks.length; index++) {
      const block = historicalWorkout.blocks[index]
      if (!block) continue

      if (block.kind === 'strength') {
        workoutBlocks.push(createStrengthBlockFromHistory(block, index))
        continue
      }

      if (block.kind === 'amrap') {
        workoutBlocks.push(createAmrapBlockFromHistory(block, index + 1))
        continue
      }

      if (block.kind === 'emom') {
        workoutBlocks.push(createEmomBlockFromHistory(block, index + 1))
        continue
      }

      if (block.kind === 'tabata') {
        workoutBlocks.push(createTabataBlockFromHistory(block, index + 1))
        continue
      }

      if (block.kind === 'fortime') {
        workoutBlocks.push(createForTimeBlockFromHistory(block, index + 1))
        continue
      }

      if (block.kind === 'cardio') {
        workoutBlocks.push(createCardioBlockFromHistory(block, index + 1))
      }
    }

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
