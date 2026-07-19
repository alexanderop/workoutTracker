import { computed, ref } from 'vue'
import type { Exercise } from '@/composables/useExerciseSearch'
import type { DbBenchmark, DbBenchmarkRound } from '@/db/schema'
import { getBenchmarksRepository } from '@/db'
import { tryCatch } from '@/lib/tryCatch'
import { generateKeyBetween, generateNKeysBetween } from '@/lib/fractionalIndexing'

const orderKeyCollator = new Intl.Collator()

/**
 * Exercise within a benchmark round form state.
 */
export type ExerciseFormState = {
  orderKey: string
  exerciseDefinitionId: string | null
  name: string
  prescribedReps: number
  image: Blob | null
}

/**
 * Alias for backward compatibility with existing components.
 */
export type BenchmarkFormExercise = ExerciseFormState

/**
 * Round form state with exercises.
 */
export type RoundFormState = {
  orderKey: string
  exercises: Array<ExerciseFormState>
}

/**
 * Benchmark form state.
 * Type is always 'fortime' - removed from form as it's not user-configurable.
 */
type BenchmarkFormState = {
  name: string
  rounds: Array<RoundFormState>
}

/**
 * Calculate index adjustment when deleting a round.
 */
function calculateDeletionAdjustment(
  isDeletingCurrent: boolean,
  isDeletingBefore: boolean,
  roundIndex: number,
  currentIndex: number,
): number {
  if (isDeletingCurrent) return Math.max(0, roundIndex - 1) - currentIndex
  if (isDeletingBefore) return -1
  return 0
}

/**
 * Creates initial form state with one empty round.
 */
function createInitialState(): BenchmarkFormState {
  return {
    name: '',
    rounds: [
      {
        orderKey: generateKeyBetween(null, null),
        exercises: [],
      },
    ],
  }
}

/**
 * Sorts rounds by orderKey for display.
 */
function sortedRounds(rounds: Array<RoundFormState>): Array<RoundFormState> {
  return [...rounds].toSorted((a, b) => orderKeyCollator.compare(a.orderKey, b.orderKey))
}

/**
 * Sorts exercises by orderKey for display.
 */
function sortedExercises(exercises: Array<ExerciseFormState>): Array<ExerciseFormState> {
  return [...exercises].toSorted((a, b) => orderKeyCollator.compare(a.orderKey, b.orderKey))
}

/**
 * Check if an index is valid for a given array length.
 */
function isValidIndex(index: number, length: number): boolean {
  return index >= 0 && index < length
}

/**
 * Parameters for calculating a new orderKey when reordering items.
 */
type ReorderKeyParameters = {
  sorted: Array<{ orderKey: string }>
  fromIndex: number
  toIndex: number
}

/**
 * Calculate a new orderKey for an item being moved to a new position.
 * Handles both moving up (before target) and moving down (after target).
 */
function calculateReorderKey({ sorted, fromIndex, toIndex }: ReorderKeyParameters): string {
  const isMovingDown = fromIndex < toIndex
  const targetKey = sorted[toIndex]?.orderKey ?? null
  const afterKey = toIndex < sorted.length - 1 ? (sorted[toIndex + 1]?.orderKey ?? null) : null
  const beforeKey = toIndex > 0 ? (sorted[toIndex - 1]?.orderKey ?? null) : null

  return isMovingDown
    ? generateKeyBetween(targetKey, afterKey)
    : generateKeyBetween(beforeKey, targetKey)
}

/**
 * Convert form rounds to database format.
 */
function toDatabaseRounds(rounds: Array<RoundFormState>): ReadonlyArray<DbBenchmarkRound> {
  return rounds.map((round) => ({
    orderKey: round.orderKey,
    exercises: round.exercises.map((ex) => ({
      orderKey: ex.orderKey,
      exerciseDefinitionId: ex.exerciseDefinitionId,
      name: ex.name,
      prescribedReps: ex.prescribedReps,
      image: ex.image,
    })),
  }))
}

