import type { BenchmarkAttempt, BenchmarksRepository } from '@/db/interfaces'
import type {
  DbActiveWorkout,
  DbBenchmark,
  DbBenchmarkPersonalBest,
  DbForTimeBlock,
  DbWorkoutBlock,
} from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import { db, generateId } from './database'

export function createDexieBenchmarksRepository(): BenchmarksRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbBenchmark>> {
      const benchmarks = await db.benchmarks.toArray()
      return benchmarks.toSorted((a, b) => b.createdAt - a.createdAt)
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
      // Delete benchmark and all associated data in a transaction
      await db.transaction(
        'rw',
        [db.benchmarks, db.benchmarkAttempts, db.benchmarkPersonalBests],
        async () => {
          await db.benchmarkAttempts.where('benchmarkId').equals(id).delete()
          await db.benchmarkPersonalBests.delete(id)
          await db.benchmarks.delete(id)
        },
      )
    },

    async updateLastUsed(id: string): Promise<void> {
      const updated = await db.benchmarks.update(id, { lastUsedAt: Date.now() })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update benchmark last used')
      }
    },

    async startFromBenchmark(benchmarkId: string): Promise<DbActiveWorkout> {
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
    },

    async getPersonalBest(benchmarkId: string): Promise<DbBenchmarkPersonalBest | null> {
      // O(1) lookup from denormalized table
      const pb = await db.benchmarkPersonalBests.get(benchmarkId)
      return pb ?? null
    },

    async getPersonalBests(
      benchmarkIds: ReadonlyArray<string>,
    ): Promise<ReadonlyMap<string, DbBenchmarkPersonalBest>> {
      if (benchmarkIds.length === 0) {
        return new Map()
      }

      // O(n) lookup from denormalized table where n = benchmarkIds.length
      const pbs = await db.benchmarkPersonalBests.bulkGet([...benchmarkIds])

      const result = new Map<string, DbBenchmarkPersonalBest>()
      for (const pb of pbs) {
        if (pb) {
          result.set(pb.benchmarkId, pb)
        }
      }

      return result
    },

    async getAttemptHistory(benchmarkId: string): Promise<ReadonlyArray<BenchmarkAttempt>> {
      // Get attempts from denormalized table
      const attempts = await db.benchmarkAttempts
        .where('benchmarkId')
        .equals(benchmarkId)
        .toArray()

      if (attempts.length === 0) {
        return []
      }

      // Get the personal best time for comparison
      const pb = await db.benchmarkPersonalBests.get(benchmarkId)
      const bestTime = pb?.completionTimeSeconds ?? null

      // Map to BenchmarkAttempt format and sort by date (newest first)
      return attempts
        .map((a) => ({
          id: a.id,
          workoutId: a.workoutId,
          completedAt: a.completedAt,
          completionTime: a.completionTimeSeconds,
          isPersonalBest: bestTime !== null && a.completionTimeSeconds === bestTime,
        }))
        .toSorted((a, b) => b.completedAt - a.completedAt)
    },

    async recordAttempt(params: {
      benchmarkId: string
      workoutId: string
      completionTimeSeconds: number
    }): Promise<void> {
      const { benchmarkId, workoutId, completionTimeSeconds } = params
      const now = Date.now()
      const attemptId = generateId()

      await db.transaction(
        'rw',
        [db.benchmarkAttempts, db.benchmarkPersonalBests],
        async () => {
          // Add the attempt
          await db.benchmarkAttempts.add({
            id: attemptId,
            benchmarkId,
            workoutId,
            completionTimeSeconds,
            completedAt: now,
          })

          // Check if this is a new personal best
          const currentPb = await db.benchmarkPersonalBests.get(benchmarkId)

          if (!currentPb || completionTimeSeconds < currentPb.completionTimeSeconds) {
            await db.benchmarkPersonalBests.put({
              benchmarkId,
              completionTimeSeconds,
              workoutId,
              achievedAt: now,
            })
          }
        },
      )
    },
  }
}
