import { computed } from 'vue'
import {
  activateWorkoutSet,
  addSetToBlock,
  duplicateSetInBlock,
  removeSetFromBlock,
  setBlockSetCount,
  updateBlockAtIndex as updateWorkoutBlockAtIndex,
  updateSetInBlock as updateWorkoutSetInBlock,
  updateWorkout as applyWorkoutUpdate,
} from '../lib/workoutMutations'
import { completeWorkoutSet } from '../lib/workoutSetCompletion'
import { isSetReady, isSetReadyForDuration } from '../lib/workoutSetValidation'
import { getExerciseProgressRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import {
  createAmrapWorkoutBlock,
  createCardioWorkoutBlock,
  createEmomWorkoutBlock,
  createForTimeWorkoutBlock,
  createTabataWorkoutBlock,
} from '@/lib/workoutBlockFactory'
import {
  appendWorkoutBlock,
  getNextWorkoutBlockId,
  removeWorkoutBlockAtIndex,
  reorderWorkoutBlocks,
} from '@/lib/workoutBlockList'
import { useExercisesStore } from '@/stores/exercises'
import { getWorkoutRef } from '@/stores/workoutState'
import type {
  AmrapConfig,
  AmrapResult,
  BlockExercise,
  CardioConfig,
  EmomConfig,
  EmomResult,
  ForTimeConfig,
  ForTimeResult,
  StrengthBlock,
  TabataConfig,
  TabataResult,
  TimedBlock,
  WorkoutBlock,
} from '@/blocks'
import { isStrengthBlock, isTimedBlock } from '@/blocks'
import type { Set, Workout } from '@/types/workout'

// Get reference to shared workout singleton
const workout = getWorkoutRef()

/**
 * Immutably update the workout object properties.
 */
function updateWorkout(updates: Partial<Workout>): void {
  workout.value = applyWorkoutUpdate(workout.value, updates)
}

/**
 * Append a block to the workout and select it.
 * Extracted to avoid duplication in addXxxBlock functions.
 */
function appendBlock(block: WorkoutBlock): void {
  updateWorkout(appendWorkoutBlock(workout.value.blocks, block))
}

/**
 * Immutably update a block at a specific index.
 */
function updateBlockAtIndex(
  blockIndex: number,
  updater: (block: WorkoutBlock) => WorkoutBlock,
): void {
  workout.value = updateWorkoutBlockAtIndex(workout.value, blockIndex, updater)
}

/**
 * Immutably update a set within a strength block.
 */
function updateSetInBlock(blockIndex: number, setId: number, updater: (set: Set) => Set): void {
  workout.value = updateWorkoutSetInBlock(workout.value, blockIndex, setId, updater)
}

/**
 * Check if a set should use duration-based validation.
 * Returns true for exercises with 'duration' metrics.
 */
function shouldUseDurationValidation(block: WorkoutBlock): boolean {
  if (!isStrengthBlock(block)) return false
  if (!block.exerciseDefinitionId) return false
  const exercisesStore = useExercisesStore()
  const exercise = exercisesStore.getExerciseById(block.exerciseDefinitionId)
  return exercise?.metrics === 'duration'
}

/**
 * Create a pre-filled first set from last workout data.
 * Returns the pre-filled set or a blank active set if no history.
 */
function createFirstSetFromHistory(
  lastSet: { kg: number; reps: number; duration: number; rir: number | null } | undefined,
): Set {
  if (!lastSet) {
    return { id: 1, kg: '', reps: '', duration: '', rir: '', status: 'active' as const }
  }
  return {
    id: 1,
    kg: String(lastSet.kg),
    reps: String(lastSet.reps),
    duration: lastSet.duration > 0 ? String(lastSet.duration) : '',
    rir: lastSet.rir === null ? '' : String(lastSet.rir),
    status: 'active' as const,
  }
}

/**
 * Create a typed update function for block results.
 */
function getTypedResultUpdate(
  block: TimedBlock,
  result: AmrapResult | EmomResult | TabataResult | ForTimeResult,
): (() => TimedBlock) | null {
  switch (block.kind) {
    case 'amrap': {
      return 'rounds' in result ? () => ({ ...block, result }) : null
    }
    case 'emom': {
      return 'completedMinutes' in result ? () => ({ ...block, result }) : null
    }
    case 'tabata': {
      return 'repsPerRound' in result ? () => ({ ...block, result }) : null
    }
    case 'fortime': {
      return 'completionTime' in result ? () => ({ ...block, result }) : null
    }
  }
}

export function useWorkout() {
  const selectedBlock = computed(() => {
    if (workout.value.selectedBlockIndex < 0) return
    return workout.value.blocks[workout.value.selectedBlockIndex]
  })

  // For backward compatibility - returns the selected block if it's a strength block
  const selectedExercise = computed(() => {
    const block = selectedBlock.value
    if (!block || !isStrengthBlock(block)) return
    return block
  })

  // Compute exercises array for backward compatibility
  const exercises = computed(() => {
    return workout.value.blocks.filter(isStrengthBlock)
  })

  function selectBlock(blockIndex: number) {
    if (blockIndex >= 0 && blockIndex < workout.value.blocks.length) {
      updateWorkout({ selectedBlockIndex: blockIndex })
    }
  }

  // For backward compatibility with exercise selection by ID
  function selectExercise(exerciseId: number) {
    const index = workout.value.blocks.findIndex((b) => isStrengthBlock(b) && b.id === exerciseId)
    if (index !== -1) {
      updateWorkout({ selectedBlockIndex: index })
    }
  }

  function completeSet(set: Set) {
    const currentBlock = workout.value.blocks[workout.value.selectedBlockIndex]
    const isDurationBased = currentBlock ? shouldUseDurationValidation(currentBlock) : false
    const isReady = isDurationBased ? isSetReadyForDuration(set) : isSetReady(set)
    const transition = completeWorkoutSet(workout.value, set, isReady)
    workout.value = transition.workout
    return transition.result
  }

  async function addExercise(exerciseId: string, name: string) {
    if (!name.trim()) return

    const exercisesStore = useExercisesStore()
    const exercise = exercisesStore.getExerciseById(exerciseId)

    // Fetch last workout data for this exercise (errors are silently ignored - we just don't pre-fill)
    const [_error, history] = await tryCatch(
      getExerciseProgressRepository().getExerciseHistory(exerciseId, { limit: 1 }),
    )
    const lastSet = history?.[0]?.sets.at(-1)
    const firstSet = createFirstSetFromHistory(lastSet)

    appendBlock({
      kind: 'strength',
      id: getNextWorkoutBlockId(workout.value.blocks),
      exerciseDefinitionId: exerciseId,
      name,
      equipment: exercise?.equipment ?? 'bodyweight',
      targetReps: 8,
      targetDuration: null,
      targetWeight: null,
      image: exercise?.image ?? null,
      sets: [
        firstSet,
        { id: 2, kg: '', reps: '', duration: '', rir: '', status: 'planned' },
        { id: 3, kg: '', reps: '', duration: '', rir: '', status: 'planned' },
      ],
    })
  }

  function addAmrapBlock(config: AmrapConfig, blockExercises: ReadonlyArray<BlockExercise>) {
    appendBlock(
      createAmrapWorkoutBlock(config, blockExercises, getNextWorkoutBlockId(workout.value.blocks)),
    )
  }

  function addEmomBlock(config: EmomConfig, blockExercises: ReadonlyArray<BlockExercise>) {
    appendBlock(
      createEmomWorkoutBlock(config, blockExercises, getNextWorkoutBlockId(workout.value.blocks)),
    )
  }

  function addTabataBlock(config: TabataConfig, exercise: BlockExercise) {
    appendBlock(
      createTabataWorkoutBlock(config, exercise, getNextWorkoutBlockId(workout.value.blocks)),
    )
  }

  function addForTimeBlock(config: ForTimeConfig, blockExercises: ReadonlyArray<BlockExercise>) {
    appendBlock(
      createForTimeWorkoutBlock(
        config,
        blockExercises,
        getNextWorkoutBlockId(workout.value.blocks),
      ),
    )
  }

  function addCardioBlock(config: CardioConfig) {
    appendBlock(createCardioWorkoutBlock(config, getNextWorkoutBlockId(workout.value.blocks)))
  }

  function removeBlock(blockIndex: number) {
    const update = removeWorkoutBlockAtIndex(
      workout.value.blocks,
      blockIndex,
      workout.value.selectedBlockIndex,
    )
    if (update) updateWorkout(update)
  }

  // For backward compatibility
  function removeExercise(exerciseId: number) {
    const index = workout.value.blocks.findIndex((b) => isStrengthBlock(b) && b.id === exerciseId)
    if (index !== -1) {
      removeBlock(index)
    }
  }

  function updateStrengthBlock(
    updates: Partial<
      Pick<StrengthBlock, 'name' | 'equipment' | 'targetReps' | 'targetDuration' | 'targetWeight'>
    >,
  ) {
    const blockIndex = workout.value.selectedBlockIndex
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block)) return

    updateBlockAtIndex(blockIndex, (b) => {
      if (!isStrengthBlock(b)) return b
      return { ...b, ...updates }
    })
  }

  // For backward compatibility
  function updateExercise(
    updates: Partial<
      Pick<StrengthBlock, 'name' | 'equipment' | 'targetReps' | 'targetDuration' | 'targetWeight'>
    >,
  ) {
    updateStrengthBlock(updates)
  }

  function addSet(blockIndex: number) {
    workout.value = addSetToBlock(workout.value, blockIndex)
  }

  function removeSet(blockIndex: number, setId: number) {
    workout.value = removeSetFromBlock(workout.value, blockIndex, setId)
  }

  function duplicateSet(blockIndex: number, setId: number) {
    workout.value = duplicateSetInBlock(workout.value, blockIndex, setId)
  }

  function activateSet(blockIndex: number, setIndex: number) {
    workout.value = activateWorkoutSet(workout.value, blockIndex, setIndex)
  }

  function setSetCount(blockIndex: number, count: number) {
    workout.value = setBlockSetCount(workout.value, blockIndex, count)
  }

  function updateSetValue(
    setId: number,
    field: 'kg' | 'reps' | 'duration' | 'rir',
    value: number | undefined,
  ) {
    const blockIndex = workout.value.selectedBlockIndex
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block)) return

    const set = block.sets.find((s) => s.id === setId)
    if (!set) return

    updateSetInBlock(blockIndex, setId, (s) => ({
      ...s,
      [field]: value === undefined ? '' : String(value),
    }))
  }

  function reorderBlocks(fromIndex: number, toIndex: number) {
    const update = reorderWorkoutBlocks(
      workout.value.blocks,
      fromIndex,
      toIndex,
      workout.value.selectedBlockIndex,
    )
    if (update) updateWorkout(update)
  }

  // For backward compatibility
  function reorderExercises(fromIndex: number, toIndex: number) {
    reorderBlocks(fromIndex, toIndex)
  }

  // Set result for a timed block - delegates to type-specific helpers
  function setBlockResult(
    blockIndex: number,
    result: AmrapResult | EmomResult | TabataResult | ForTimeResult,
  ) {
    const block = workout.value.blocks[blockIndex]
    if (!block || !isTimedBlock(block)) return

    const update = getTypedResultUpdate(block, result)
    if (update) updateBlockAtIndex(blockIndex, update)
  }

  return {
    workout,
    selectedBlock,
    selectedExercise, // Backward compatibility
    exercises, // Backward compatibility

    // Block-based methods
    selectBlock,
    removeBlock,
    reorderBlocks,
    addAmrapBlock,
    addEmomBlock,
    addTabataBlock,
    addForTimeBlock,
    addCardioBlock,
    updateStrengthBlock,
    setBlockResult,

    // Exercise-based methods (backward compatibility)
    selectExercise,
    completeSet,
    addExercise,
    removeExercise,
    updateExercise,
    addSet,
    removeSet,
    duplicateSet,
    setSetCount,
    updateSetValue,
    reorderExercises,

    // Set activation (for mode transitions)
    activateSet,
  }
}
