import { createGlobalState } from '@vueuse/core'
import { computed, readonly, ref, type ComputedRef, type Ref } from 'vue'
import { getExerciseProgressRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import { useExercisesStore } from '@/stores/exercises'
import { getWorkoutRef, restoreWorkout } from '@/stores/workoutState'
import {
  isStrengthBlock,
  type AmrapConfig,
  type BlockExercise,
  type CardioConfig,
  type CardioResult,
  type EmomConfig,
  type ForTimeConfig,
  type StrengthBlock,
  type TabataConfig,
  type WorkoutBlock,
} from '@/types/blocks'
import type { Set, Workout } from '@/types/workout'
import { createEffectRunner, runEffects } from './effects'
import { bucketFor, isBlockComplete, isSetReady, isSetReadyForDuration, reduce } from './reducer'
import type { Command, CompleteSetOutcome, SessionState } from './types'



function deriveSession(
  workout: Ref<Workout>,
  lastOutcome: Ref<CompleteSetOutcome | null>,
): ComputedRef<SessionState> {
  return computed(() => {
    const w = workout.value
    const base = bucketFor(w)
    if (base.status === 'running') {
      return { status: 'running', workout: w, lastOutcome: lastOutcome.value }
    }
    return base
  })
}

export const useWorkoutSession = createGlobalState(() => {
  const workoutRef = getWorkoutRef()
  const lastOutcome = ref<CompleteSetOutcome | null>(null)
  const runner = createEffectRunner(workoutRef)

  const state = deriveSession(workoutRef, lastOutcome)

  function applyNextWorkout(next: SessionState): void {
    if (next.status === 'empty') return
    workoutRef.value = next.workout
    if (next.status === 'running') {
      lastOutcome.value = next.lastOutcome
    }
  }

  function dispatch(cmd: Command): void {
    const result = reduce(state.value, cmd)
    applyNextWorkout(result.next)
    if (result.effects.length > 0) {
      void runEffects(runner, result.effects)
    }
  }

  const workout = computed(() => workoutRef.value)
  const mode = computed(() => workoutRef.value.mode)
  const isBuilderMode = computed(() => mode.value === 'builder')
  const isActiveMode = computed(() => mode.value === 'active')
  const isCompletedMode = computed(() => mode.value === 'completed')
  const isRunning = isActiveMode

  const hasBlocks = computed(() => workoutRef.value.blocks.length > 0)
  const totalBlocks = computed(() => workoutRef.value.blocks.length)
  const currentBlockIndex = computed(() => workoutRef.value.selectedBlockIndex)

  const selectedBlock = computed<WorkoutBlock | undefined>(() => {
    if (workoutRef.value.selectedBlockIndex < 0) return
    return workoutRef.value.blocks[workoutRef.value.selectedBlockIndex]
  })

  const activeBlock = selectedBlock

  const currentBlock = computed<WorkoutBlock | null>(() => {
    const w = workoutRef.value
    if (w.selectedBlockIndex < 0 || w.selectedBlockIndex >= w.blocks.length) return null
    return w.blocks[w.selectedBlockIndex] ?? null
  })

  const activeSet = computed<Set | null>(() => {
    const block = currentBlock.value
    if (!block || !isStrengthBlock(block)) return null
    if (workoutRef.value.activeSetIndex === null) return null
    return block.sets[workoutRef.value.activeSetIndex] ?? null
  })

  const isLastBlock = computed(() => {
    const w = workoutRef.value
    for (let i = w.selectedBlockIndex + 1; i < w.blocks.length; i++) {
      const b = w.blocks[i]
      if (b && !isBlockComplete(b)) return false
    }
    return true
  })

  const hasStarted = computed(() =>
    workoutRef.value.blocks.some((b) => {
      if (isStrengthBlock(b)) return b.sets.some((s) => s.status === 'completed')
      return b.result !== null
    }),
  )

  const lastOutcomeReadonly = readonly(lastOutcome)
  const persistenceState = runner.core.persistenceState
  const hasUnsavedChanges = runner.core.hasUnsavedChanges
  const isInitialized = runner.core.isInitialized

  function newDraft(): void {
    dispatch({ type: 'NewDraft' })
  }

  async function loadActive(): Promise<Workout | null> {
    const loaded = await runner.loadActive()
    if (loaded) {
      restoreWorkout(loaded)
      dispatch({ type: 'LoadActive', workout: loaded })
    }
    return loaded
  }

  async function hasActive(): Promise<boolean> {
    return runner.hasActive()
  }

  function start(): void {
    dispatch({ type: 'StartWorkout', now: Date.now() })
  }

  async function finishWorkout(
    notes = '',
    durationOverrideSeconds?: number,
  ): Promise<ReturnType<typeof runner.completeWorkout>> {
    dispatch({ type: 'FinishWorkout', notes, durationOverrideSeconds })
    return runner.completeWorkout(notes, durationOverrideSeconds)
  }

  function enterCompletionMode(): void {
    workoutRef.value = { ...workoutRef.value, mode: 'completed' }
  }

  async function discard(): Promise<void> {
    dispatch({ type: 'Discard' })
  }

  function returnToBuilder(): void {
    dispatch({ type: 'ReturnToBuilder' })
  }

  async function addStrengthBlock(exerciseId: string, name: string): Promise<void> {
    const trimmed = name.trim()
    if (!trimmed) return
    const exercisesStore = useExercisesStore()
    const exercise = exercisesStore.getExerciseById(exerciseId)
    const [, history] = await tryCatch(
      getExerciseProgressRepository().getExerciseHistory(exerciseId, { limit: 1 }),
    )
    const lastSet = history?.[0]?.sets.at(-1)
    const prefill = lastSet
      ? {
          kg: String(lastSet.kg),
          reps: String(lastSet.reps),
          duration: lastSet.duration > 0 ? String(lastSet.duration) : '',
          rir: lastSet.rir === null ? '' : String(lastSet.rir),
        }
      : undefined

    dispatch({
      type: 'AddStrengthBlock',
      seed: {
        exerciseDefinitionId: exerciseId,
        name: trimmed,
        equipment: exercise?.equipment ?? 'bodyweight',
        image: exercise?.image ?? null,
        prefill,
      },
    })
  }

  function addAmrapBlock(config: AmrapConfig, exercises: ReadonlyArray<BlockExercise>): void {
    dispatch({ type: 'AddAmrapBlock', config, exercises })
  }
  function addEmomBlock(config: EmomConfig, exercises: ReadonlyArray<BlockExercise>): void {
    dispatch({ type: 'AddEmomBlock', config, exercises })
  }
  function addTabataBlock(config: TabataConfig, exercise: BlockExercise): void {
    dispatch({ type: 'AddTabataBlock', config, exercise })
  }
  function addForTimeBlock(config: ForTimeConfig, exercises: ReadonlyArray<BlockExercise>): void {
    dispatch({ type: 'AddForTimeBlock', config, exercises })
  }
  function addCardioBlock(config: CardioConfig): void {
    dispatch({ type: 'AddCardioBlock', config })
  }
  function removeBlock(blockIndex: number): void {
    dispatch({ type: 'RemoveBlock', blockIndex })
  }
  function reorderBlocks(fromIndex: number, toIndex: number): void {
    dispatch({ type: 'ReorderBlocks', fromIndex, toIndex })
  }
  function selectBlock(blockIndex: number): void {
    dispatch({ type: 'SelectBlock', blockIndex })
  }
  function updateStrengthBlock(
    updates: Partial<
      Pick<StrengthBlock, 'name' | 'equipment' | 'targetReps' | 'targetDuration' | 'targetWeight'>
    >,
  ): void {
    dispatch({ type: 'UpdateStrengthBlock', blockIndex: workoutRef.value.selectedBlockIndex, updates })
  }
  function updateSetValue(
    setId: number,
    field: 'kg' | 'reps' | 'duration' | 'rir',
    value: number | undefined,
  ): void {
    dispatch({
      type: 'UpdateSetValue',
      blockIndex: workoutRef.value.selectedBlockIndex,
      setId,
      field,
      value,
    })
  }
  function addSet(blockIndex: number): void {
    dispatch({ type: 'AddSet', blockIndex })
  }
  function removeSet(blockIndex: number, setId: number): void {
    dispatch({ type: 'RemoveSet', blockIndex, setId })
  }
  function duplicateSet(blockIndex: number, setId: number): void {
    dispatch({ type: 'DuplicateSet', blockIndex, setId })
  }
  function setSetCount(blockIndex: number, count: number): void {
    dispatch({ type: 'SetSetCount', blockIndex, count })
  }
  function activateSet(blockIndex: number, setIndex: number): void {
    dispatch({ type: 'ActivateSet', blockIndex, setIndex })
  }
  function setActiveSet(setIndex: number): void {
    const block = currentBlock.value
    if (!block || !isStrengthBlock(block)) return
    if (setIndex < 0 || setIndex >= block.sets.length) return
    workoutRef.value = { ...workoutRef.value, activeSetIndex: setIndex }
  }
  function finishSet(set: Set, useDurationValidation: boolean): CompleteSetOutcome {
    dispatch({ type: 'CompleteSet', set, useDurationValidation })
    return lastOutcome.value ?? { kind: 'invalid' }
  }
  function setBlockResult(
    blockIndex: number,
    result: import('./types').TimedResult,
  ): void {
    dispatch({ type: 'SetBlockResult', blockIndex, result })
  }
  function setCardioResult(blockIndex: number, result: CardioResult): void {
    dispatch({ type: 'SetCardioResult', blockIndex, result })
  }
  function jumpTo(blockIndex: number): void {
    dispatch({ type: 'JumpTo', blockIndex })
  }
  function startWorkout(): void {
    if (!hasBlocks.value) return
    start()
  }
  function advanceToNextBlock(): boolean {
    const w = workoutRef.value
    for (let i = w.selectedBlockIndex + 1; i < w.blocks.length; i++) {
      const b = w.blocks[i]
      if (b && !isBlockComplete(b)) {
        jumpTo(i)
        return true
      }
    }
    return false
  }
  function goToPreviousBlock(): boolean {
    const prev = workoutRef.value.selectedBlockIndex - 1
    if (prev < 0) return false
    jumpTo(prev)
    return true
  }
  async function saveNow(): Promise<void> {
    await runner.saveNow()
  }
  function markInitialized(): void {
    runner.markInitialized()
  }
  function startNewWorkoutSession(): void {
    runner.markInitialized()
  }
  async function discardActiveWorkout(): Promise<void> {
    await runner.discardActive()
  }
  async function hasActiveWorkout(): Promise<boolean> {
    return runner.hasActive()
  }
  async function loadActiveWorkout(): Promise<Workout | null> {
    return loadActive()
  }
  async function completeWorkout(
    notes = '',
    durationOverrideSeconds?: number,
  ): ReturnType<typeof runner.completeWorkout> {
    return runner.completeWorkout(notes, durationOverrideSeconds)
  }

  function $reset(): void {
    lastOutcome.value = null
  }

  return {
    // Raw state and escape hatches
    state,
    dispatch,
    workout,

    // Derived slices
    mode,
    selectedBlock,
    activeBlock,
    currentBlock,
    activeSet,
    hasBlocks,
    hasStarted,
    totalBlocks,
    currentBlockIndex,
    isLastBlock,
    isBuilderMode,
    isActiveMode,
    isCompletedMode,
    isRunning,
    lastOutcome: lastOutcomeReadonly,

    // Persistence state
    persistenceState,
    hasUnsavedChanges,
    isInitialized,

    // Lifecycle
    newDraft,
    loadActive,
    hasActive,
    start,
    startWorkout,
    finishWorkout,
    enterCompletionMode,
    discard,
    returnToBuilder,

    // Builder
    addStrengthBlock,
    addAmrapBlock,
    addEmomBlock,
    addTabataBlock,
    addForTimeBlock,
    addCardioBlock,
    removeBlock,
    reorderBlocks,
    selectBlock,
    updateStrengthBlock,
    updateSetValue,
    addSet,
    removeSet,
    duplicateSet,
    setSetCount,

    // Running
    activateSet,
    setActiveSet,
    finishSet,
    setBlockResult,
    setCardioResult,
    jumpTo,
    advanceToNextBlock,
    goToPreviousBlock,

    // Persistence ops
    saveNow,
    markInitialized,
    startNewWorkoutSession,
    discardActiveWorkout,
    hasActiveWorkout,
    loadActiveWorkout,
    completeWorkout,

    // Validators
    isSetReady,
    isSetReadyForDuration,

    // Tests
    $reset,
  }
})

