import type { BenchmarksRepository } from '@/db/interfaces'
import type { DbActiveWorkout, DbBenchmark, DbForTimeBlock, DbWorkoutBlock } from '@/db/schema'
import { createDatabaseError } from '@/lib/tryCatch'
import type { WorkoutTrackerDb } from './database'
import { generateId } from './database'

export function createDexieBenchmarksRepository(db: WorkoutTrackerDb): BenchmarksRepository {
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
      await db.benchmarks.delete(id)
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
  }
}
