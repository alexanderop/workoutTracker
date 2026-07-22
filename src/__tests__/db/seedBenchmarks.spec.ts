import { describe, it, expect, beforeEach } from 'vitest'
import { seedFreeleticsBenchmarks } from '@/db/seedBenchmarks'
import { freeleticsBenchmarks } from '@/data/freeleticsBenchmarks'
import { getBenchmarksRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'

const SEED_VERSION_KEY = 'benchmarks_seed_version'

const orderKeyCollator = new Intl.Collator()

/**
 * Seed data integrity tests.
 *
 * These tests intentionally depend on seed data to verify data quality.
 * Unlike integration tests, these SHOULD fail when seed data changes in breaking ways.
 */
describe('seedFreeleticsBenchmarks', () => {
  beforeEach(async () => {
    await resetDatabase()
    localStorage.removeItem(SEED_VERSION_KEY)
  })

  it('seeds benchmarks on first run', async () => {
    await seedFreeleticsBenchmarks()
    const benchmarks = await getBenchmarksRepository().getAll()
    expect(benchmarks).toHaveLength(freeleticsBenchmarks.length)
  })

  it('skips seeding when the version marker is current', async () => {
    await seedFreeleticsBenchmarks()
    const firstCount = (await getBenchmarksRepository().getAll()).length

    await seedFreeleticsBenchmarks()
    const secondCount = (await getBenchmarksRepository().getAll()).length

    expect(secondCount).toBe(firstCount)
  })

  it('re-seeds when IndexedDB was cleared but localStorage still has seed version', async () => {
    // Simulate: browser cleared IndexedDB but kept localStorage
    localStorage.setItem(SEED_VERSION_KEY, '1')
    // IndexedDB is empty from resetDatabase()

    await seedFreeleticsBenchmarks()

    const benchmarks = await getBenchmarksRepository().getAll()
    expect(benchmarks).toHaveLength(freeleticsBenchmarks.length)
  })

  it('tops up databases that already contain user-created benchmarks', async () => {
    const repo = getBenchmarksRepository()
    await repo.create({
      name: 'My Custom Benchmark',
      type: 'fortime',
      rounds: [
        {
          orderKey: 'a0',
          exercises: [
            {
              orderKey: 'a0',
              exerciseDefinitionId: null,
              name: 'Burpees',
              prescribedReps: 10,
              image: null,
            },
          ],
        },
      ],
    })

    await seedFreeleticsBenchmarks()

    const benchmarks = await repo.getAll()
    expect(benchmarks).toHaveLength(freeleticsBenchmarks.length + 1)
    expect(benchmarks.some((b) => b.name === 'My Custom Benchmark')).toBe(true)
  })

  it('does not duplicate a benchmark the user already has by name', async () => {
    const repo = getBenchmarksRepository()
    await repo.create({
      name: 'aphrodite',
      type: 'fortime',
      rounds: [
        {
          orderKey: 'a0',
          exercises: [
            {
              orderKey: 'a0',
              exerciseDefinitionId: null,
              name: 'Burpees',
              prescribedReps: 10,
              image: null,
            },
          ],
        },
      ],
    })

    await seedFreeleticsBenchmarks()

    const benchmarks = await repo.getAll()
    expect(benchmarks).toHaveLength(freeleticsBenchmarks.length)
    expect(benchmarks.filter((b) => b.name.toLowerCase() === 'aphrodite')).toHaveLength(1)
  })

  it('does not resurrect user-deleted benchmarks once the version marker is current', async () => {
    await seedFreeleticsBenchmarks()
    const repo = getBenchmarksRepository()
    const seeded = await repo.getAll()
    const aphrodite = seeded.find((b) => b.name === 'Aphrodite')!
    await repo.delete(aphrodite.id)

    await seedFreeleticsBenchmarks()

    const benchmarks = await repo.getAll()
    expect(benchmarks).toHaveLength(freeleticsBenchmarks.length - 1)
  })

  it('seeds Aphrodite with its classic descending rep scheme', async () => {
    await seedFreeleticsBenchmarks()
    const benchmarks = await getBenchmarksRepository().getAll()
    const aphrodite = benchmarks.find((b) => b.name === 'Aphrodite')

    expect(aphrodite).toBeDefined()
    expect(aphrodite!.type).toBe('fortime')
    expect(aphrodite!.rounds).toHaveLength(5)

    const sortedRounds = [...aphrodite!.rounds].toSorted((a, b) =>
      orderKeyCollator.compare(a.orderKey, b.orderKey),
    )
    const repsPerRound = sortedRounds.map((round) => round.exercises[0]!.prescribedReps)
    expect(repsPerRound).toEqual([50, 40, 30, 20, 10])
    expect(sortedRounds[0]!.exercises.map((e) => e.name)).toEqual([
      'Burpees',
      'Bodyweight Squat',
      'Sit-ups',
    ])
  })
})

/**
 * Seed data quality tests.
 *
 * Guard rails to catch data issues early, before they break integration tests.
 * If these fail, fix the seed data - don't change the tests.
 */
describe('freeleticsBenchmarks data integrity', () => {
  it('has no duplicate benchmark names', () => {
    const names = freeleticsBenchmarks.map((b) => b.name.toLowerCase())
    expect(names).toHaveLength(new Set(names).size)
  })

  it('every benchmark has at least one round with at least one exercise', () => {
    for (const benchmark of freeleticsBenchmarks) {
      expect(benchmark.rounds.length).toBeGreaterThan(0)
      for (const round of benchmark.rounds) {
        expect(round.length).toBeGreaterThan(0)
      }
    }
  })

  it('all prescribed reps are positive integers', () => {
    for (const benchmark of freeleticsBenchmarks) {
      for (const round of benchmark.rounds) {
        for (const exercise of round) {
          expect(Number.isSafeInteger(exercise.reps)).toBe(true)
          expect(exercise.reps).toBeGreaterThan(0)
        }
      }
    }
  })

  it('exercise names are properly formatted (no leading/trailing whitespace)', () => {
    for (const benchmark of freeleticsBenchmarks) {
      expect(benchmark.name).toBe(benchmark.name.trim())
      for (const round of benchmark.rounds) {
        for (const exercise of round) {
          expect(exercise.name).toBe(exercise.name.trim())
        }
      }
    }
  })
})
