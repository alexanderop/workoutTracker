import { liveQuery } from 'dexie'
import type {
  GetByDateRangeParams,
  GetHistoryParams,
  LiveQuery,
  WorkoutsRepository,
} from '@/db/interfaces'
import type {
  DbActiveWorkout,
  DbCompletedWorkout,
  DbStrengthBlock,
  DbWorkoutBlock,
} from '@/db/schema'
import { isDbStrengthBlock } from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'
import { generateId } from './database'

/**
 * Auto-complete sets that have data (kg and reps) when finishing a workout early.
 * This ensures exercise history includes all sets with actual performance data.
 */
function autoCompleteSetsWithData(
  blocks: ReadonlyArray<DbWorkoutBlock>,
  completedAt: number,
): ReadonlyArray<DbWorkoutBlock> {
  return blocks.map((block) => {
    if (!isDbStrengthBlock(block)) return block

    return {
      ...block,
      sets: block.sets.map((set) => {
        // Skip already completed sets
        if (set.status === 'completed') return set

        // Auto-complete sets that have both kg and reps data
        const hasData = set.kg.trim() !== '' && set.reps.trim() !== ''
        if (hasData) {
          return {
            ...set,
            status: 'completed' as const,
            completedAt,
          }
        }

        return set
      }),
    }
  })
}

/**
 * Shared query logic for `getHistory()` and `observeHistory()` so both read the
 * same ordering/pagination rules.
 */
function queryHistory(
  database: WorkoutTrackerDatabase,
  parameters: GetHistoryParams = {},
): Promise<ReadonlyArray<DbCompletedWorkout>> {
  const { limit = 50, offset = 0 } = parameters
  return database.workouts.orderBy('completedAt').reverse().offset(offset).limit(limit).toArray()
}

export function createDexieWorkoutsRepository(
  database: WorkoutTrackerDatabase,
): WorkoutsRepository {
  return {
    async completeWorkout(
      activeWorkout: Readonly<DbActiveWorkout>,
      notes = '',
      durationOverrideSeconds?: number,
    ): Promise<DbCompletedWorkout> {
      // Calculate duration and completedAt
      // If duration override is provided, back-calculate completedAt from startedAt + duration
      const durationSeconds =
        durationOverrideSeconds ?? Math.floor((Date.now() - activeWorkout.startedAt) / 1000)
      const completedAt = activeWorkout.startedAt + durationSeconds * 1000

      // Auto-complete sets with data when finishing workout
      const completedBlocks = autoCompleteSetsWithData(activeWorkout.blocks, completedAt)

      const completedWorkout: DbCompletedWorkout = {
        id: generateId(),
        name: activeWorkout.name,
        blocks: completedBlocks,
        startedAt: activeWorkout.startedAt,
        completedAt,
        durationSeconds,
        notes,
        benchmarkId: activeWorkout.benchmarkId,
      }

      await database.transaction('rw', [database.workouts, database.activeWorkout], async () => {
        await database.workouts.add(completedWorkout)
        await database.activeWorkout.delete('current')
      })

      return completedWorkout
    },

    async add(workout: Readonly<DbCompletedWorkout>): Promise<void> {
      await database.workouts.add(workout)
    },

    async getHistory(
      parameters: GetHistoryParams = {},
    ): Promise<ReadonlyArray<DbCompletedWorkout>> {
      return queryHistory(database, parameters)
    },

    observeHistory(limit?: number): LiveQuery<ReadonlyArray<DbCompletedWorkout>> {
      const run = () => queryHistory(database, { limit })
      return {
        get: () => run(),
        subscribe(onChange: (value: ReadonlyArray<DbCompletedWorkout>) => void) {
          const subscription = liveQuery(run).subscribe({ next: onChange })
          return () => subscription.unsubscribe()
        },
      }
    },

    async getByDateRange(
      parameters: GetByDateRangeParams,
    ): Promise<ReadonlyArray<DbCompletedWorkout>> {
      return database.workouts
        .where('completedAt')
        .between(parameters.startDate, parameters.endDate)
        .toArray()
    },

    async getById(id: string): Promise<DbCompletedWorkout | undefined> {
      return database.workouts.get(id)
    },

    async delete(id: string): Promise<void> {
      await database.workouts.delete(id)
    },

    async count(): Promise<number> {
      return database.workouts.count()
    },

    async startFromCompleted(id: string): Promise<DbActiveWorkout> {
      const completedWorkout = await database.workouts.get(id)
      if (!completedWorkout) {
        throw createDatabaseError('NOT_FOUND', 'start workout from history')
      }

      const now = Date.now()

      // Sort blocks by orderIndex to ensure correct order
      const sortedBlocks = completedWorkout.blocks.toSorted((a, b) => a.orderIndex - b.orderIndex)

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
              duration: set.duration,
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

      await database.activeWorkout.put(activeWorkout)
      return activeWorkout
    },
  }
}
