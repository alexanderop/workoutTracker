import type { BenchmarkAttempt, BenchmarksRepository } from '@/db/interfaces'
import type { DbActiveWorkout, DbBenchmark } from '@/db/schema'
import type { DbForTimeBlock, DbWorkoutBlock } from '@/blocks'
import { createDatabaseError } from '@/lib/tryCatch'
import { generateStructureHash } from '@/db/structureHash'
import type { WorkoutTrackerDb as WorkoutTrackerDatabase } from './database'
import { generateId } from './database'

const orderKeyCollator = new Intl.Collator()

export function createDexieBenchmarksRepository(
  database: WorkoutTrackerDatabase,
): BenchmarksRepository {
  return {
    async getAll(): Promise<ReadonlyArray<DbBenchmark>> {
      return database.benchmarks.orderBy('createdAt').reverse().toArray()
    },

    async getById(id: string): Promise<DbBenchmark | undefined> {
      return database.benchmarks.get(id)
    },

    async create(
      data: Omit<DbBenchmark, 'id' | 'createdAt' | 'lastUsedAt' | 'structureHash'>,
    ): Promise<DbBenchmark> {
      const benchmark: DbBenchmark = {
        id: generateId(),
        name: data.name,
        type: data.type,
        rounds: data.rounds.map((round) => ({
          orderKey: round.orderKey,
          exercises: round.exercises.map((ex) => ({
            orderKey: ex.orderKey,
            exerciseDefinitionId: ex.exerciseDefinitionId,
            name: ex.name,
            prescribedReps: ex.prescribedReps,
            image: ex.image,
          })),
        })),
        structureHash: generateStructureHash(data.rounds),
        createdAt: Date.now(),
        lastUsedAt: null,
      }
      await database.benchmarks.add(benchmark)
      return benchmark
    },

    async update(
      id: string,
      updates: Partial<Omit<DbBenchmark, 'id' | 'createdAt'>>,
    ): Promise<DbBenchmark> {
      // Build update object, recalculating structureHash if rounds changed
      const updateData: Partial<DbBenchmark> = { ...updates }
      if (updates.rounds) {
        updateData.structureHash = generateStructureHash(updates.rounds)
      }

      const updated = await database.benchmarks.update(id, updateData)
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update benchmark')
      }

      const benchmark = await database.benchmarks.get(id)
      if (!benchmark) {
        throw createDatabaseError('NOT_FOUND', 'get updated benchmark')
      }

      return benchmark
    },

    async delete(id: string): Promise<void> {
      await database.benchmarks.delete(id)
    },

    async updateLastUsed(id: string): Promise<void> {
      const updated = await database.benchmarks.update(id, { lastUsedAt: Date.now() })
      if (updated === 0) {
        throw createDatabaseError('NOT_FOUND', 'update benchmark last used')
      }
    },

    async startFromBenchmark(benchmarkId: string): Promise<DbActiveWorkout> {
      const benchmark = await database.benchmarks.get(benchmarkId)
      if (!benchmark) {
        throw createDatabaseError('NOT_FOUND', 'start workout from benchmark')
      }

      const now = Date.now()

      // Sort rounds by orderKey
      const sortedRounds = [...benchmark.rounds].toSorted((a, b) =>
        orderKeyCollator.compare(a.orderKey, b.orderKey),
      )

      // Create one ForTime block per round with exercises from that round
      const blocks: ReadonlyArray<DbWorkoutBlock> = sortedRounds.map(
        (round, index): DbForTimeBlock => {
          // Sort exercises within round by orderKey
          const sortedExercises = [...round.exercises].toSorted((a, b) =>
            orderKeyCollator.compare(a.orderKey, b.orderKey),
          )

          return {
            kind: 'fortime',
            id: generateId(),
            config: {
              timeCapSeconds: null,
            },
            exercises: sortedExercises.map((ex) => ({
              id: generateId(),
              name: ex.name,
              prescribedReps: ex.prescribedReps,
              load: null,
              image: ex.image,
            })),
            result: null,
            orderIndex: index,
          }
        },
      )

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
      await database.benchmarks.update(benchmarkId, { lastUsedAt: now })

      return activeWorkout
    },

    async getPersonalBest(benchmarkId: string): Promise<number | null> {
      // Get all completed workouts for this benchmark
      const workouts = await database.workouts.where('benchmarkId').equals(benchmarkId).toArray()

      if (workouts.length === 0) {
        return null
      }

      // Find the minimum completion time from all ForTime blocks
      let bestTime: number | null = null

      for (const workout of workouts) {
        for (const block of workout.blocks) {
          if (!(block.kind === 'fortime' && block.result?.completed)) {
            continue
          }

          const time = block.result.completionTime
          if (bestTime === null || time < bestTime) {
            bestTime = time
          }
        }
      }

      return bestTime
    },

    async getPersonalBests(
      benchmarkIds: ReadonlyArray<string>,
    ): Promise<ReadonlyMap<string, number>> {
      // Early return for empty input
      if (benchmarkIds.length === 0) {
        return new Map()
      }

      // Single query: Get all workouts for all benchmark IDs
      const workouts = await database.workouts.where('benchmarkId').anyOf(benchmarkIds).toArray()

      // Build map of benchmark ID -> best time
      const bestTimes = new Map<string, number>()

      for (const workout of workouts) {
        // Skip workouts without benchmarkId (shouldn't happen with anyOf query)
        if (workout.benchmarkId === null) continue

        for (const block of workout.blocks) {
          if (!(block.kind === 'fortime' && block.result?.completed)) {
            continue
          }

          const time = block.result.completionTime
          const currentBest = bestTimes.get(workout.benchmarkId)

          if (currentBest === undefined || time < currentBest) {
            bestTimes.set(workout.benchmarkId, time)
          }
        }
      }

      return bestTimes
    },

    async getAttemptHistory(benchmarkId: string): Promise<ReadonlyArray<BenchmarkAttempt>> {
      // Get all completed workouts for this benchmark
      const workouts = await database.workouts.where('benchmarkId').equals(benchmarkId).toArray()

      if (workouts.length === 0) {
        return []
      }

      // Extract completion times and build attempt records
      const attempts: Array<{ id: string; completedAt: number; completionTime: number }> = []

      for (const workout of workouts) {
        for (const block of workout.blocks) {
          if (!(block.kind === 'fortime' && block.result?.completed)) {
            continue
          }

          attempts.push({
            id: workout.id,
            completedAt: workout.completedAt,
            completionTime: block.result.completionTime,
          })
          break // Only use first ForTime block
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

    async hasResults(benchmarkId: string): Promise<boolean> {
      const count = await database.workouts.where('benchmarkId').equals(benchmarkId).count()
      return count > 0
    },
  }
}