export function useBenchmarkForm() {
  const form = ref<BenchmarkFormState>(createInitialState())
  const currentRoundIndex = ref(0)
  const editingBenchmarkId = ref<string | null>(null)
  const originalStructureHash = ref<string | null>(null)

  // Computed: sorted rounds for display
  const displayRounds = computed(() => sortedRounds(form.value.rounds))

  // Computed: current round (safe access)
  const currentRound = computed(() => {
    const sorted = displayRounds.value
    return sorted[currentRoundIndex.value] ?? sorted[0]
  })

  // Computed: current round's sorted exercises
  const currentExercises = computed(() => {
    const round = currentRound.value
    return round ? sortedExercises(round.exercises) : []
  })

  /**
   * Find the current round in the form state by orderKey.
   */
  function findCurrentRoundInForm(): RoundFormState | undefined {
    const round = currentRound.value
    if (!round) return undefined
    return form.value.rounds.find((r) => r.orderKey === round.orderKey)
  }

  // Validation
  const isNameValid = computed(() => form.value.name.trim().length > 0)

  const hasExercises = computed(() =>
    form.value.rounds.every((round) => round.exercises.length > 0),
  )

  const hasEmptyRound = computed(() =>
    form.value.rounds.some((round) => round.exercises.length === 0),
  )

  const isSaveDisabled = computed(() => !isNameValid.value || hasEmptyRound.value)

  const canDeleteRound = computed(() => form.value.rounds.length > 1)

  const roundCount = computed(() => form.value.rounds.length)

  // Operation state
  const isSaving = ref(false)

  /**
   * Reset form to initial state.
   */
  function reset() {
    form.value = createInitialState()
    currentRoundIndex.value = 0
    editingBenchmarkId.value = null
    originalStructureHash.value = null
  }

  /**
   * Navigate to a specific round by index.
   */
  function navigateToRound(index: number) {
    if (index >= 0 && index < form.value.rounds.length) {
      currentRoundIndex.value = index
    }
  }

  /**
   * Add an exercise to the current round.
   */
  function addExercise(exercise: Exercise, reps: number) {
    const roundInForm = findCurrentRoundInForm()
    if (!roundInForm) return

    // Generate new orderKey for the exercise (at the end)
    const sortedExs = sortedExercises(roundInForm.exercises)
    const lastKey = sortedExs.length > 0 ? sortedExs.at(-1)!.orderKey : null
    const newKey = generateKeyBetween(lastKey, null)

    roundInForm.exercises.push({
      orderKey: newKey,
      exerciseDefinitionId: exercise.id ?? null,
      name: exercise.name,
      prescribedReps: reps,
      image: exercise.image ?? null,
    })
  }

  /**
   * Remove an exercise from the current round by index.
   */
  function removeExercise(index: number) {
    const roundInForm = findCurrentRoundInForm()
    if (!roundInForm) return

    const sorted = sortedExercises(roundInForm.exercises)
    const exerciseToRemove = sorted[index]
    if (!exerciseToRemove) return

    const originalIndex = roundInForm.exercises.findIndex(
      (e) => e.orderKey === exerciseToRemove.orderKey,
    )
    if (originalIndex !== -1) {
      roundInForm.exercises.splice(originalIndex, 1)
    }
  }

  /**
   * Update reps for an exercise in the current round.
   */
  function updateExerciseReps(index: number, reps: number) {
    const roundInForm = findCurrentRoundInForm()
    if (!roundInForm) return

    const sorted = sortedExercises(roundInForm.exercises)
    const exercise = sorted[index]
    if (!exercise) return

    const originalExercise = roundInForm.exercises.find((e) => e.orderKey === exercise.orderKey)
    if (originalExercise) {
      originalExercise.prescribedReps = reps
    }
  }

  /**
   * Reorder exercises within the current round.
   */
  function reorderExercises(fromIndex: number, toIndex: number) {
    const roundInForm = findCurrentRoundInForm()
    if (!roundInForm) return

    const sorted = sortedExercises(roundInForm.exercises)
    if (!isValidIndex(fromIndex, sorted.length) || !isValidIndex(toIndex, sorted.length)) return

    const movedExercise = sorted[fromIndex]
    if (!movedExercise) return

    const originalExercise = roundInForm.exercises.find(
      (e) => e.orderKey === movedExercise.orderKey,
    )
    if (!originalExercise) return

    originalExercise.orderKey = calculateReorderKey({ sorted, fromIndex, toIndex })
  }

  /**
   * Copy a round to the end of the list.
   */
  function copyRound(roundIndex: number) {
    const sorted = displayRounds.value
    const sourceRound = sorted[roundIndex]
    if (!sourceRound) return

    // Generate new orderKey for the round (at the end)
    const lastKey = sorted.length > 0 ? sorted.at(-1)!.orderKey : null
    const newRoundKey = generateKeyBetween(lastKey, null)

    // Generate new orderKeys for the exercises
    const exerciseKeys = generateNKeysBetween(null, null, sourceRound.exercises.length)

    const copiedRound: RoundFormState = {
      orderKey: newRoundKey,
      exercises: sortedExercises(sourceRound.exercises).map((ex, index) => ({
        orderKey: exerciseKeys[index]!,
        exerciseDefinitionId: ex.exerciseDefinitionId,
        name: ex.name,
        prescribedReps: ex.prescribedReps,
        image: ex.image, // Share image blob reference (not deep-copied)
      })),
    }

    form.value.rounds.push(copiedRound)
  }

  /**
   * Delete a round by index.
   * Returns false if the round cannot be deleted (only 1 round remains).
   * After deletion, selects the previous round (or stays at 0 if deleting round 0).
   */
  function deleteRound(roundIndex: number): boolean {
    if (!canDeleteRound.value) return false

    const sorted = displayRounds.value
    const roundToDelete = sorted[roundIndex]
    if (!roundToDelete) return false

    const originalIndex = form.value.rounds.findIndex((r) => r.orderKey === roundToDelete.orderKey)
    if (originalIndex === -1) return true

    form.value.rounds.splice(originalIndex, 1)

    // Calculate new index after deletion:
    // - If deleting current round: go to previous round
    // - If deleting before current: shift index down to stay on same round
    // - If deleting after current: no change needed
    const isDeletingCurrent = roundIndex === currentRoundIndex.value
    const isDeletingBefore = roundIndex < currentRoundIndex.value
    const adjustment = calculateDeletionAdjustment(
      isDeletingCurrent,
      isDeletingBefore,
      roundIndex,
      currentRoundIndex.value,
    )
    currentRoundIndex.value += adjustment

    return true
  }

  /**
   * Reorder rounds via drag-and-drop.
   */
  function reorderRounds(fromIndex: number, toIndex: number) {
    const sorted = displayRounds.value
    if (!isValidIndex(fromIndex, sorted.length) || !isValidIndex(toIndex, sorted.length)) return

    const movedRound = sorted[fromIndex]
    if (!movedRound) return

    const originalRound = form.value.rounds.find((r) => r.orderKey === movedRound.orderKey)
    if (!originalRound) return

    originalRound.orderKey = calculateReorderKey({ sorted, fromIndex, toIndex })
  }

  /**
   * Get form data for saving.
   */
  function getFormData(): BenchmarkFormState {
    return {
      name: form.value.name.trim(),
      rounds: form.value.rounds.map((round) => ({
        orderKey: round.orderKey,
        exercises: round.exercises.map((ex) => ({ ...ex })),
      })),
    }
  }

  /**
   * Save the benchmark (create or update).
   */
  async function save(): Promise<DbBenchmark | null> {
    if (isSaveDisabled.value || isSaving.value) return null

    isSaving.value = true
    const data = getFormData()
    const databaseRounds = toDatabaseRounds(data.rounds)

    const result = await saveToRepo(data, databaseRounds)

    isSaving.value = false
    return result
  }

  /**
   * Helper to save benchmark to repository.
   * Always saves with type 'fortime' - type selection removed from UI.
   */
  async function saveToRepo(
    data: BenchmarkFormState,
    databaseRounds: ReadonlyArray<DbBenchmarkRound>,
  ): Promise<DbBenchmark | null> {
    if (editingBenchmarkId.value) {
      const [error, benchmark] = await tryCatch(
        getBenchmarksRepository().update(editingBenchmarkId.value, {
          name: data.name,
          type: 'fortime',
          rounds: databaseRounds,
        }),
      )
      if (error) {
        console.error('Failed to update benchmark:', error)
        return null
      }
      return benchmark
    }

    const [error, benchmark] = await tryCatch(
      getBenchmarksRepository().create({
        name: data.name,
        type: 'fortime',
        rounds: databaseRounds,
      }),
    )
    if (error) {
      console.error('Failed to save benchmark:', error)
      return null
    }
    return benchmark
  }

  /**
   * Initialize form from an existing benchmark (for editing).
   */
  function initialize(benchmark: DbBenchmark) {
    editingBenchmarkId.value = benchmark.id
    originalStructureHash.value = benchmark.structureHash

    form.value = {
      name: benchmark.name,
      rounds: benchmark.rounds.map((round) => ({
        orderKey: round.orderKey,
        exercises: round.exercises.map((ex) => ({
          orderKey: ex.orderKey,
          exerciseDefinitionId: ex.exerciseDefinitionId,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          image: ex.image,
        })),
      })),
    }

    currentRoundIndex.value = 0
  }

  return {
    // State
    form,
    currentRoundIndex,
    editingBenchmarkId,
    originalStructureHash,

    // Computed
    displayRounds,
    currentRound,
    currentExercises,
    isNameValid,
    hasExercises,
    hasEmptyRound,
    isSaveDisabled,
    canDeleteRound,
    roundCount,
    isSaving,

    // Actions
    reset,
    navigateToRound,
    addExercise,
    removeExercise,
    updateExerciseReps,
    reorderExercises,
    copyRound,
    deleteRound,
    reorderRounds,
    getFormData,
    save,
    initialize,
  }
}
