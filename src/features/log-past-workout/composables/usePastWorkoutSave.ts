import { ref } from 'vue'
import type { WorkoutBlock } from '@/blocks'
import type { DbCompletedWorkout, DbSet, DbWorkoutBlock } from '@/db/schema'
import { blockToDatabase } from '@/blocks'
import { getWorkoutsRepository, generateId } from '@/db'
import { tryCatch } from '@/lib/tryCatch'

type PastWorkoutData = {
  name: string
  date: Date
  durationMinutes: number
  blocks: ReadonlyArray<WorkoutBlock>
}

/**
 * Re-key a codec-converted block for a past-workout log: fresh persistent ids
 * (the codec reuses the in-memory numeric ids) and every set marked completed,
 * since the whole workout already happened.
 */
function backdateForPastLog(databaseBlock: DbWorkoutBlock): DbWorkoutBlock {
  if (databaseBlock.kind === 'strength') {
    return {
      ...databaseBlock,
      id: generateId(),
      sets: databaseBlock.sets.map(
        (set): DbSet => ({
          ...set,
          id: generateId(),
          status: 'completed',
          completedAt: Date.now(),
        }),
      ),
    }
  }
  return { ...databaseBlock, id: generateId() }
}

function convertBlockToDatabase(block: Readonly<WorkoutBlock>, orderIndex: number): DbWorkoutBlock {
  return backdateForPastLog(blockToDatabase(block, orderIndex))
}

/**
 * Composable for saving past workouts to the database.
 * Converts domain workout data to database format and persists it.
 */
export function usePastWorkoutSave() {
  const isSaving = ref(false)
  const error = ref<string | undefined>(undefined)

  /**
   * Saves a past workout to the database with backdated timestamps.
   * @param data - The workout data including name, date, duration, and blocks
   * @returns The ID of the saved workout, or undefined if save failed
   */
  async function save(data: PastWorkoutData): Promise<string | undefined> {
    isSaving.value = true
    error.value = undefined

    // Calculate timestamps based on the provided date and duration
    const startedAt = data.date.getTime()
    const completedAt = startedAt + data.durationMinutes * 60 * 1000
    const durationSeconds = data.durationMinutes * 60

    // Convert blocks to database format
    const databaseBlocks: ReadonlyArray<DbWorkoutBlock> = data.blocks.map((block, index) =>
      convertBlockToDatabase(block, index),
    )

    const workoutId = generateId()
    const databaseWorkout: DbCompletedWorkout = {
      id: workoutId,
      name: data.name,
      blocks: databaseBlocks,
      startedAt,
      completedAt,
      durationSeconds,
      notes: '',
      benchmarkId: null,
    }

    const [saveError] = await tryCatch(getWorkoutsRepository().add(databaseWorkout))

    isSaving.value = false

    if (saveError) {
      error.value = saveError.message
      return undefined
    }

    return workoutId
  }

  return {
    save,
    isSaving,
    error,
  }
}
