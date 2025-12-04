import { computed, ref } from 'vue'
import { useExercisesStore } from '@/stores/exercises'
import type {
  AmrapBlock,
  AmrapConfig,
  AmrapResult,
  BlockExercise,
  EmomBlock,
  EmomConfig,
  EmomResult,
  ForTimeBlock,
  ForTimeConfig,
  ForTimeResult,
  StrengthBlock,
  TabataBlock,
  TabataConfig,
  TabataResult,
  WorkoutBlock,
  WorkoutMode,
} from '@/types/blocks'
import { isStrengthBlock, isTimedBlock } from '@/types/blocks'

export type SetStatus = 'completed' | 'active' | 'planned'

export type Set = {
  id: number
  kg: string
  reps: string
  rir: string
  status: SetStatus
}

export type Workout = {
  id: number
  name: string
  blocks: Array<WorkoutBlock>
  selectedBlockIndex: number
  startedAt: number
  mode: WorkoutMode
  activeSetIndex: number | null
}

type CompleteSetResult =
  | { kind: 'completed'; nextAction: 'next-set'; blockIndex: number; setId: number }
  | { kind: 'completed'; nextAction: 'next-block'; blockIndex: number }
  | { kind: 'completed'; nextAction: 'workout-complete' }
  | { kind: 'uncompleted' }

export function isSetReady(set: Readonly<Set>): boolean {
  const kg = Number(set.kg)
  const reps = Number(set.reps)
  const rir = Number(set.rir)
  return kg > 0 && reps > 0 && rir >= 0 && set.rir !== ''
}

function createInitialWorkout(): Workout {
  return {
    id: 1,
    name: 'New Workout',
    blocks: [],
    selectedBlockIndex: -1,
    startedAt: Date.now(),
    mode: 'builder',
    activeSetIndex: null,
  }
}

// Singleton state - shared across all components
const workout = ref<Workout>(createInitialWorkout())

/**
 * Reset the workout to initial empty state.
 */
export function resetWorkout() {
  workout.value = createInitialWorkout()
}

/**
 * Restore a workout from saved state (used for resuming from DB).
 */
export function restoreWorkout(savedWorkout: Workout) {
  workout.value = savedWorkout
}

/**
 * Get the raw workout ref for persistence layer.
 */
export function getWorkoutRef() {
  return workout
}

/**
 * Generate a unique block ID.
 */
function generateBlockId(): number {
  const ids = workout.value.blocks.map((b) => b.id)
  return ids.length > 0 ? Math.max(...ids) + 1 : 1
}

/**
 * Immutably update the workout object properties.
 */
