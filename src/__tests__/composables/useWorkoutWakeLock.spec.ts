import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'
import { useWorkoutWakeLock } from '@/composables/useWorkoutWakeLock'
import { resetWorkout, useWorkout } from '@/composables/useWorkout'
import { withSetup } from '../helpers/withSetup'

// Mock @vueuse/core's useWakeLock
const mockRequest = vi.fn()
const mockRelease = vi.fn()
const mockIsSupported = ref(true)
const mockIsActive = ref(false)

vi.mock('@vueuse/core', () => ({
  useWakeLock: vi.fn(() => ({
    isSupported: mockIsSupported,
    isActive: mockIsActive,
    request: mockRequest,
    release: mockRelease,
  })),
}))

describe('useWorkoutWakeLock', () => {
  beforeEach(() => {
    resetWorkout()
    mockRequest.mockClear()
    mockRelease.mockClear()
  })

  afterEach(() => {
    resetWorkout()
  })

  describe('initial state', () => {
    it('returns isSupported from VueUse wake lock', () => {
      const [result, app] = withSetup(() => useWorkoutWakeLock())

      expect(result.isSupported.value).toBe(true)
      app.unmount()
    })

    it('returns isActive from VueUse wake lock', () => {
      const [result, app] = withSetup(() => useWorkoutWakeLock())

      expect(result.isActive.value).toBe(false)
      app.unmount()
    })

    it('does not request wake lock when workout is in builder mode', () => {
      const { workout } = useWorkout()
      expect(workout.value.mode).toBe('builder')

      const [, app] = withSetup(() => useWorkoutWakeLock())

      expect(mockRequest).not.toHaveBeenCalled()
      app.unmount()
    })
  })

  describe('mode transitions', () => {
    it('requests wake lock when workout mode changes to active', () => {
      const { workout } = useWorkout()
      const [, app] = withSetup(() => useWorkoutWakeLock())

      workout.value.mode = 'active'

      expect(mockRequest).toHaveBeenCalledWith('screen')
      expect(mockRequest).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('releases wake lock when workout mode changes to builder', () => {
      const { workout } = useWorkout()
      const [, app] = withSetup(() => useWorkoutWakeLock())

      workout.value.mode = 'active'
      mockRequest.mockClear()

      workout.value.mode = 'builder'

      expect(mockRelease).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('requests wake lock immediately if workout starts in active mode', () => {
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [, app] = withSetup(() => useWorkoutWakeLock())

      expect(mockRequest).toHaveBeenCalledWith('screen')
      expect(mockRequest).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('handles multiple mode transitions correctly', () => {
      const { workout } = useWorkout()
      const [, app] = withSetup(() => useWorkoutWakeLock())

      workout.value.mode = 'active'
      expect(mockRequest).toHaveBeenCalledTimes(1)

      workout.value.mode = 'builder'
      expect(mockRelease).toHaveBeenCalledTimes(1)

      workout.value.mode = 'active'
      expect(mockRequest).toHaveBeenCalledTimes(2)

      workout.value.mode = 'builder'
      expect(mockRelease).toHaveBeenCalledTimes(2)

      app.unmount()
    })
  })

  describe('cleanup', () => {
    it('releases wake lock when component unmounts with active workout', () => {
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [, app] = withSetup(() => useWorkoutWakeLock())

      expect(mockRequest).toHaveBeenCalledWith('screen')

      app.unmount()

      expect(mockRelease).toHaveBeenCalledTimes(1)
    })

    it('does not release wake lock when component unmounts with builder mode', () => {
      const { workout } = useWorkout()
      expect(workout.value.mode).toBe('builder')

      const [, app] = withSetup(() => useWorkoutWakeLock())

      app.unmount()

      expect(mockRelease).not.toHaveBeenCalled()
    })
  })
})
