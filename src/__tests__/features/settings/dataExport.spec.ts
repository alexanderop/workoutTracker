import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exportAllData } from '@/features/settings/utils/dataExport'
import { db } from '@/db'
import { resetDatabase } from '../../helpers/resetDatabase'
import { createDbCustomExercise, createDbCompletedWorkout } from '../../factories'

describe('exportAllData', () => {
  beforeEach(resetDatabase)
  afterEach(resetDatabase)

  it('exports a versioned snapshot of all user data', async () => {
    const exercise = createDbCustomExercise({ name: 'Test Export Exercise' })
    const workout = createDbCompletedWorkout({ name: 'Exported Workout' })
    await db.customExercises.add(exercise)
    await db.workouts.add(workout)

    const result = await exportAllData()

    expect(result).not.toBeNull()
    if (!result) throw new Error('Expected export data')

    expect(result.version).toBe(1)
    expect(Date.parse(result.exportedAt)).not.toBeNaN()

    expect(result.data.customExercises.map((e) => e.name)).toContain('Test Export Exercise')
    expect(result.data.workouts.map((w) => w.name)).toContain('Exported Workout')
    expect(Array.isArray(result.data.templates)).toBe(true)
    expect(Array.isArray(result.data.benchmarks)).toBe(true)
    expect(Array.isArray(result.data.settings)).toBe(true)
  })

  it('exports empty collections for a fresh database', async () => {
    const result = await exportAllData()

    expect(result).not.toBeNull()
    if (!result) throw new Error('Expected export data')

    expect(result.data.workouts).toEqual([])
    expect(result.data.customExercises).toEqual([])
  })
})