function updateWorkout(updates: Partial<Workout>): void {
  workout.value = { ...workout.value, ...updates }
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
    blocks: workout.value.blocks.map((b, i) => (i === blockIndex ? updatedBlock : b)),
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

export function useWorkout() {
  const selectedBlock = computed(() => {
    if (workout.value.selectedBlockIndex < 0) return undefined
    return workout.value.blocks[workout.value.selectedBlockIndex]
  })

  // For backward compatibility - returns the selected block if it's a strength block
  const selectedExercise = computed(() => {
    const block = selectedBlock.value
    if (!block || !isStrengthBlock(block)) return undefined
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
    if (index >= 0) {
      updateWorkout({ selectedBlockIndex: index })
    }
  }

  // Helper: Find the first incomplete set in a strength block
  function findNextIncompleteSet(block: StrengthBlock): Set | undefined {
    return block.sets.find((s) => s.status === 'planned' || s.status === 'active')
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
      kg: s.kg || completedSet.kg,
      reps: s.reps || completedSet.reps,
      rir: s.rir || completedSet.rir,
      status: 'active',
    }))

    const nextSetIndex = block.sets.findIndex((s) => s.id === nextSet.id)
    if (nextSetIndex >= 0) {
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

  function completeSet(set: Set): CompleteSetResult {
    const blockIndex = workout.value.selectedBlockIndex

    // Guard: Toggle completed set back to active
    if (set.status === 'completed') {
      updateSetInBlock(blockIndex, set.id, (s) => ({ ...s, status: 'active' }))
      return { kind: 'uncompleted' }
    }

    // Guard: Reject invalid sets
    if (!isSetReady(set)) return { kind: 'uncompleted' }

    // Mark as completed
    updateSetInBlock(blockIndex, set.id, (s) => ({ ...s, status: 'completed' }))

    // Get current block (re-fetch after update)
    const currentBlock = workout.value.blocks[blockIndex]
    if (!currentBlock || !isStrengthBlock(currentBlock)) {
      return { kind: 'completed', nextAction: 'workout-complete' }
    }

    // Try: Activate next set in current block
    const nextSetResult = activateNextSetInBlock(blockIndex, currentBlock, set)
    if (nextSetResult) return nextSetResult

    // Try: Advance to next block
    const nextBlockResult = advanceToNextBlock(blockIndex + 1)
    if (nextBlockResult) return nextBlockResult

    // Fallback: Workout complete
    return { kind: 'completed', nextAction: 'workout-complete' }
  }

  function addExercise(exerciseId: string, name: string) {
    if (!name.trim()) return

    const exercisesStore = useExercisesStore()
    const exercise = exercisesStore.getExerciseById(exerciseId)
    const icon = exercise?.icon ?? '🆕'

    const newBlock: StrengthBlock = {
      kind: 'strength',
      id: generateBlockId(),
      exerciseDefinitionId: exerciseId,
      name,
      equipment: 'Equipment',
      targetReps: 8,
      thumbnail: icon,
      sets: [
        { id: 1, kg: '', reps: '', rir: '', status: 'active' },
        { id: 2, kg: '', reps: '', rir: '', status: 'planned' },
        { id: 3, kg: '', reps: '', rir: '', status: 'planned' },
      ],
    }

    const newBlocks = [...workout.value.blocks, newBlock]
    updateWorkout({ blocks: newBlocks, selectedBlockIndex: newBlocks.length - 1 })
  }

  function addAmrapBlock(config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>) {
    const newBlock: AmrapBlock = {
      kind: 'amrap',
      id: generateBlockId(),
      config,
      exercises: [...exercises],
      result: null,
    }

    const newBlocks = [...workout.value.blocks, newBlock]
    updateWorkout({ blocks: newBlocks, selectedBlockIndex: newBlocks.length - 1 })
  }

  function addEmomBlock(config: EmomConfig, exercises: ReadonlyArray<BlockExercise>) {
    const newBlock: EmomBlock = {
      kind: 'emom',
      id: generateBlockId(),
      config,
      exercises: [...exercises],
      result: null,
    }

    const newBlocks = [...workout.value.blocks, newBlock]
    updateWorkout({ blocks: newBlocks, selectedBlockIndex: newBlocks.length - 1 })
  }

  function addTabataBlock(config: TabataConfig, exercise: BlockExercise) {
    const newBlock: TabataBlock = {
      kind: 'tabata',
      id: generateBlockId(),
      config,
      exercise,
      result: null,
    }

    const newBlocks = [...workout.value.blocks, newBlock]
    updateWorkout({ blocks: newBlocks, selectedBlockIndex: newBlocks.length - 1 })
  }

  function addForTimeBlock(config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>) {
    const newBlock: ForTimeBlock = {
      kind: 'fortime',
      id: generateBlockId(),
      config,
      exercises: [...exercises],
      result: null,
    }

    const newBlocks = [...workout.value.blocks, newBlock]
    updateWorkout({ blocks: newBlocks, selectedBlockIndex: newBlocks.length - 1 })
  }

  function removeBlock(blockIndex: number) {
    if (blockIndex < 0 || blockIndex >= workout.value.blocks.length) return

    const filtered = workout.value.blocks.filter((_, i) => i !== blockIndex)
    const currentSelected = workout.value.selectedBlockIndex

    // Calculate new selected index using ternary chain
    const newSelectedIndex =
      filtered.length === 0
        ? -1
        : currentSelected >= filtered.length
          ? Math.max(0, filtered.length - 1)
          : currentSelected > blockIndex
            ? currentSelected - 1
            : currentSelected

    updateWorkout({ blocks: filtered, selectedBlockIndex: newSelectedIndex })
  }

  // For backward compatibility
  function removeExercise(exerciseId: number) {
    const index = workout.value.blocks.findIndex((b) => isStrengthBlock(b) && b.id === exerciseId)
    if (index >= 0) {
      removeBlock(index)
    }
  }

  function updateStrengthBlock(
    updates: Partial<Pick<StrengthBlock, 'name' | 'equipment' | 'targetReps'>>,
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
    updates: Partial<Pick<StrengthBlock, 'name' | 'equipment' | 'targetReps'>>,
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
        sets: [...b.sets, { id: newId, kg: '', reps: '', rir: '', status: 'planned' as const }],
      }
    })
  }

  function removeSet(blockIndex: number, setId: number) {
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block) || block.sets.length <= 1) return

    updateBlockAtIndex(blockIndex, (b) => {
      if (!isStrengthBlock(b)) return b
      return { ...b, sets: b.sets.filter((s) => s.id !== setId) }
    })
  }

  function setSetCount(blockIndex: number, count: number) {
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block)) return

    const targetCount = Math.max(1, count)
    const currentCount = block.sets.length

    if (targetCount > currentCount) {
      for (let i = 0; i < targetCount - currentCount; i++) {
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

  function updateSetValue(setId: number, field: 'kg' | 'reps' | 'rir', value: number | undefined) {
    const blockIndex = workout.value.selectedBlockIndex
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block)) return

    const set = block.sets.find((s) => s.id === setId)
    if (!set) return

    updateSetInBlock(blockIndex, setId, (s) => ({
      ...s,
      [field]: value !== undefined ? String(value) : '',
    }))
  }

  function reorderBlocks(fromIndex: number, toIndex: number) {
    const blocks = [...workout.value.blocks]
    const movedBlock = blocks[fromIndex]
    if (!movedBlock) return

    blocks.splice(fromIndex, 1)
    blocks.splice(toIndex, 0, movedBlock)

    const currentSelected = workout.value.selectedBlockIndex

    // Calculate new selected index using ternary chain
    const newSelectedIndex =
      currentSelected === fromIndex
        ? toIndex
        : fromIndex < currentSelected && toIndex >= currentSelected
          ? currentSelected - 1
          : fromIndex > currentSelected && toIndex <= currentSelected
            ? currentSelected + 1
            : currentSelected

    updateWorkout({ blocks, selectedBlockIndex: newSelectedIndex })
  }

  // For backward compatibility
  function reorderExercises(fromIndex: number, toIndex: number) {
    reorderBlocks(fromIndex, toIndex)
  }

  // Set result for a timed block
  function setBlockResult(
    blockIndex: number,
    result: AmrapResult | EmomResult | TabataResult | ForTimeResult,
  ) {
    const block = workout.value.blocks[blockIndex]
    if (!block || !isTimedBlock(block)) return

    // Use switch to narrow block type and assign correctly-typed result
    switch (block.kind) {
      case 'amrap':
        if ('rounds' in result) {
          updateBlockAtIndex(blockIndex, () => ({ ...block, result }))
        }
        break
      case 'emom':
        if ('completedMinutes' in result) {
          updateBlockAtIndex(blockIndex, () => ({ ...block, result }))
        }
        break
      case 'tabata':
        if ('repsPerRound' in result) {
          updateBlockAtIndex(blockIndex, () => ({ ...block, result }))
        }
        break
      case 'fortime':
        if ('completionTime' in result) {
          updateBlockAtIndex(blockIndex, () => ({ ...block, result }))
        }
        break
    }
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
    setSetCount,
    updateSetValue,
    reorderExercises,
  }
}
