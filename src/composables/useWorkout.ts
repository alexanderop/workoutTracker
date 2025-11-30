import { computed, ref } from 'vue'
import { popularExercises } from '@/data/popularExercises'
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

// Legacy Exercise type - now maps to StrengthBlock
export type Exercise = {
  id: number
  name: string
  equipment: string
  targetReps: number
  sets: Array<Set>
  thumbnail: string
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

export type CompleteSetResult =
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
      workout.value.selectedBlockIndex = blockIndex
    }
  }

  // For backward compatibility with exercise selection by ID
  function selectExercise(exerciseId: number) {
    const index = workout.value.blocks.findIndex((b) => isStrengthBlock(b) && b.id === exerciseId)
    if (index >= 0) {
      workout.value.selectedBlockIndex = index
    }
  }

  function completeSet(set: Set): CompleteSetResult {
    // If already completed, toggle back to active (no timer start)
    if (set.status === 'completed') {
      set.status = 'active'
      return { kind: 'uncompleted' }
    }

    // Validate before completing - reject empty/invalid sets
    if (!isSetReady(set)) {
      return { kind: 'uncompleted' }
    }

    // Mark as completed
    set.status = 'completed'

    // Find current strength block
    const currentBlock = selectedBlock.value
    if (!currentBlock || !isStrengthBlock(currentBlock)) {
      return { kind: 'completed', nextAction: 'workout-complete' }
    }

    // Find next incomplete set in current block
    const nextSet = currentBlock.sets.find((s) => s.status === 'planned' || s.status === 'active')

    if (nextSet) {
      // Pre-fill empty fields from completed set
      if (!nextSet.kg) nextSet.kg = set.kg
      if (!nextSet.reps) nextSet.reps = set.reps
      if (!nextSet.rir) nextSet.rir = set.rir

      nextSet.status = 'active'

      // Update activeSetIndex to point to the next set
      const nextSetIndex = currentBlock.sets.findIndex((s) => s.id === nextSet.id)
      if (nextSetIndex >= 0) {
        workout.value.activeSetIndex = nextSetIndex
      }

      return {
        kind: 'completed',
        nextAction: 'next-set',
        blockIndex: workout.value.selectedBlockIndex,
        setId: nextSet.id,
      }
    }

    // No more sets - find next block
    const currentIndex = workout.value.selectedBlockIndex
    const nextBlockIndex = currentIndex + 1

    if (nextBlockIndex < workout.value.blocks.length) {
      workout.value.selectedBlockIndex = nextBlockIndex
      const nextBlock = workout.value.blocks[nextBlockIndex]

      // If next block is a strength block, activate its first set
      if (nextBlock && isStrengthBlock(nextBlock)) {
        const firstSet = nextBlock.sets.find((s) => s.status === 'planned' || s.status === 'active')
        if (firstSet) {
          firstSet.status = 'active'
          workout.value.activeSetIndex = 0
        }
      }

      return {
        kind: 'completed',
        nextAction: 'next-block',
        blockIndex: nextBlockIndex,
      }
    }

    // Workout complete - no more blocks
    return { kind: 'completed', nextAction: 'workout-complete' }
  }

  function addExercise(name: string) {
    if (!name.trim()) return

    const exercisesStore = useExercisesStore()
    const popularExercise = popularExercises.find((e) => e.name === name)
    const customExercise = exercisesStore.customExercises.find((e) => e.name === name)
    const icon = popularExercise?.icon ?? customExercise?.icon ?? '🆕'

    const newBlock: StrengthBlock = {
      kind: 'strength',
      id: generateBlockId(),
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

    workout.value.blocks = [...workout.value.blocks, newBlock]
    workout.value.selectedBlockIndex = workout.value.blocks.length - 1
  }

  function addAmrapBlock(config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>) {
    const newBlock: AmrapBlock = {
      kind: 'amrap',
      id: generateBlockId(),
      config,
      exercises: [...exercises],
      result: null,
    }

    workout.value.blocks = [...workout.value.blocks, newBlock]
    workout.value.selectedBlockIndex = workout.value.blocks.length - 1
  }

  function addEmomBlock(config: EmomConfig, exercises: ReadonlyArray<BlockExercise>) {
    const newBlock: EmomBlock = {
      kind: 'emom',
      id: generateBlockId(),
      config,
      exercises: [...exercises],
      result: null,
    }

    workout.value.blocks = [...workout.value.blocks, newBlock]
    workout.value.selectedBlockIndex = workout.value.blocks.length - 1
  }

  function addTabataBlock(config: TabataConfig, exercise: BlockExercise) {
    const newBlock: TabataBlock = {
      kind: 'tabata',
      id: generateBlockId(),
      config,
      exercise,
      result: null,
    }

    workout.value.blocks = [...workout.value.blocks, newBlock]
    workout.value.selectedBlockIndex = workout.value.blocks.length - 1
  }

  function addForTimeBlock(config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>) {
    const newBlock: ForTimeBlock = {
      kind: 'fortime',
      id: generateBlockId(),
      config,
      exercises: [...exercises],
      result: null,
    }

    workout.value.blocks = [...workout.value.blocks, newBlock]
    workout.value.selectedBlockIndex = workout.value.blocks.length - 1
  }

  function removeBlock(blockIndex: number) {
    if (blockIndex < 0 || blockIndex >= workout.value.blocks.length) return

    const filtered = workout.value.blocks.filter((_, i) => i !== blockIndex)
    workout.value.blocks = filtered

    // Handle empty list first
    if (filtered.length === 0) {
      workout.value.selectedBlockIndex = -1
      return
    }

    // Adjust selected index
    if (workout.value.selectedBlockIndex >= filtered.length) {
      workout.value.selectedBlockIndex = Math.max(0, filtered.length - 1)
      return
    }

    if (workout.value.selectedBlockIndex > blockIndex) {
      workout.value.selectedBlockIndex--
    }
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
    const block = selectedBlock.value
    if (!block || !isStrengthBlock(block)) return
    Object.assign(block, updates)
  }

  // For backward compatibility
  function updateExercise(updates: Partial<Pick<Exercise, 'name' | 'equipment' | 'targetReps'>>) {
    updateStrengthBlock(updates)
  }

  function addSet(blockIndex: number) {
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block)) return

    const setIds = block.sets.map((s) => s.id)
    const newId = setIds.length > 0 ? Math.max(...setIds) + 1 : 1
    block.sets = [
      ...block.sets,
      {
        id: newId,
        kg: '',
        reps: '',
        rir: '',
        status: 'planned',
      },
    ]
  }

  function removeSet(blockIndex: number, setId: number) {
    const block = workout.value.blocks[blockIndex]
    if (!block || !isStrengthBlock(block) || block.sets.length <= 1) return

    block.sets = block.sets.filter((s) => s.id !== setId)
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
      block.sets = block.sets.slice(0, targetCount)
    }
  }

  function updateSetValue(setId: number, field: 'kg' | 'reps' | 'rir', value: number | undefined) {
    const block = selectedBlock.value
    if (!block || !isStrengthBlock(block)) return

    const set = block.sets.find((s) => s.id === setId)
    if (set) {
      set[field] = value !== undefined ? String(value) : ''
    }
  }

  function reorderBlocks(fromIndex: number, toIndex: number) {
    const blocks = [...workout.value.blocks]
    const movedBlock = blocks[fromIndex]
    if (!movedBlock) return

    blocks.splice(fromIndex, 1)
    blocks.splice(toIndex, 0, movedBlock)
    workout.value.blocks = blocks

    // Update selected index if needed
    if (workout.value.selectedBlockIndex === fromIndex) {
      workout.value.selectedBlockIndex = toIndex
      return
    }

    if (
      fromIndex < workout.value.selectedBlockIndex &&
      toIndex >= workout.value.selectedBlockIndex
    ) {
      workout.value.selectedBlockIndex--
      return
    }

    if (
      fromIndex > workout.value.selectedBlockIndex &&
      toIndex <= workout.value.selectedBlockIndex
    ) {
      workout.value.selectedBlockIndex++
    }
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

    // Type guard based on result shape to assign correctly
    if (block.kind === 'amrap' && 'rounds' in result) {
      block.result = result
      return
    }
    if (block.kind === 'emom' && 'completedMinutes' in result) {
      block.result = result
      return
    }
    if (block.kind === 'tabata' && 'repsPerRound' in result) {
      block.result = result
      return
    }
    if (block.kind === 'fortime' && 'completionTime' in result) {
      block.result = result
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
