import type { BenchmarkAttempt, BenchmarksRepository } from '@/db/interfaces'
import type { DbActiveWorkout, DbBenchmark, DbForTimeBlock, DbWorkoutBlock } from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb } from './database'
import { generateId } from './database'

export function createDexieBenchmarksRepository(db: WorkoutTrackerDb): BenchmarksRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbBenchmark>> {
      return db.benchmarks.orderBy('createdAt').reverse().toArray()
    },

    async getById(id: string): Promise<DbBenchmark | undefined> {
      return db.benchmarks.get(id)
    },

    async create(
      data: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt'>,
    ): Promise<DbBenchmark> {
      const benchmark: DbBenchmark = {
        name: data.name,
        type: data.type,
        rounds: data.rounds,
        exercises: data.exercises.map((ex) => ({
          exerciseDefinitionId: ex.exerciseDefinitionId,
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          thumbnail: ex.thumbnail,
          pattern: ex.pattern,
          color: ex.color,
        })),
        id: generateId(),
        createdAt: Date.now(),
        lastUsedAt: null,
      }
      await db.benchmarks.add(benchmark)
      return benchmark
    },

    async update(
      id: string,
      updates: Partial<Omit<DbBenchmark, 'id' | 'createdAt'>>,
    ): Promise<void> {
      const updated = await db.benchmarks.update(id, updates)
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update benchmark')
      }
    },

    async delete(id: string): Promise<void> {
      await db.benchmarks.delete(id)
    },

    async updateLastUsed(id: string): Promise<void> {
      const updated = await db.benchmarks.update(id, { lastUsedAt: Date.now() })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update benchmark last used')
      }
    },

    async startFromBenchmark(benchmarkId: string): Promise<DbActiveWorkout> {
      return await db.transaction('rw', db.benchmarks, async () => {
        const benchmark = await db.benchmarks.get(benchmarkId)
        if (!benchmark) {
          throw createDatabaseError('NOT_FOUND', 'start workout from benchmark')
        }

        const now = Date.now()

        // Create ForTime block with fresh exercise instances (unique IDs per block)
        const createBlock = (orderIndex: number): DbForTimeBlock => ({
          kind: 'fortime',
          id: generateId(),
          config: {
            timeCapSeconds: null,
          },
          exercises: benchmark.exercises.map((ex) => ({
            id: generateId(),
            name: ex.name,
            prescribedReps: ex.prescribedReps,
            load: null,
            thumbnail: ex.thumbnail,
            pattern: ex.pattern,
            color: ex.color,
          })),
          result: null,
          orderIndex,
        })

        // For "rounds" type, create multiple blocks (one per round)
        // For "fortime" type, create single block
        const blocks: ReadonlyArray<DbWorkoutBlock> =
          benchmark.type === 'rounds'
            ? Array.from({ length: benchmark.rounds }, (_, i) => createBlock(i))
            : [createBlock(0)]

        const activeWorkout: DbActiveWorkout = {
          id: 'current',
          name: benchmark.name,
          blocks,
          selectedBlockIndex: 0,
          startedAt: now,
          lastModifiedAt: now,
          mode: 'builder',
          activeSetIndex: null,
          activeExerciseIndex: null,
          benchmarkId,
          globalTimerStartedAt: null,
        }

        // Update benchmark usage tracking
        await db.benchmarks.update(benchmarkId, { lastUsedAt: now })

        return activeWorkout
      })
    },

    async getPersonalBest(benchmarkId: string): Promise<number | null> {
      // Get all completed workouts for this benchmark
      const workouts = await db.workouts.where('benchmarkId').equals(benchmarkId).toArray()

      if (workouts.length === 0) {
        return null
      }

      // Find the minimum completion time from all ForTime blocks
      let bestTime: number | null = null

      for (const workout of workouts) {
        for (const block of workout.blocks) {
          if (block.kind === 'fortime' && block.result?.completed) {
            const time = block.result.completionTime
            if (bestTime === null || time < bestTime) {
              bestTime = time
            }
          }
        }
      }

      return bestTime
    },

    async getPersonalBests(
      benchmarkIds: ReadonlyArray<string>
    ): Promise<ReadonlyMap<string, number>> {
      // Early return for empty input
      if (benchmarkIds.length === 0) {
        return new Map()
      }

      // Single query: Get all workouts for all benchmark IDs
      const workouts = await db.workouts
        .where('benchmarkId')
        .anyOf(benchmarkIds)
        .toArray()

      // Build map of benchmark ID -> best time
      const bestTimes = new Map<string, number>()

      for (const workout of workouts) {
        // Skip workouts without benchmarkId (shouldn't happen with anyOf query)
        if (workout.benchmarkId === null) continue

        for (const block of workout.blocks) {
          if (block.kind === 'fortime' && block.result?.completed) {
            const time = block.result.completionTime
            const currentBest = bestTimes.get(workout.benchmarkId)

            if (currentBest === undefined || time < currentBest) {
              bestTimes.set(workout.benchmarkId, time)
            }
          }
        }
      }

      return bestTimes
    },

    async getAttemptHistory(benchmarkId: string): Promise<ReadonlyArray<BenchmarkAttempt>> {
      // Get all completed workouts for this benchmark
      const workouts = await db.workouts.where('benchmarkId').equals(benchmarkId).toArray()

      if (workouts.length === 0) {
        return []
      }

      // Extract completion times and build attempt records
      const attempts: Array<{ id: string; completedAt: number; completionTime: number }> = []

      for (const workout of workouts) {
        for (const block of workout.blocks) {
          if (block.kind === 'fortime' && block.result?.completed) {
            attempts.push({
              id: workout.id,
              completedAt: workout.completedAt,
              completionTime: block.result.completionTime,
            })
            break // Only use first ForTime block
          }
        }
      }

      // Find PB time
      if (attempts.length === 0) {
        return []
      }

      const bestTime = Math.min(...attempts.map((a) => a.completionTime))

      // Mark PB attempts and sort by date (newest first)
      return attempts
        .map((a) => ({
          ...a,
          isPersonalBest: a.completionTime === bestTime,
        }))
        .toSorted((a, b) => b.completedAt - a.completedAt)
    },
  }
}
