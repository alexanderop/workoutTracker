/* eslint-disable vitest/expect-expect -- Repository helpers throw on unsuccessful seed operations. */
import { describe, it, expect, beforeEach } from 'vitest'
import { seedPopularExercises } from '@/db/seedExercises'
import { egymExercises, popularExercises } from '@/data/popularExercises'
import { getCustomExercisesRepository } from '@/db'
import { resetDatabase } from '@/__tests__/setup'
import { getCustomExerciseCount, expectCustomExerciseCount } from '@/__tests__/helpers/dbAssertions'

const SEED_VERSION_KEY = 'exercises_seed_version'

/**
 * Seed data integrity tests.
 *
 * These tests intentionally depend on seed data to verify data quality.
 * Unlike integration tests, these SHOULD fail when seed data changes in breaking ways.
 */
describe('seedPopularExercises', () => {
  beforeEach(async () => {
    await resetDatabase()
    localStorage.removeItem(SEED_VERSION_KEY)
  })

  it('seeds exercises on first run', async () => {
    await seedPopularExercises()
    const count = await getCustomExerciseCount()
    expect(count).toBe(popularExercises.length)
  })

  it('re-seeds when IndexedDB was cleared but localStorage still has seed version', async () => {
    // Simulate: browser cleared IndexedDB but kept localStorage
    localStorage.setItem('exercises_seed_version', '1')
    // IndexedDB is empty from resetDatabase()

    await seedPopularExercises()

    // Should detect empty IndexedDB and re-seed
    const count = await getCustomExerciseCount()
    expect(count).toBe(popularExercises.length)
  })

  it('skips seeding when exercises already exist', async () => {
    // First seed
    await seedPopularExercises()
    const firstCount = await getCustomExerciseCount()

    // Second call should not duplicate
    await seedPopularExercises()
    const secondCount = await getCustomExerciseCount()

    expect(secondCount).toBe(firstCount)
  })

  it('tops up the EGYM batch for databases seeded before versioning existed', async () => {
    // Simulate a pre-versioning install: full seed, then strip the EGYM batch
    // and the version marker so the database looks like an old v1 seed.
    await seedPopularExercises()
    const repo = getCustomExercisesRepository()
    const egymNames = new Set(egymExercises.map((exercise) => exercise.name))
    const seeded = await repo.getAll()
    await Promise.all(seeded.filter((ex) => egymNames.has(ex.name)).map((ex) => repo.delete(ex.id)))
    localStorage.removeItem(SEED_VERSION_KEY)

    await seedPopularExercises()

    await expectCustomExerciseCount(popularExercises.length)
  })

  it('does not resurrect user-deleted exercises once the version marker is current', async () => {
    await seedPopularExercises()
    const repo = getCustomExercisesRepository()
    const seeded = await repo.getAll()
    const deleted = seeded.find((ex) => ex.name === 'EGYM Chest Press')!
    await repo.delete(deleted.id)

    await seedPopularExercises()

    await expectCustomExerciseCount(popularExercises.length - 1)
  })
})

/**
 * Seed data quality tests.
 *
 * Guard rails to catch data issues early, before they break integration tests.
 * If these fail, fix the seed data - don't change the tests.
 */
describe('popularExercises data integrity', () => {
  it('has no duplicate exercise names', () => {
    const names = popularExercises.map((e) => e.name)
    const uniqueNames = new Set(names)
    expect(names).toHaveLength(uniqueNames.size)
  })

  it('all exercises have required fields', () => {
    for (const exercise of popularExercises) {
      expect(exercise.name).toBeTruthy()
      expect(exercise.muscle).toBeTruthy()
      expect(exercise.equipment).toBeTruthy()
      expect(exercise.type).toBeTruthy()
      expect(exercise.metrics).toBeTruthy()
    }
  })

  it('exercise names are properly formatted (no leading/trailing whitespace)', () => {
    for (const exercise of popularExercises) {
      expect(exercise.name).toBe(exercise.name.trim())
    }
  })
})
