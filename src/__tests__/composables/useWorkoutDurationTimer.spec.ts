import { effectScope, nextTick } from 'vue'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useWorkoutDurationTimer } from '@/features/workout/composables/useWorkoutDurationTimer'
import { getWorkoutRef, resetWorkout, restoreWorkout } from '@/stores/workoutState'

describe('useWorkoutDurationTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-01-01T00:00:00Z'))
    resetWorkout()
  })

  afterEach(() => {
    resetWorkout()
    vi.useRealTimers()
  })

  it('shares one interval and keeps it paused outside active mode', async () => {
    const setIntervalSpy = vi.spyOn(globalThis, 'setInterval')
    const clearIntervalSpy = vi.spyOn(globalThis, 'clearInterval')
    const scope = effectScope()
    const timers = scope.run(() => ({
      first: useWorkoutDurationTimer(),
      second: useWorkoutDurationTimer(),
    }))!

    expect(timers.first.elapsedSeconds).toBe(timers.second.elapsedSeconds)
    expect(setIntervalSpy).not.toHaveBeenCalled()

    restoreWorkout({
      ...getWorkoutRef().value,
      mode: 'active',
      startedAt: Date.now(),
    })
    await nextTick()

    expect(setIntervalSpy).toHaveBeenCalledTimes(1)
    vi.advanceTimersByTime(2000)
    expect(timers.first.elapsedSeconds.value).toBe(2)
    expect(timers.second.elapsedSeconds.value).toBe(2)

    scope.stop()
    expect(clearIntervalSpy).toHaveBeenCalledTimes(1)
  })
})
