import { computed } from 'vue'
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
} from '@/types/blocks'
import { isStrengthBlock, isTimedBlock } from '@/types/blocks'
import type { PrefillableSetFields, Set, Workout } from '@/types/workout'

// Re-export from shared locations for backward compatibility
export type { Set, Workout } from '@/types/workout'
export { getWorkoutRef, resetWorkout, restoreWorkout } from '@/stores/workoutState'

// Get reference to shared workout singleton
const workout = getWorkoutRef()

type CompleteSetResult =
  | { kind: 'completed'; nextAction: 'next-set'; blockIndex: number; setId: number }
  | { kind: 'completed'; nextAction: 'next-block'; blockIndex: number }
  | { kind: 'completed'; nextAction: 'workout-complete' }
  | { kind: 'uncompleted' }

export function isSetReady(set: Readonly<Set>): boolean {
  const kg = Number(set.kg)
  const reps = Number(set.reps)
  const rir = Number(set.rir)
  // Allow 0 weight for bodyweight exercises, but require reps > 0
  return set.kg !== '' && kg >= 0 && reps > 0 && rir >= 0 && set.rir !== ''
}

/**
 * Check if an isometric/duration-based set is ready to be marked complete.
 * Requires duration > 0 (weight and RIR are optional for isometric exercises).
 */
export function isSetReadyForDuration(set: Readonly<Set>): boolean {
  const duration = Number(set.duration)
  return set.duration !== '' && duration > 0
}

/**
 * Immutably update the workout object properties.
 */
function updateWorkout(updates: Partial<Workout>): void {
  workout.value = { ...workout.value, ...updates }
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
  const block = workout.value.blocks[blockIndex]
  if (!block) return
  const updatedBlock = updater(block)
  workout.value = {
    ...workout.value,
    blocks: workout.value.blocks.map((b, index) => (index === blockIndex ? updatedBlock : b)),
  }
}

/**
 * Immutably update a set within a strength block.
 */
function updateSetInBlock(blockIndex: number, setId: number, updater: (set: Set) => Set): void {
  updateBlockAtIndex(blockIndex, (block) => {
    if (!isStrengthBlock(block)) return block
    return {
      ...block,
      sets: block.sets.map((s) => (s.id === setId ? updater(s) : s)),
    }
  })
}

/**
 * Find the first incomplete set in a strength block.
 */
function findNextIncompleteSet(block: StrengthBlock): Set | undefined {
  return block.sets.find((s) => s.status === 'planned' || s.status === 'active')
}

/**
 * Check if a block is complete.
 * - Strength blocks: all sets must have status 'completed'
 * - Timed blocks (amrap, emom, tabata, fortime): result must not be null
 * - Cardio blocks: result must not be null
 */
