import { db, generateId } from '../index'
import type { DbActiveWorkout, DbCompletedWorkout } from '../schema'

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
      exercises: activeWorkout.exercises,
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
  async getHistory(params: {
    limit?: number
    offset?: number
  } = {}): Promise<ReadonlyArray<DbCompletedWorkout>> {
    const { limit = 50, offset = 0 } = params
    return db.workouts
      .orderBy('completedAt')
      .reverse()
      .offset(offset)
      .limit(limit)
      .toArray()
  },

  /**
   * Get workouts within a date range.
   */
  async getByDateRange(params: {
    startDate: number
    endDate: number
  }): Promise<ReadonlyArray<DbCompletedWorkout>> {
    return db.workouts
      .where('completedAt')
      .between(params.startDate, params.endDate)
      .toArray()
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
}
