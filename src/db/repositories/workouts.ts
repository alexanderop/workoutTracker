import { db, generateId } from '@/db'
import type {
  DbActiveWorkout,
  DbCompletedWorkout,
  DbStrengthBlock,
  DbWorkoutBlock,
} from '@/db/schema'
import { isDbStrengthBlock } from '@/db/schema'

/**
 * Repository for managing completed workout history.
 */
export const workoutsRepository = {
  /**
   * Complete an active workout and save to history.
   * Clears the active workout in the same transaction.
   */
  async completeWorkout(
    activeWorkout: Readonly<DbActiveWorkout>,
    notes = '',
  ): Promise<DbCompletedWorkout> {
    const completedAt = Date.now()
    const completedWorkout: DbCompletedWorkout = {
      id: generateId(),
      name: activeWorkout.name,
      blocks: activeWorkout.blocks,
      startedAt: activeWorkout.startedAt,
      completedAt,
      durationSeconds: Math.floor((completedAt - activeWorkout.startedAt) / 1000),
      notes,
    }

    await db.transaction('rw', [db.workouts, db.activeWorkout], async () => {
      await db.workouts.add(completedWorkout)
      await db.activeWorkout.delete('current')
    })

    return completedWorkout
  },

  /**
   * Get workout history with pagination.
   */
  async getHistory(
    params: {
      limit?: number
      offset?: number
    } = {},
  ): Promise<ReadonlyArray<DbCompletedWorkout>> {
    const { limit = 50, offset = 0 } = params
    return db.workouts.orderBy('completedAt').reverse().offset(offset).limit(limit).toArray()
  },

  /**
   * Get workouts within a date range.
   */
  async getByDateRange(params: {
    startDate: number
    endDate: number
  }): Promise<ReadonlyArray<DbCompletedWorkout>> {
    return db.workouts.where('completedAt').between(params.startDate, params.endDate).toArray()
  },

  /**
   * Get a specific workout by ID.
   */
  async getById(id: string): Promise<DbCompletedWorkout | undefined> {
    return db.workouts.get(id)
  },

  /**
   * Delete a workout from history.
   */
  async delete(id: string): Promise<void> {
    await db.workouts.delete(id)
  },

  /**
   * Get total count of completed workouts.
   */
  async count(): Promise<number> {
    return db.workouts.count()
  },

  /**
   * Start a new active workout from a completed workout.
   * Creates a new active workout with blocks and sets prefilled from the completed workout.
   * All set statuses are reset to 'planned'.
   */
  async startFromCompleted(id: string): Promise<DbActiveWorkout> {
    const completedWorkout = await db.workouts.get(id)
    if (!completedWorkout) {
      throw new Error(`Workout with id ${id} not found`)
    }

    const now = Date.now()

    // Sort blocks by orderIndex to ensure correct order
    const sortedBlocks = [...completedWorkout.blocks].toSorted((a, b) => a.orderIndex - b.orderIndex)

    // Map blocks with new IDs while preserving all data
    const newBlocks: ReadonlyArray<DbWorkoutBlock> = sortedBlocks.map((block) => {
      if (isDbStrengthBlock(block)) {
        // Strength block - reset set statuses
        return {
          ...block,
          id: generateId(),
          sets: block.sets.map((set) => ({
            id: generateId(),
            kg: set.kg,
            reps: set.reps,
            rir: set.rir,
            status: 'planned' as const,
            completedAt: null,
          })),
        } satisfies DbStrengthBlock
      }

      // Timed blocks - reset results
      return {
        ...block,
        id: generateId(),
        result: null,
      }
    })

    const activeWorkout: DbActiveWorkout = {
      id: 'current',
      name: completedWorkout.name,
      blocks: newBlocks,
      selectedBlockIndex: 0,
      startedAt: now,
      lastModifiedAt: now,
      mode: 'builder',
      activeSetIndex: null,
    }

    await db.activeWorkout.put(activeWorkout)
    return activeWorkout
  },
}
