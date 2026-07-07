import { beforeEach, describe, expect, it, vi } from 'vitest'
import { effectScope, shallowRef } from 'vue'
import { useRecentWorkouts } from '@/composables/useRecentWorkouts'
import { resetDatabase } from '@/__tests__/setup'
import { createDbCompletedWorkout } from '../factories'
import { seedCompletedWorkout } from '../helpers/dbAssertions'

async function seedWorkouts(count: number) {
  const base = Date.now()
  for (let index = 0; index < count; index++) {
    await seedCompletedWorkout(
      createDbCompletedWorkout({
        name: `Workout ${index + 1}`,
        completedAt: base - index * 60_000,
      }),
    )
  }
}

describe('useRecentWorkouts', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('should be defined', () => {
    expect(useRecentWorkouts).toBeDefined()
  })

  it('should expose the most recent workouts up to a plain-number limit', async () => {
    await seedWorkouts(5)

    const scope = effectScope()
    const result = scope.run(() => useRecentWorkouts(3))!

    await vi.waitFor(() => expect(result.isLoading.value).toBe(false))
    expect(result.recentWorkouts.value).toHaveLength(3)
    expect(result.hasHistory.value).toBe(true)

    scope.stop()
  })

  it('should re-run the query when a reactive limit changes', async () => {
    await seedWorkouts(5)
    const limit = shallowRef(2)

    const scope = effectScope()
    const result = scope.run(() => useRecentWorkouts(limit))!
    await vi.waitFor(() => expect(result.recentWorkouts.value).toHaveLength(2))

    limit.value = 4

    await vi.waitFor(() => expect(result.recentWorkouts.value).toHaveLength(4))

    scope.stop()
  })

  it('should report no history when the database is empty', async () => {
    const scope = effectScope()
    const result = scope.run(() => useRecentWorkouts())!

    await vi.waitFor(() => expect(result.isLoading.value).toBe(false))
    expect(result.hasHistory.value).toBe(false)
    expect(result.recentWorkouts.value).toHaveLength(0)

    scope.stop()
  })
})
