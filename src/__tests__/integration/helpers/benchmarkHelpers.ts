import { page, userEvent } from '../../helpers/locator'
import { expect } from 'vitest'
import { expectElement } from '../../helpers/assertions'
import type { createTestApp } from '../../helpers/createTestApp'
import { db, getBenchmarksRepository } from '@/db'
import type { DbBenchmark, DbBenchmarkRound, DbCompletedWorkout } from '@/db/schema'
import {
  createDbBenchmarkRound,
  createDbBenchmarkRoundExercise,
  createDbBlockExercise as createDatabaseBlockExercise,
  createDbForTimeBlock as createDatabaseForTimeBlock,
  createDbForTimeResult as createDatabaseForTimeResult,
  generateId,
} from '../../factories'
import { generateNKeysBetween } from '@/lib/fractionalIndexing'

/**
 * Creates a ForTime benchmark with variable reps per round.
 * Each round can have different exercises and rep counts.
 *
 * @example
 * // Create a 4-round pyramid benchmark
 * await createForTimeBenchmarkWithRounds({
 *   name: 'Pyramid 40-30-20-10',
 *   rounds: [
 *     { exercises: [{ name: 'Burpees', reps: 40 }] },
 *     { exercises: [{ name: 'Burpees', reps: 30 }] },
 *     { exercises: [{ name: 'Burpees', reps: 20 }] },
 *     { exercises: [{ name: 'Burpees', reps: 10 }] },
 *   ],
 * })
 */
export async function createForTimeBenchmarkWithRounds(options: {
  name: string
  rounds: Array<{
    exercises: Array<{
      name: string
      reps: number
      exerciseDefinitionId?: string
    }>
  }>
}): Promise<DbBenchmark> {
  const roundKeys = generateNKeysBetween(null, null, options.rounds.length)

  const dbRounds: Array<DbBenchmarkRound> = options.rounds.map((round, roundIndex) => {
    const exerciseKeys = generateNKeysBetween(null, null, round.exercises.length)

    return createDbBenchmarkRound({
      orderKey: roundKeys[roundIndex],
      exercises: round.exercises.map((ex, exIndex) =>
        createDbBenchmarkRoundExercise({
          orderKey: exerciseKeys[exIndex],
          name: ex.name,
          prescribedReps: ex.reps,
          exerciseDefinitionId: ex.exerciseDefinitionId ?? null,
        }),
      ),
    })
  })

  return getBenchmarksRepository().create({
    name: options.name,
    type: 'fortime',
    rounds: dbRounds,
  })
}

/**
 * Creates a simple ForTime benchmark with one round.
 * Defaults to "Fran" with Thrusters (21) and Pull-ups (21).
 */
export async function createForTimeBenchmark(options?: {
  name?: string
  exercises?: Array<{ name: string; reps: number }>
}): Promise<DbBenchmark> {
  const exercises = options?.exercises ?? [
    { name: 'Thrusters', reps: 21 },
    { name: 'Pull-ups', reps: 21 },
  ]

  return createForTimeBenchmarkWithRounds({
    name: options?.name ?? 'Fran',
    rounds: [{ exercises }],
  })
}

/**
 * Creates a ForTime benchmark with multiple rounds, each having the same exercises.
 * This is the legacy "rounds" format where all rounds are identical.
 *
 * @example
 * await createRoundsBenchmark({
 *   name: 'Multi-Round',
 *   rounds: 3,
 *   exercises: [
 *     { name: 'Burpees', reps: 10 },
 *     { name: 'Squats', reps: 15 },
 *   ],
 * })
 */
export async function createRoundsBenchmark(options: {
  name: string
  rounds: number
  exercises: Array<{ name: string; reps: number }>
}): Promise<DbBenchmark> {
  const roundsArray = Array.from({ length: options.rounds }, () => ({
    exercises: options.exercises,
  }))

  return createForTimeBenchmarkWithRounds({
    name: options.name,
    rounds: roundsArray,
  })
}

/**
 * Starts a benchmark workout from the detail page and enters active mode.
 */
export async function startBenchmarkWorkout(
  app: Awaited<ReturnType<typeof createTestApp>>,
  benchmarkId: string,
): Promise<void> {
  await app.benchmarkDetail.navigateToDetail(benchmarkId)
  await app.benchmarkDetail.clickStartWorkout()
  await expectElement(page.getByRole('button', { name: /tap to advance/i })).toBeVisible()
}

/**
 * Completes the current exercise by tapping the focus mode area.
 * Waits for observable outcome (next exercise or completion screen).
 */
export async function completeExercise(): Promise<void> {
  const currentExerciseHeading = await page.getByRole('heading', { level: 2 }).query()
  const currentExerciseName = currentExerciseHeading
    ? await currentExerciseHeading.textContent
    : null

  const focusModeArea = page.getByRole('button', { name: /tap to advance/i })
  await userEvent.click(await focusModeArea.element())

  await expect
    .poll(
      async () => {
        const completionScreen = await page.getByText(/workout complete/i).query()
        if (completionScreen) return true

        const newHeading = await page.getByRole('heading', { level: 2 }).query()
        const newExerciseName = newHeading ? await newHeading.textContent : null

        if (currentExerciseName && newExerciseName) {
          return newExerciseName !== currentExerciseName
        }
        return false
      },
      { timeout: 2000 },
    )
    .toBe(true)
}

/**
 * Completes all exercises in sequence.
 */
export async function completeAllExercises(exerciseCount: number): Promise<void> {
  for (let index = 0; index < exerciseCount; index++) {
    await completeExercise()
  }
}

/**
 * Creates a completed workout attempt for PB testing.
 */
export async function createCompletedAttempt(
  benchmarkId: string,
  completionTime: number,
  daysAgo: number = 0,
  splitTimes?: ReadonlyArray<number>,
): Promise<void> {
  const benchmark = await getBenchmarksRepository().getById(benchmarkId)
  if (!benchmark) throw new Error('Benchmark not found')

  const now = Date.now()
  const startedAt = now - daysAgo * 24 * 60 * 60 * 1000 - completionTime * 1000
  const completedAt = now - daysAgo * 24 * 60 * 60 * 1000

  // Sort rounds by orderKey
  const sortedRounds = [...benchmark.rounds].toSorted((a, b) =>
    a.orderKey.localeCompare(b.orderKey),
  )

  // Create one ForTime block per round
  const blocks = sortedRounds.map((round, index) => {
    const sortedExercises = [...round.exercises].toSorted((a, b) =>
      a.orderKey.localeCompare(b.orderKey),
    )

    return createDatabaseForTimeBlock({
      orderIndex: index,
      exercises: sortedExercises.map((ex) =>
        createDatabaseBlockExercise({
          name: ex.name,
          prescribedReps: ex.prescribedReps,
          image: ex.image,
        }),
      ),
      result: createDatabaseForTimeResult({
        completionTime,
        splitTimes: splitTimes ?? [],
      }),
    })
  })

  const workout: DbCompletedWorkout = {
    id: generateId(),
    name: benchmark.name,
    benchmarkId,
    startedAt,
    completedAt,
    durationSeconds: completionTime,
    notes: '',
    blocks,
  }

  await db.workouts.add(workout)
}

/**
 * Waits for the completion screen to appear.
 */
export async function waitForCompletionScreen(): Promise<void> {
  await expectElement(page.getByText(/workout complete/i)).toBeVisible()
}

// Re-export commonly used items
export { getWorkoutsRepository, getBenchmarksRepository } from '@/db'
