import type { GetByDateRangeParams, GetHistoryParams, WorkoutsRepository } from '@/db/interfaces'
import type {
  DbActiveWorkout,
  DbCompletedWorkout,
  DbStrengthBlock,
  DbWorkoutBlock,
} from '@/db/schema'
import { isDbStrengthBlock } from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb } from './database'
import { generateId } from './database'

export function createDexieWorkoutsRepository(db: WorkoutTrackerDb): WorkoutsRepository {
  return {
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
        benchmarkId: activeWorkout.benchmarkId,
      }

      await db.transaction('rw', [db.workouts, db.activeWorkout], async () => {
        await db.workouts.add(completedWorkout)
        await db.activeWorkout.delete('current')
      })

      return completedWorkout
    },

    async add(workout: Readonly<DbCompletedWorkout>): Promise<void> {
      await db.workouts.add(workout)
    },

    async getHistory(params: GetHistoryParams = {}): Promise<ReadonlyArray<DbCompletedWorkout>> {
      const { limit = 50, offset = 0 } = params
      return db.workouts.orderBy('completedAt').reverse().offset(offset).limit(limit).toArray()
    },

    async getByDateRange(
      params: GetByDateRangeParams,
    ): Promise<ReadonlyArray<DbCompletedWorkout>> {
      return db.workouts.where('completedAt').between(params.startDate, params.endDate).toArray()
    },

    async getById(id: string): Promise<DbCompletedWorkout | undefined> {
      return db.workouts.get(id)
    },

    async delete(id: string): Promise<void> {
      await db.workouts.delete(id)
    },

    async count(): Promise<number> {
      return db.workouts.count()
    },

    async startFromCompleted(id: string): Promise<DbActiveWorkout> {
      const completedWorkout = await db.workouts.get(id)
      if (!completedWorkout) {
        throw createDatabaseError('NOT_FOUND', 'start workout from history')
      }

      const now = Date.now()

      // Sort blocks by orderIndex to ensure correct order
      const sortedBlocks = completedWorkout.blocks.toSorted(
        (a, b) => a.orderIndex - b.orderIndex,
      )

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
        activeExerciseIndex: null,
        benchmarkId: null,
        globalTimerStartedAt: null,
      }

      await db.activeWorkout.put(activeWorkout)
      return activeWorkout
    },
  }
}
