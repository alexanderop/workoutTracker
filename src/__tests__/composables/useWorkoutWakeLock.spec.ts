import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useWorkoutWakeLock } from '@/composables/useWorkoutWakeLock'
import { resetWorkout, useWorkout } from '@/composables/useWorkout'
import { withSetup } from '../helpers/withSetup'

// Mock @vueuse/core's useWakeLock and useDocumentVisibility
const mockRequest = vi.fn()
const mockRelease = vi.fn()
const mockIsSupported = ref(true)
const mockIsActive = ref(false)
const mockVisibility = ref<DocumentVisibilityState>('hidden')

vi.mock('@vueuse/core', () => ({
  useWakeLock: vi.fn(() => ({
    isSupported: mockIsSupported,
    isActive: mockIsActive,
    request: mockRequest,
    release: mockRelease,
  })),
  useDocumentVisibility: vi.fn(() => mockVisibility),
}))

// Suppress console.log/warn during tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})

describe('useWorkoutWakeLock', () => {
  beforeEach(() => {
    resetWorkout()
    mockRequest.mockClear().mockResolvedValue(undefined)
    mockRelease.mockClear()
    mockVisibility.value = 'hidden'
    mockIsSupported.value = true
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
    it('requests wake lock when workout mode changes to active', async () => {
      const { workout } = useWorkout()
      const [, app] = withSetup(() => useWorkoutWakeLock())

      workout.value.mode = 'active'
      await nextTick()

      expect(mockRequest).toHaveBeenCalledWith('screen')
      expect(mockRequest).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('releases wake lock when workout mode changes to builder', async () => {
      const { workout } = useWorkout()
      const [, app] = withSetup(() => useWorkoutWakeLock())

      // Clear mocks after setup (builder mode triggers initial release)
      mockRelease.mockClear()

      workout.value.mode = 'active'
      await nextTick()
      workout.value.mode = 'builder'
      await nextTick()

      expect(mockRelease).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('requests wake lock immediately if workout starts in active mode', async () => {
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      expect(mockRequest).toHaveBeenCalledWith('screen')
      expect(mockRequest).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('handles multiple mode transitions correctly', async () => {
      const { workout } = useWorkout()
      const [, app] = withSetup(() => useWorkoutWakeLock())

      // Clear mocks after setup (builder mode triggers initial release)
      mockRequest.mockClear()
      mockRelease.mockClear()

      workout.value.mode = 'active'
      await nextTick()
      expect(mockRequest).toHaveBeenCalledTimes(1)

      workout.value.mode = 'builder'
      await nextTick()
      expect(mockRelease).toHaveBeenCalledTimes(1)

      workout.value.mode = 'active'
      await nextTick()
      expect(mockRequest).toHaveBeenCalledTimes(2)

      workout.value.mode = 'builder'
      await nextTick()
      expect(mockRelease).toHaveBeenCalledTimes(2)

      app.unmount()
    })
  })

  describe('cleanup', () => {
    it('releases wake lock when component unmounts with active workout', async () => {
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      expect(mockRequest).toHaveBeenCalledWith('screen')

      app.unmount()

      expect(mockRelease).toHaveBeenCalledTimes(1)
    })

    it('calls release on unmount even in builder mode (no-op but safe)', async () => {
      const { workout } = useWorkout()
      expect(workout.value.mode).toBe('builder')

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      // release() called once from initial watch (builder mode triggers release)
      expect(mockRelease).toHaveBeenCalledTimes(1)
      mockRelease.mockClear()

      app.unmount()

      // release() called again on dispose (safe no-op)
      expect(mockRelease).toHaveBeenCalledTimes(1)
    })
  })

  describe('visibility changes', () => {
    it('re-requests wake lock when page becomes visible during active workout', async () => {
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      expect(mockRequest).toHaveBeenCalledTimes(1)
      mockRequest.mockClear()

      // Simulate tab going hidden then visible
      mockVisibility.value = 'hidden'
      mockVisibility.value = 'visible'
      await nextTick()

      expect(mockRequest).toHaveBeenCalledWith('screen')
      expect(mockRequest).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('does not re-request wake lock when page becomes visible in builder mode', async () => {
      const { workout } = useWorkout()
      expect(workout.value.mode).toBe('builder')

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      mockRequest.mockClear()

      // Simulate tab going hidden then visible
      mockVisibility.value = 'hidden'
      mockVisibility.value = 'visible'
      await nextTick()

      expect(mockRequest).not.toHaveBeenCalled()

      app.unmount()
    })
  })

  describe('fallback behavior', () => {
    it('uses video fallback when native API is not supported', async () => {
      mockIsSupported.value = false
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [result, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      // Native request should not be called
      expect(mockRequest).not.toHaveBeenCalled()
      // Fallback should be active
      expect(result.usingFallback.value).toBe(true)

      app.unmount()
    })

    it('uses video fallback when native API request fails', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Permission denied'))
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [result, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      // Native request was attempted
      expect(mockRequest).toHaveBeenCalledWith('screen')
      // Fallback should be active after failure
      expect(result.usingFallback.value).toBe(true)

      app.unmount()
    })

    it('returns usingFallback ref', () => {
      const [result, app] = withSetup(() => useWorkoutWakeLock())

      expect(result.usingFallback).toBeDefined()
      expect(result.usingFallback.value).toBe(false)

      app.unmount()
    })
  })
})
