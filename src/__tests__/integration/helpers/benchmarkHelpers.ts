import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import type { createTestApp } from '../../helpers/createTestApp'
import { getBenchmarksRepository, getWorkoutsRepository } from '@/db'
import type { DbBenchmark, DbCompletedWorkout } from '@/db/schema'
import {
  createDbBenchmarkExercise,
  createDbBlockExercise,
  createDbForTimeBlock,
  createDbForTimeResult,
  generateId,
} from '../../factories'
import { getRepositoryProvider } from '@/db/provider'

/**
 * Creates a ForTime benchmark with customizable options.
 * Defaults to "Fran" with Thrusters (21) and Pull-ups (21).
 */
export async function createForTimeBenchmark(options?: {
  name?: string
  exercises?: Array<{ name: string, reps: number }>
}): Promise<DbBenchmark> {
  return getBenchmarksRepository().create({
    name: options?.name ?? 'Fran',
    type: 'fortime',
    rounds: 1,
    exercises: options?.exercises?.map(ex =>
      createDbBenchmarkExercise({
        name: ex.name,
        prescribedReps: ex.reps,
        thumbnail: '',
      }),
    ) ?? [
      createDbBenchmarkExercise({ name: 'Thrusters', prescribedReps: 21, thumbnail: '' }),
      createDbBenchmarkExercise({ name: 'Pull-ups', prescribedReps: 21, thumbnail: '' }),
    ],
  })
}

/**
 * Creates a Rounds benchmark with specified configuration.
 */
export async function createRoundsBenchmark(options: {
  name: string
  rounds: number
  exercises: Array<{ name: string, reps: number }>
}): Promise<DbBenchmark> {
  return getBenchmarksRepository().create({
    name: options.name,
    type: 'rounds',
    rounds: options.rounds,
    exercises: options.exercises.map(ex =>
      createDbBenchmarkExercise({
        name: ex.name,
        prescribedReps: ex.reps,
        thumbnail: '',
      }),
    ),
  })
}

/**
 * Starts a benchmark workout from the detail page and enters active mode.
 */
export async function startBenchmarkWorkout(
  app: Awaited<ReturnType<typeof createTestApp>>,
  benchmarkId: string
): Promise<void> {
  await app.benchmarkDetail.navigateToDetail(benchmarkId)
  await app.benchmarkDetail.clickStartWorkout()
  await expect.element(page.getByRole('button', { name: /tap to advance/i })).toBeVisible()
}

/**
 * Completes the current exercise by tapping the focus mode area.
 * Waits for observable outcome (next exercise or completion screen).
 */
export async function completeExercise(): Promise<void> {
  const currentExerciseHeading = await page.getByRole('heading', { level: 2 }).query()
  const currentExerciseName = currentExerciseHeading ? await currentExerciseHeading.textContent : null

  const focusModeArea = page.getByRole('button', { name: /tap to advance/i })
  await userEvent.click(await focusModeArea.element())

  await expect.poll(
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
    { timeout: 2000 }
  ).toBe(true)
}

/**
 * Completes all exercises in sequence.
 */
export async function completeAllExercises(exerciseCount: number): Promise<void> {
  for (let i = 0; i < exerciseCount; i++) {
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
  splitTimes?: ReadonlyArray<number>
): Promise<void> {
  const benchmark = await getBenchmarksRepository().getById(benchmarkId)
  if (!benchmark) throw new Error('Benchmark not found')

  const now = Date.now()
  const startedAt = now - (daysAgo * 24 * 60 * 60 * 1000) - (completionTime * 1000)
  const completedAt = now - (daysAgo * 24 * 60 * 60 * 1000)

  const forTimeBlock = createDbForTimeBlock({
    exercises: benchmark.exercises.map(ex =>
      createDbBlockExercise({
        name: ex.name,
        prescribedReps: ex.prescribedReps,
        thumbnail: ex.thumbnail,
      }),
    ),
    result: createDbForTimeResult({
      completionTime,
      splitTimes: splitTimes ?? [],
    }),
  })

  const workoutId = generateId()
  const workout: DbCompletedWorkout = {
    id: workoutId,
    name: benchmark.name,
    benchmarkId,
    startedAt,
    completedAt,
    durationSeconds: completionTime,
    notes: '',
    blocks: [forTimeBlock],
  }

  // Use repository method which handles normalized table writes
  await getWorkoutsRepository().add(workout)

  // Record attempt and update personal best
  await getRepositoryProvider().benchmarks.recordAttempt({
    benchmarkId,
    workoutId,
    completionTimeSeconds: completionTime,
  })
}

/**
 * Waits for the completion screen to appear.
 */
export async function waitForCompletionScreen(): Promise<void> {
  await expect.element(page.getByText(/workout complete/i)).toBeVisible()
}

// Re-export commonly used items
export { getWorkoutsRepository, getBenchmarksRepository }
