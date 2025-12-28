/**
 * Integration tests for Exercise Store partial updates
 *
 * Tests verify that partial updates to exercises preserve unchanged fields.
 * When updating only one field (e.g., name), other fields (equipment, muscle, image)
 * should not be deleted or overwritten in the database.
 */
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { useExercisesStore } from '@/stores/exercises'
import { getCustomExercisesRepository, generateId } from '@/db'
import type { DbCustomExercise } from '@/db/schema'
import { resetDatabase } from '../helpers/resetDatabase'

describe('Exercise Store Partial Updates', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  afterEach(async () => {
    await resetDatabase()
  })

  it('preserves equipment when updating only name', async () => {
    // Arrange: Create exercise with equipment directly in DB
    const exerciseId = generateId()
    const originalExercise: DbCustomExercise = {
      id: exerciseId,
      name: 'Bench Press',
      equipment: 'barbell',
      muscle: 'chest',
      type: 'compound',
      metrics: 'weight-reps',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      image: null,
    }
    await getCustomExercisesRepository().add(originalExercise)

    // Load store
    const store = useExercisesStore()
    await store.loadFromDb()

    // Act: Update only the name
    await store.updateExercise(exerciseId, { name: 'Incline Bench Press' })

    // Assert: Equipment should still be 'barbell' in DB
    const updated = await getCustomExercisesRepository().getById(exerciseId)
    expect(updated?.name).toBe('Incline Bench Press')
    expect(updated?.equipment).toBe('barbell')
  })

  it('preserves muscle when updating only name', async () => {
    // Arrange: Create exercise with muscle directly in DB
    const exerciseId = generateId()
    const originalExercise: DbCustomExercise = {
      id: exerciseId,
      name: 'Squat',
      equipment: 'barbell',
      muscle: 'legs',
      type: 'compound',
      metrics: 'weight-reps',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      image: null,
    }
    await getCustomExercisesRepository().add(originalExercise)

    // Load store
    const store = useExercisesStore()
    await store.loadFromDb()

    // Act: Update only the name
    await store.updateExercise(exerciseId, { name: 'Front Squat' })

    // Assert: Muscle should still be 'legs' in DB
    const updated = await getCustomExercisesRepository().getById(exerciseId)
    expect(updated?.name).toBe('Front Squat')
    expect(updated?.muscle).toBe('legs')
  })

  it('preserves image when updating only name', async () => {
    // Arrange: Create exercise with image blob directly in DB
    const exerciseId = generateId()
    const testImageBlob = new Blob(['test-image-data'], { type: 'image/png' })
    const originalExercise: DbCustomExercise = {
      id: exerciseId,
      name: 'Deadlift',
      equipment: 'barbell',
      muscle: 'back',
      type: 'compound',
      metrics: 'weight-reps',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      image: testImageBlob,
    }
    await getCustomExercisesRepository().add(originalExercise)

    // Load store
    const store = useExercisesStore()
    await store.loadFromDb()

    // Act: Update only the name
    await store.updateExercise(exerciseId, { name: 'Romanian Deadlift' })

    // Assert: Image should still exist in DB
    const updated = await getCustomExercisesRepository().getById(exerciseId)
    expect(updated?.name).toBe('Romanian Deadlift')
    expect(updated?.image).not.toBeNull()
    expect(updated?.image?.size).toBe(testImageBlob.size)
  })

  it('preserves all fields when updating only type', async () => {
    // Arrange: Create fully populated exercise
    const exerciseId = generateId()
    const testImageBlob = new Blob(['image-data'], { type: 'image/png' })
    const originalExercise: DbCustomExercise = {
      id: exerciseId,
      name: 'Bicep Curl',
      equipment: 'dumbbell',
      muscle: 'arms',
      type: 'isolation',
      metrics: 'weight-reps',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      image: testImageBlob,
    }
    await getCustomExercisesRepository().add(originalExercise)

    // Load store
    const store = useExercisesStore()
    await store.loadFromDb()

    // Act: Update only the type
    await store.updateExercise(exerciseId, { type: 'compound' })

    // Assert: All other fields should be preserved
    const updated = await getCustomExercisesRepository().getById(exerciseId)
    expect(updated?.type).toBe('compound')
    expect(updated?.name).toBe('Bicep Curl')
    expect(updated?.equipment).toBe('dumbbell')
    expect(updated?.muscle).toBe('arms')
    expect(updated?.metrics).toBe('weight-reps')
    expect(updated?.image).not.toBeNull()
  })

  it('allows explicitly setting equipment to null/undefined', async () => {
    // Arrange: Create exercise with equipment
    const exerciseId = generateId()
    const originalExercise: DbCustomExercise = {
      id: exerciseId,
      name: 'Pull-up',
      equipment: 'bodyweight',
      muscle: 'back',
      type: 'compound',
      metrics: 'reps-only',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      image: null,
    }
    await getCustomExercisesRepository().add(originalExercise)

    // Load store
    const store = useExercisesStore()
    await store.loadFromDb()

    // Act: Explicitly remove equipment by setting to undefined
    await store.updateExercise(exerciseId, { equipment: undefined })

    // Assert: Equipment should be null in DB (undefined → null conversion)
    const updated = await getCustomExercisesRepository().getById(exerciseId)
    expect(updated?.equipment).toBeNull()
    expect(updated?.muscle).toBe('back') // Other fields preserved
  })
})