function isBlockComplete(block: WorkoutBlock): boolean {
  if (isStrengthBlock(block)) {
    return block.sets.every((s) => s.status === 'completed')
  }
  // Timed and cardio blocks are complete when they have a result
  return block.result !== null
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
function createFirstSetFromHistory(lastSet: { kg: number; reps: number; duration: number; rir: number | null } | undefined): Set {
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
 * Find the first incomplete block in the workout.
 * Returns the block index, or -1 if all blocks are complete.
 */
function findFirstIncompleteBlockIndex(blocks: ReadonlyArray<WorkoutBlock>): number {
  return blocks.findIndex((block) => !isBlockComplete(block))
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

  /**
   * Apply prefill values from source set to target set.
   * Uses "keep if exists, else use prefill" logic.
   * TypeScript's `satisfies` ensures all prefillable fields are handled.
   */
  function applyPrefillToSet(
    target: Readonly<Set>,
    source: Readonly<Set>,
  ): PrefillableSetFields {
    return {
      kg: target.kg || source.kg,
      reps: target.reps || source.reps,
      duration: target.duration || source.duration,
      rir: target.rir || source.rir,
    } satisfies PrefillableSetFields
  }

  // Helper: Activate the next set in current block, pre-filling from completed set
  function activateNextSetInBlock(
    blockIndex: number,
    block: StrengthBlock,
    completedSet: Set,
  ): CompleteSetResult | null {
    const nextSet = findNextIncompleteSet(block)
    if (!nextSet) return null

    updateSetInBlock(blockIndex, nextSet.id, (s) => ({
      ...s,
      ...applyPrefillToSet(s, completedSet),
      status: 'active',
    }))

    const nextSetIndex = block.sets.findIndex((s) => s.id === nextSet.id)
    if (nextSetIndex !== -1) {
      updateWorkout({ activeSetIndex: nextSetIndex })
    }

    return {
      kind: 'completed',
      nextAction: 'next-set',
      blockIndex,
      setId: nextSet.id,
    }
  }

  // Helper: Advance to next block and activate its first set if strength
  function advanceToNextBlock(nextBlockIndex: number): CompleteSetResult | null {
    if (nextBlockIndex >= workout.value.blocks.length) return null

    updateWorkout({ selectedBlockIndex: nextBlockIndex })
    const nextBlock = workout.value.blocks[nextBlockIndex]

    if (nextBlock && isStrengthBlock(nextBlock)) {
      const firstSet = findNextIncompleteSet(nextBlock)
      if (firstSet) {
        updateSetInBlock(nextBlockIndex, firstSet.id, (s) => ({ ...s, status: 'active' }))
        updateWorkout({ activeSetIndex: 0 })
      }
    }

    return { kind: 'completed', nextAction: 'next-block', blockIndex: nextBlockIndex }
  }

  // Helper: Navigate to next workout item after completing a set
  function navigateAfterSetComplete(
    blockIndex: number,
    block: StrengthBlock,
    completedSet: Set,
  ): CompleteSetResult {
    // Try: next set in current block
    const nextSetResult = activateNextSetInBlock(blockIndex, block, completedSet)
    if (nextSetResult) return nextSetResult

    // Try: next block
    const nextBlockResult = advanceToNextBlock(blockIndex + 1)
    if (nextBlockResult) return nextBlockResult

    // Try: first incomplete block (user may have skipped earlier blocks)
    const firstIncompleteIndex = findFirstIncompleteBlockIndex(workout.value.blocks)
    if (firstIncompleteIndex !== -1) {
      const incompleteBlockResult = advanceToNextBlock(firstIncompleteIndex)
      if (incompleteBlockResult) return incompleteBlockResult
    }

    return { kind: 'completed', nextAction: 'workout-complete' }
  }

  function completeSet(set: Set): CompleteSetResult {
    const blockIndex = workout.value.selectedBlockIndex
    const currentBlock = workout.value.blocks[blockIndex]

    // Guard: Toggle completed set back to active
    if (set.status === 'completed') {
      updateSetInBlock(blockIndex, set.id, (s) => ({ ...s, status: 'active' }))
      return { kind: 'uncompleted' }
    }

    // Guard: Reject invalid sets (use appropriate check based on exercise metrics)
    const isDurationBased = currentBlock ? shouldUseDurationValidation(currentBlock) : false
    const isReady = isDurationBased ? isSetReadyForDuration(set) : isSetReady(set)
    if (!isReady) return { kind: 'uncompleted' }

    // Mark as completed
    updateSetInBlock(blockIndex, set.id, (s) => ({ ...s, status: 'completed' }))

    // Get current block (re-fetch after update) and navigate
    const updatedBlock = workout.value.blocks[blockIndex]
    if (!updatedBlock || !isStrengthBlock(updatedBlock)) {
      return { kind: 'completed', nextAction: 'workout-complete' }
    }

    return navigateAfterSetComplete(blockIndex, updatedBlock, set)
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
      createForTimeWorkoutBlock(config, blockExercises, getNextWorkoutBlockId(workout.value.blocks)),
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
    updates: Partial<Pick<StrengthBlock, 'name' | 'equipment' | 'targetReps' | 'targetDuration' | 'targetWeight'>>,
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
    updates: Partial<Pick<StrengthBlock, 'name' | 'equipment' | 'targetReps' | 'targetDuration' | 'targetWeight'>>,
  ) {
    updateStrengthBlock(updates)
  }

  function addSet(blockIndex: number) {
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block)) return

    updateBlockAtIndex(blockIndex, (b) => {
      if (!isStrengthBlock(b)) return b
      const setIds = b.sets.map((s) => s.id)
      const newId = setIds.length > 0 ? Math.max(...setIds) + 1 : 1
      return {
        ...b,
        sets: [...b.sets, { id: newId, kg: '', reps: '', duration: '', rir: '', status: 'planned' as const }],
      }
    })
  }

  function removeSet(blockIndex: number, setId: number) {
    const block = workout.value.blocks[blockIndex]
    const isCannotRemoveSet = !block || !isStrengthBlock(block) || block.sets.length <= 1
    if (isCannotRemoveSet) return

    updateBlockAtIndex(blockIndex, (b) => {
      if (!isStrengthBlock(b)) return b
      return { ...b, sets: b.sets.filter((s) => s.id !== setId) }
    })
  }

  function duplicateSet(blockIndex: number, setId: number) {
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block)) return

    const setIndex = block.sets.findIndex((s) => s.id === setId)
    const originalSet = block.sets[setIndex]
    if (setIndex === -1 || !originalSet) return

    // Adjust activeSetIndex if needed - only when duplicating in the currently selected block
    const activeSetIndex = workout.value.activeSetIndex
    const isSelectedBlock = blockIndex === workout.value.selectedBlockIndex
    const shouldShiftActiveIndex =
      isSelectedBlock && activeSetIndex !== null && activeSetIndex > setIndex
    if (shouldShiftActiveIndex) {
      updateWorkout({ activeSetIndex: activeSetIndex + 1 })
    }

    updateBlockAtIndex(blockIndex, (b) => {
      if (!isStrengthBlock(b)) return b
      const setIds = b.sets.map((s) => s.id)
      const newId = setIds.length > 0 ? Math.max(...setIds) + 1 : 1
      const newSet: Set = {
        id: newId,
        kg: originalSet.kg,
        reps: originalSet.reps,
        duration: originalSet.duration,
        rir: originalSet.rir,
        status: 'planned' as const,
      }
      // Insert after the original set
      const newSets = [...b.sets]
      newSets.splice(setIndex + 1, 0, newSet)
      return { ...b, sets: newSets }
    })
  }

  function activateSet(blockIndex: number, setIndex: number) {
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block)) return

    const set = block.sets[setIndex]
    if (!set || set.status !== 'planned') return

    updateSetInBlock(blockIndex, set.id, (s) => ({ ...s, status: 'active' }))
    updateWorkout({ activeSetIndex: setIndex })
  }

  function setSetCount(blockIndex: number, count: number) {
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block)) return

    const targetCount = Math.max(1, count)
    const currentCount = block.sets.length

    if (targetCount > currentCount) {
      for (let index = 0; index < targetCount - currentCount; index++) {
        addSet(blockIndex)
      }
      return
    }

    if (targetCount < currentCount) {
      updateBlockAtIndex(blockIndex, (b) => {
        if (!isStrengthBlock(b)) return b
        return { ...b, sets: b.sets.slice(0, targetCount) }
      })
    }
  }

  function updateSetValue(setId: number, field: 'kg' | 'reps' | 'duration' | 'rir', value: number | undefined) {
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
