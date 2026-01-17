import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db'
import { seedPopularBenchmarks } from '@/db/seedBenchmarks'
import { popularBenchmarks } from '@/data/popularBenchmarks'
import { resetDatabase } from '@/__tests__/setup'

describe('seedPopularBenchmarks', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('seeds benchmarks on first run', async () => {
    await seedPopularBenchmarks()
    const count = await db.benchmarks.count()
    expect(count).toBe(popularBenchmarks.length)
  })

  it('skips seeding when benchmarks already exist', async () => {
    // First seed
    await seedPopularBenchmarks()
    const firstCount = await db.benchmarks.count()

    // Second call should not duplicate
    await seedPopularBenchmarks()
    const secondCount = await db.benchmarks.count()

    expect(secondCount).toBe(firstCount)
  })

  it('seeds Fran benchmark with 21-15-9 structure', async () => {
    await seedPopularBenchmarks()
    const benchmarks = await db.benchmarks.toArray()
    const fran = benchmarks.find((b) => b.name === 'Fran')

    expect(fran).toBeDefined()
    expect(fran!.type).toBe('fortime')
    expect(fran!.rounds).toHaveLength(3)

    // Round 1: 21 reps
    expect(fran!.rounds[0]!.exercises).toHaveLength(2)
    expect(fran!.rounds[0]!.exercises[0]).toMatchObject({
      name: 'Barbell Thruster',
      prescribedReps: 21,
    })
    expect(fran!.rounds[0]!.exercises[1]).toMatchObject({
      name: 'Pull-ups',
      prescribedReps: 21,
    })

    // Round 2: 15 reps
    expect(fran!.rounds[1]!.exercises[0]).toMatchObject({
      prescribedReps: 15,
    })

    // Round 3: 9 reps
    expect(fran!.rounds[2]!.exercises[0]).toMatchObject({
      prescribedReps: 9,
    })
  })

  it('seeds Grace benchmark with 30 Clean & Jerks', async () => {
    await seedPopularBenchmarks()
    const benchmarks = await db.benchmarks.toArray()
    const grace = benchmarks.find((b) => b.name === 'Grace')

    expect(grace).toBeDefined()
    expect(grace!.rounds).toHaveLength(1)
    expect(grace!.rounds[0]!.exercises).toHaveLength(1)
    expect(grace!.rounds[0]!.exercises[0]).toMatchObject({
      name: 'Clean & Jerk',
      prescribedReps: 30,
    })
  })

  it('seeds Annie benchmark with 50-40-30-20-10 pyramid', async () => {
    await seedPopularBenchmarks()
    const benchmarks = await db.benchmarks.toArray()
    const annie = benchmarks.find((b) => b.name === 'Annie')

    expect(annie).toBeDefined()
    expect(annie!.rounds).toHaveLength(5)

    const expectedReps = [50, 40, 30, 20, 10]
    for (const [index, round] of annie!.rounds.entries()) {
      expect(round.exercises).toHaveLength(2)
      expect(round.exercises[0]).toMatchObject({
        name: 'Double-under',
        prescribedReps: expectedReps[index],
      })
      expect(round.exercises[1]).toMatchObject({
        name: 'Sit-ups',
        prescribedReps: expectedReps[index],
      })
    }
  })

  it('seeds Helen benchmark with 3 rounds of same structure', async () => {
    await seedPopularBenchmarks()
    const benchmarks = await db.benchmarks.toArray()
    const helen = benchmarks.find((b) => b.name === 'Helen')

    expect(helen).toBeDefined()
    expect(helen!.rounds).toHaveLength(3)

    // All rounds should have the same structure
    for (const round of helen!.rounds) {
      expect(round.exercises).toHaveLength(3)
      expect(round.exercises[0]).toMatchObject({
        name: 'Run',
        prescribedReps: 1,
      })
      expect(round.exercises[1]).toMatchObject({
        name: 'Kettlebell Swing',
        prescribedReps: 21,
      })
      expect(round.exercises[2]).toMatchObject({
        name: 'Pull-ups',
        prescribedReps: 12,
      })
    }
  })

  it('all seeded benchmarks have valid orderKeys', async () => {
    await seedPopularBenchmarks()
    const benchmarks = await db.benchmarks.toArray()

    for (const benchmark of benchmarks) {
      // All rounds should have orderKeys
      expect(benchmark.rounds.length).toBeGreaterThan(0)
      for (const round of benchmark.rounds) {
        expect(round.orderKey).toBeTruthy()
        expect(typeof round.orderKey).toBe('string')

        // All exercises should have orderKeys
        expect(round.exercises.length).toBeGreaterThan(0)
        for (const exercise of round.exercises) {
          expect(exercise.orderKey).toBeTruthy()
          expect(typeof exercise.orderKey).toBe('string')
        }
      }
    }
  })
})

/**
 * Seed data quality tests.
 */
describe('popularBenchmarks data integrity', () => {
  it('has no duplicate benchmark names', () => {
    const names = popularBenchmarks.map((b) => b.name)
    const uniqueNames = new Set(names)
    expect(names.length).toBe(uniqueNames.size)
  })

  it('all benchmarks are fortime type', () => {
    for (const benchmark of popularBenchmarks) {
      expect(benchmark.type).toBe('fortime')
    }
  })

  it('all benchmarks have at least one round', () => {
    for (const benchmark of popularBenchmarks) {
      expect(benchmark.rounds.length).toBeGreaterThan(0)
    }
  })

  it('all rounds have at least one exercise', () => {
    for (const benchmark of popularBenchmarks) {
      for (const round of benchmark.rounds) {
        expect(round.exercises.length).toBeGreaterThan(0)
      }
    }
  })

  it('all exercises have required fields', () => {
    for (const benchmark of popularBenchmarks) {
      for (const round of benchmark.rounds) {
        for (const exercise of round.exercises) {
          expect(exercise.name).toBeTruthy()
          expect(typeof exercise.prescribedReps).toBe('number')
          expect(exercise.prescribedReps).toBeGreaterThan(0)
          expect(exercise.exerciseDefinitionId).toBeNull()
          expect(exercise.image).toBeNull()
        }
      }
    }
  })
})
