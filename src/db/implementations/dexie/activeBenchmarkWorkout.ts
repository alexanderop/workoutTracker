import type { ActiveBenchmarkWorkoutRepository } from '@/db/interfaces'
import type {
  DbActiveBenchmarkWorkout,
  DbBlockConfig,
  DbBlockResult,
  DbNormalizedBlock,
  DbNormalizedBlockExercise,
  DbWorkoutHeader,
  DbWorkoutStats,
} from '@/db/schema'
import { db, generateId } from './database'

/**
 * Extract completion time from ForTime block result.
 */
function extractCompletionTime(blocks: ReadonlyArray<DbNormalizedBlock>): number | null {
  for (const block of blocks) {
    if (block.kind === 'fortime' && block.result?.kind === 'fortime' && block.result.completed) {
      return block.result.completionTime
    }
  }
  return null
}

/**
 * Compute workout stats from blocks.
 */
function computeStats(blocks: ReadonlyArray<DbNormalizedBlock>): DbWorkoutStats {
  let timedBlockCount = 0
  let totalRounds = 0

  for (const block of blocks) {
    if (block.kind !== 'strength' && block.kind !== 'cardio') {
      timedBlockCount++
    }
    if (block.kind === 'amrap' && block.result?.kind === 'amrap') {
      totalRounds += block.result.rounds
    }
  }

  return {
    blockCount: blocks.length,
    setCount: 0, // Benchmark workouts don't have sets
    completedSetCount: 0,
    totalVolume: 0,
    timedBlockCount,
    totalRounds,
  }
}

/**
 * Convert embedded ForTime block to normalized format.
 */
function normalizeBlock(
  block: DbActiveBenchmarkWorkout['blocks'][number],
  workoutId: string,
  orderIndex: number,
): DbNormalizedBlock {
  const config: DbBlockConfig = {
    kind: 'fortime',
    timeCapSeconds: block.config.timeCapSeconds,
  }

  const result: DbBlockResult | null = block.result
    ? {
        kind: 'fortime',
        completionTime: block.result.completionTime,
        completed: block.result.completed,
        splitTimes: block.result.splitTimes,
      }
    : null

  return {
    id: block.id,
    workoutId,
    kind: 'fortime',
    orderIndex,
    config,
    result,
    exerciseId: null,
    exerciseName: null,
    equipment: null,
    targetReps: null,
    thumbnail: null,
  }
}

/**
 * Convert block exercises to normalized format.
 */
function normalizeBlockExercises(
  block: DbActiveBenchmarkWorkout['blocks'][number],
): ReadonlyArray<DbNormalizedBlockExercise> {
  return block.exercises.map((ex, idx) => ({
    id: ex.id,
    blockId: block.id,
    orderIndex: idx,
    exerciseId: null,
    name: ex.name,
    prescribedReps: ex.prescribedReps,
    load: ex.load,
    thumbnail: ex.thumbnail,
  }))
}

export function createDexieActiveBenchmarkWorkoutRepository(): ActiveBenchmarkWorkoutRepository {
  return {
    async get(): Promise<DbActiveBenchmarkWorkout | undefined> {
      return db.activeBenchmark.get('current-benchmark')
    },

    async save(workout: Readonly<DbActiveBenchmarkWorkout>): Promise<void> {
      await db.activeBenchmark.put({
        ...workout,
        id: 'current-benchmark',
        lastModifiedAt: Date.now(),
      })
    },

    async clear(): Promise<void> {
      await db.activeBenchmark.delete('current-benchmark')
    },

    async exists(): Promise<boolean> {
      const workout = await db.activeBenchmark.get('current-benchmark')
      return workout !== undefined
    },

    async complete(
      activeBenchmark: Readonly<DbActiveBenchmarkWorkout>,
    ): Promise<DbWorkoutHeader> {
      const now = Date.now()
      const workoutId = generateId()
      const durationSeconds = Math.floor((now - activeBenchmark.startedAt) / 1000)

      // Normalize blocks
      const normalizedBlocks = activeBenchmark.blocks.map((block, idx) =>
        normalizeBlock(block, workoutId, idx),
      )

      // Normalize block exercises
      const allBlockExercises = activeBenchmark.blocks.flatMap(normalizeBlockExercises)

      // Compute stats
      const stats = computeStats(normalizedBlocks)

      // Create workout header
      const header: DbWorkoutHeader = {
        id: workoutId,
        name: activeBenchmark.name,
        startedAt: activeBenchmark.startedAt,
        completedAt: now,
        durationSeconds,
        notes: '',
        benchmarkId: activeBenchmark.benchmarkId,
        templateId: null,
        stats,
      }

      // Extract completion time for benchmark tracking
      const completionTime = extractCompletionTime(normalizedBlocks)

      // Transaction: Save everything atomically
      await db.transaction(
        'rw',
        [
          db.workoutHeaders,
          db.workoutBlocks,
          db.blockExercises,
          db.activeBenchmark,
          db.benchmarkAttempts,
          db.benchmarkPersonalBests,
        ],
        async () => {
          // Save workout data
          await db.workoutHeaders.add(header)
          await db.workoutBlocks.bulkAdd([...normalizedBlocks])
          if (allBlockExercises.length > 0) {
            await db.blockExercises.bulkAdd([...allBlockExercises])
          }

          // Record benchmark attempt if we have a completion time
          if (completionTime !== null) {
            const attemptId = generateId()
            await db.benchmarkAttempts.add({
              id: attemptId,
              benchmarkId: activeBenchmark.benchmarkId,
              workoutId,
              completionTimeSeconds: completionTime,
              completedAt: now,
            })

            // Update personal best if this is a new record
            const currentPb = await db.benchmarkPersonalBests.get(activeBenchmark.benchmarkId)
            if (!currentPb || completionTime < currentPb.completionTimeSeconds) {
              await db.benchmarkPersonalBests.put({
                benchmarkId: activeBenchmark.benchmarkId,
                completionTimeSeconds: completionTime,
                workoutId,
                achievedAt: now,
              })
            }
          }

          // Remove active benchmark
          await db.activeBenchmark.delete('current-benchmark')
        },
      )

      return header
    },
  }
}
