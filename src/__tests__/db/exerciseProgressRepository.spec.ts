import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { db, getExerciseProgressRepository } from '@/db'
import { resetDatabase } from '../helpers/resetDatabase'
import { createDbStrengthBlockWithSets, dbWorkoutBuilder } from '../factories'

const DAY_MS = 24 * 60 * 60 * 1000
const EXERCISE_ID = 'test-bench-press'

async function seedWorkout(
  daysAgo: number,
  sets: ReadonlyArray<{ kg: string; reps: string; rir?: string }>,
  name = 'Bench Press',
): Promise<void> {
  const completedAt = Date.now() - daysAgo * DAY_MS
  const workout = dbWorkoutBuilder()
    .withName(`Workout ${daysAgo}d ago`)
    .withTimestamps(completedAt - 3_600_000, completedAt)
    .withBlock(
      createDbStrengthBlockWithSets(
        sets.map((s) => ({ ...s, rir: s.rir ?? '2', status: 'completed' })),
        { exerciseDefinitionId: EXERCISE_ID, name },
      ),
    )
    .build()
  await db.workouts.add(workout)
}

describe('exercise progress repository', () => {
  beforeEach(resetDatabase)
  afterEach(resetDatabase)

  describe('getExerciseHistory', () => {
    it('returns sessions newest first with volume and max weight', async () => {
      await seedWorkout(10, [{ kg: '100', reps: '5' }])
      await seedWorkout(2, [
        { kg: '105', reps: '3' },
        { kg: '95', reps: '8' },
      ])

      const repo = getExerciseProgressRepository()
      const sessions = await repo.getExerciseHistory(EXERCISE_ID)

      expect(sessions).toHaveLength(2)
      expect(sessions[0]?.maxWeight).toBe(105)
      expect(sessions[0]?.totalVolume).toBe(105 * 3 + 95 * 8)
      expect(sessions[0]?.totalReps).toBe(11)
      expect(sessions[1]?.maxWeight).toBe(100)
    })

    it('supports limit and offset pagination', async () => {
      await seedWorkout(3, [{ kg: '90', reps: '5' }])
      await seedWorkout(2, [{ kg: '95', reps: '5' }])
      await seedWorkout(1, [{ kg: '100', reps: '5' }])

      const repo = getExerciseProgressRepository()

      const firstPage = await repo.getExerciseHistory(EXERCISE_ID, { limit: 2 })
      expect(firstPage.map((s) => s.maxWeight)).toEqual([100, 95])

      const secondPage = await repo.getExerciseHistory(EXERCISE_ID, { limit: 2, offset: 2 })
      expect(secondPage.map((s) => s.maxWeight)).toEqual([90])
    })

    it('filters sessions by date range', async () => {
      await seedWorkout(20, [{ kg: '90', reps: '5' }])
      await seedWorkout(1, [{ kg: '100', reps: '5' }])

      const repo = getExerciseProgressRepository()
      const sessions = await repo.getExerciseHistory(EXERCISE_ID, {
        dateRange: { from: new Date(Date.now() - 7 * DAY_MS), to: new Date() },
      })

      expect(sessions).toHaveLength(1)
      expect(sessions[0]?.maxWeight).toBe(100)
    })

    it('ignores workouts of other exercises and non-completed sets', async () => {
      const completedAt = Date.now() - DAY_MS
      const workout = dbWorkoutBuilder()
        .withTimestamps(completedAt - 3_600_000, completedAt)
        .withBlock(
          createDbStrengthBlockWithSets(
            [
              { kg: '100', reps: '5', status: 'completed' },
              { kg: '200', reps: '5', status: 'planned', completedAt: null },
            ],
            { exerciseDefinitionId: EXERCISE_ID },
          ),
        )
        .withBlock(
          createDbStrengthBlockWithSets([{ kg: '60', reps: '10', status: 'completed' }], {
            exerciseDefinitionId: 'other-exercise',
          }),
        )
        .build()
      await db.workouts.add(workout)

      const repo = getExerciseProgressRepository()
      const sessions = await repo.getExerciseHistory(EXERCISE_ID)

      expect(sessions).toHaveLength(1)
      expect(sessions[0]?.sets).toHaveLength(1)
      expect(sessions[0]?.maxWeight).toBe(100)
    })
  })

  describe('getExerciseStats', () => {
    it('returns empty stats when the exercise was never performed', async () => {
      const repo = getExerciseProgressRepository()

      const stats = await repo.getExerciseStats(EXERCISE_ID)

      expect(stats).toMatchObject({
        exerciseDefinitionId: EXERCISE_ID,
        totalSessions: 0,
        lastPerformed: null,
        firstPerformed: null,
        avgVolumePerSession: 0,
        avgFrequencyDays: null,
      })
    })

    it('aggregates totals, averages, and frequency across sessions', async () => {
      await seedWorkout(8, [{ kg: '100', reps: '5' }])
      await seedWorkout(4, [{ kg: '100', reps: '5' }])

      const repo = getExerciseProgressRepository()
      const stats = await repo.getExerciseStats(EXERCISE_ID)

      expect(stats.totalSessions).toBe(2)
      expect(stats.exerciseName).toBe('Bench Press')
      expect(stats.avgVolumePerSession).toBe(500)
      expect(stats.avgFrequencyDays).toBeCloseTo(4, 1)
    })
  })

  describe('getPersonalRecords', () => {
    it('returns null records when there is no history', async () => {
      const repo = getExerciseProgressRepository()

      const records = await repo.getPersonalRecords(EXERCISE_ID)

      expect(records).toEqual({
        maxWeight: null,
        estimated1RM: null,
        maxVolume: null,
        maxRepsAtWeight: new Map(),
      })
    })

    it('tracks max weight, estimated 1RM, volume, and reps-at-weight PRs', async () => {
      await seedWorkout(5, [
        { kg: '100', reps: '5' },
        { kg: '100', reps: '8' },
      ])
      await seedWorkout(1, [{ kg: '110', reps: '2' }])

      const repo = getExerciseProgressRepository()
      const records = await repo.getPersonalRecords(EXERCISE_ID)

      expect(records.maxWeight).toMatchObject({ kg: 110, reps: 2 })
      // Brzycki: 100 × (36 / (37 - 8)) ≈ 124.1 beats 110 × (36 / 35) ≈ 113.1
      expect(records.estimated1RM?.kg).toBeCloseTo(100 * (36 / 29), 1)
      expect(records.maxVolume?.volume).toBe(100 * 5 + 100 * 8)
      expect(records.maxRepsAtWeight.get(100)?.reps).toBe(8)
    })
  })

  describe('getPerformedExercises', () => {
    it('counts one occurrence per workout and sorts by frequency', async () => {
      await seedWorkout(3, [{ kg: '100', reps: '5' }])
      await seedWorkout(2, [
        { kg: '100', reps: '5' },
        { kg: '100', reps: '5' },
      ])
      const completedAt = Date.now() - DAY_MS
      const squatWorkout = dbWorkoutBuilder()
        .withTimestamps(completedAt - 3_600_000, completedAt)
        .withBlock(
          createDbStrengthBlockWithSets([{ kg: '140', reps: '5', status: 'completed' }], {
            exerciseDefinitionId: 'test-squat',
            name: 'Squat',
          }),
        )
        .build()
      await db.workouts.add(squatWorkout)

      const repo = getExerciseProgressRepository()
      const performed = await repo.getPerformedExercises()

      expect(performed.map((p) => p.exerciseDefinitionId)).toEqual([EXERCISE_ID, 'test-squat'])
      expect(performed[0]?.workoutCount).toBe(2)
      expect(performed[1]?.workoutCount).toBe(1)
    })
  })
})
