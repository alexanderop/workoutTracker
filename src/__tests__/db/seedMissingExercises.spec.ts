import { describe, it, expect, beforeEach } from 'vitest'
import { db } from '@/db'
import { seedMissingExercises } from '@/db/seedMissingExercises'
import { seedPopularExercises } from '@/db/seedExercises'
import { popularExercises } from '@/data/popularExercises'
import { resetDatabase } from '@/__tests__/setup'

describe('seedMissingExercises', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('adds all exercises when database is empty', async () => {
    await seedMissingExercises()
    const count = await db.customExercises.count()
    expect(count).toBe(popularExercises.length)
  })

  it('does nothing when all exercises already exist', async () => {
    // First seed all exercises
    await seedPopularExercises()
    const firstCount = await db.customExercises.count()

    // seedMissingExercises should not add duplicates
    await seedMissingExercises()
    const secondCount = await db.customExercises.count()

    expect(secondCount).toBe(firstCount)
  })

  it('adds only missing exercises when some already exist', async () => {
    // Manually add a few exercises
    const now = Date.now()
    await db.customExercises.bulkAdd([
      {
        id: 'ex-1',
        name: 'Bench Press',
        equipment: 'barbell',
        muscle: 'chest',
        type: 'compound',
        metrics: 'weight-reps',
        createdAt: now,
        updatedAt: now,
        image: null,
      },
      {
        id: 'ex-2',
        name: 'Squat',
        equipment: 'barbell',
        muscle: 'legs',
        type: 'compound',
        metrics: 'weight-reps',
        createdAt: now,
        updatedAt: now,
        image: null,
      },
    ])

    const beforeCount = await db.customExercises.count()
    expect(beforeCount).toBe(2)

    // seedMissingExercises should add remaining exercises
    await seedMissingExercises()
    const afterCount = await db.customExercises.count()

    // Should have added all missing exercises (total - 2 already present)
    expect(afterCount).toBe(popularExercises.length)
  })

  it('performs case-insensitive name comparison', async () => {
    // Add exercise with different casing
    const now = Date.now()
    await db.customExercises.add({
      id: 'ex-1',
      name: 'BENCH PRESS', // Uppercase version
      equipment: 'barbell',
      muscle: 'chest',
      type: 'compound',
      metrics: 'weight-reps',
      createdAt: now,
      updatedAt: now,
      image: null,
    })

    await seedMissingExercises()
    const afterCount = await db.customExercises.count()

    // Should NOT add "Bench Press" since "BENCH PRESS" already exists
    expect(afterCount).toBe(popularExercises.length)

    // Verify the original uppercase version is preserved
    const exercises = await db.customExercises.toArray()
    const benchPresses = exercises.filter((e) => e.name.toLowerCase() === 'bench press')
    expect(benchPresses).toHaveLength(1)
    expect(benchPresses[0]!.name).toBe('BENCH PRESS')
  })

  it('preserves existing exercise data when adding missing ones', async () => {
    // Add custom exercise with user modifications
    const now = Date.now()
    const customExerciseId = 'custom-ex-1'
    await db.customExercises.add({
      id: customExerciseId,
      name: 'Bench Press',
      equipment: 'dumbbell', // User changed equipment
      muscle: 'chest',
      type: 'compound',
      metrics: 'weight-reps',
      createdAt: now,
      updatedAt: now,
      image: null,
    })

    await seedMissingExercises()

    // The user's custom exercise should be unchanged
    const customExercise = await db.customExercises.get(customExerciseId)
    expect(customExercise).toBeDefined()
    expect(customExercise!.equipment).toBe('dumbbell') // Should still be dumbbell
    expect(customExercise!.name).toBe('Bench Press')
  })
})
