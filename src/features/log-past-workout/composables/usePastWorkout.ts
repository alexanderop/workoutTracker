import { ref, shallowRef } from 'vue'
import { createGlobalState } from '@vueuse/core'
import type {
  WorkoutBlock,
  BlockExercise,
  AmrapConfig,
  EmomConfig,
  TabataConfig,
  ForTimeConfig,
  CardioConfig,
} from '@/types/blocks'
import { isStrengthBlock } from '@/types/blocks'
import type { Set } from '@/types/workout'
import { getTemplatesRepository } from '@/db'
import { getWorkoutsRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import {
  createAmrapWorkoutBlock,
  createCardioWorkoutBlock,
  createEmomWorkoutBlock,
  createForTimeWorkoutBlock,
  createTabataWorkoutBlock,
  createWorkoutBlockFromHistory,
  createWorkoutBlockFromTemplate,
} from '@/lib/workoutBlockFactory'

/**
 * Calculate the new selected index after deleting an item from a list.
 */
function calculateIndexAfterDeletion(
  currentSelected: number,
  deletedIndex: number,
  newLength: number,
): number {
  if (newLength === 0) return -1
  if (currentSelected >= newLength) return newLength - 1
  if (currentSelected > deletedIndex) return currentSelected - 1
  return currentSelected
}

/**
 * Calculate the new selected index after reordering items in a list.
 */
function calculateIndexAfterReorder(
  currentSelected: number,
  fromIndex: number,
  toIndex: number,
): number {
  if (currentSelected === fromIndex) return toIndex
  if (fromIndex < currentSelected && toIndex >= currentSelected) return currentSelected - 1
  if (fromIndex > currentSelected && toIndex <= currentSelected) return currentSelected + 1
  return currentSelected
}

/**
 * Creates a new set based on the previous set's values (or defaults).
 */
function createNewSetFromPrevious(setId: number, previousSet: Set | undefined): Set {
  return {
    id: setId,
    kg: previousSet?.kg ?? '',
    reps: previousSet?.reps ?? '',
    duration: previousSet?.duration ?? '',
    rir: previousSet?.rir ?? '',
    status: 'completed',
  }
}

/**
 * Composable for managing past workout state during hindsight logging.
 * Provides state management for the multi-step past workout entry flow.
 * Uses createGlobalState to ensure singleton state across components.
 */
export const usePastWorkout = createGlobalState(() => {
  const workoutName = ref('')
  const workoutDate = ref(new Date())
  const durationMinutes = ref(45)
  const blocks = shallowRef<Array<WorkoutBlock>>([])
  const selectedBlockIndex = ref(-1)
  const sourceType = ref<'template' | 'history' | 'blank' | undefined>(undefined)
  const sourceId = ref<string | undefined>(undefined)

  /**
   * Generates a unique block ID based on existing blocks.
   */
  function generateBlockId(): number {
    const ids = blocks.value.map((b) => b.id)
    return ids.length > 0 ? Math.max(...ids) + 1 : 1
  }

  /**
   * Selects a block by index.
   */
  function selectBlock(index: number): void {
    if (index >= -1 && index < blocks.value.length) {
      selectedBlockIndex.value = index
    }
  }

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
      .map((block, index) => createWorkoutBlockFromTemplate(block, index + 1))

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
      .map((block, index) => createWorkoutBlockFromHistory(block, index + 1))

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
   * Adds a new block to the workout and selects it.
   */
  function addBlock(block: WorkoutBlock): void {
    const newId = generateBlockId()
    const newBlocks = [...blocks.value, { ...block, id: newId }]
    blocks.value = newBlocks
    selectedBlockIndex.value = newBlocks.length - 1
  }

  /**
   * Adds an AMRAP block.
   */
  function addAmrapBlock(config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>): void {
    appendNewBlock(createAmrapWorkoutBlock(config, exercises, generateBlockId()))
  }

  /**
   * Adds an EMOM block.
   */
  function addEmomBlock(config: EmomConfig, exercises: ReadonlyArray<BlockExercise>): void {
    appendNewBlock(createEmomWorkoutBlock(config, exercises, generateBlockId()))
  }

  /**
   * Adds a Tabata block.
   */
  function addTabataBlock(config: TabataConfig, exercise: BlockExercise): void {
    appendNewBlock(createTabataWorkoutBlock(config, exercise, generateBlockId()))
  }

  /**
   * Adds a For Time block.
   */
  function addForTimeBlock(config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>): void {
    appendNewBlock(createForTimeWorkoutBlock(config, exercises, generateBlockId()))
  }

  /**
   * Adds a Cardio block.
   */
  function addCardioBlock(config: CardioConfig): void {
    appendNewBlock(createCardioWorkoutBlock(config, generateBlockId()))
  }

  function appendNewBlock(block: WorkoutBlock): void {
    const newBlocks = [...blocks.value, block]
    blocks.value = newBlocks
    selectedBlockIndex.value = newBlocks.length - 1
  }

  /**
   * Removes a block by its ID.
   */
  function removeBlock(blockId: number): void {
    blocks.value = blocks.value.filter((b) => b.id !== blockId)
  }

  /**
   * Removes a block by its index.
   */
  function removeBlockByIndex(index: number): void {
    if (index < 0 || index >= blocks.value.length) return

    const filtered = blocks.value.filter((_, index_) => index_ !== index)
    const currentSelected = selectedBlockIndex.value

    blocks.value = filtered
    selectedBlockIndex.value = calculateIndexAfterDeletion(currentSelected, index, filtered.length)
  }

  /**
   * Reorders blocks by moving a block from one index to another.
   */
  function reorderBlocks(fromIndex: number, toIndex: number): void {
    const newBlocks = [...blocks.value]
    const movedBlock = newBlocks[fromIndex]
    if (!movedBlock) return

    newBlocks.splice(fromIndex, 1)
    newBlocks.splice(toIndex, 0, movedBlock)
    blocks.value = newBlocks

    selectedBlockIndex.value = calculateIndexAfterReorder(selectedBlockIndex.value, fromIndex, toIndex)
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

      const newSets = block.sets.map((set, index) => {
        if (index !== setIndex) {
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

      const newSet = createNewSetFromPrevious(block.sets.length + 1, block.sets.at(-1))

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

      const newSets = block.sets.filter((_, index) => index !== setIndex)

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
    selectedBlockIndex.value = -1
    sourceType.value = undefined
    sourceId.value = undefined
  }

  return {
    // State
    workoutName,
    workoutDate,
    durationMinutes,
    blocks,
    selectedBlockIndex,
    sourceType,
    sourceId,

    // Actions
    loadFromTemplate,
    loadFromHistory,
    startBlank,
    addBlock,
    addAmrapBlock,
    addEmomBlock,
    addTabataBlock,
    addForTimeBlock,
    addCardioBlock,
    removeBlock,
    removeBlockByIndex,
    reorderBlocks,
    selectBlock,
    updateStrengthSets,
    updateSet,
    addSetToBlock,
    removeSetFromBlock,
    reset,
  }
})
