import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db'
import { seedPopularExercises } from '@/db/seedExercises'
import { popularExercises } from '@/data/popularExercises'
import { resetDatabase } from '@/__tests__/setup'

describe('seedPopularExercises', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('seeds exercises on first run', async () => {
    await seedPopularExercises()
    const count = await db.customExercises.count()
    expect(count).toBe(popularExercises.length)
  })

  it('re-seeds when IndexedDB was cleared but localStorage still has seed version', async () => {
    // Simulate: browser cleared IndexedDB but kept localStorage
    localStorage.setItem('exercises_seed_version', '1')
    // IndexedDB is empty from resetDatabase()

    await seedPopularExercises()

    // Should detect empty IndexedDB and re-seed
    const count = await db.customExercises.count()
    expect(count).toBe(popularExercises.length)
  })

  it('skips seeding when exercises already exist', async () => {
    // First seed
    await seedPopularExercises()
    const firstCount = await db.customExercises.count()

    // Second call should not duplicate
    await seedPopularExercises()
    const secondCount = await db.customExercises.count()

    expect(secondCount).toBe(firstCount)
  })
})
