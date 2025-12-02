import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { useWorkoutWakeLock } from '@/composables/useWorkoutWakeLock'
import { resetWorkout, useWorkout } from '@/composables/useWorkout'
import { withSetup } from '../helpers/withSetup'

// Mock useScreenWakeLock
const mockAcquireAll = vi.fn()
const mockReleaseAll = vi.fn()
const mockIsSupported = ref(true)
const mockIsActive = ref(false)
const mockVideoIsActive = ref(false)

vi.mock('@/composables/useScreenWakeLock', () => ({
  useScreenWakeLock: vi.fn(() => ({
    isSupported: mockIsSupported,
    isActive: mockIsActive,
    videoIsActive: mockVideoIsActive,
    acquireAll: mockAcquireAll,
    releaseAll: mockReleaseAll,
  })),
}))

// Mock visibility
const mockVisibility = ref<DocumentVisibilityState>('hidden')

vi.mock('@vueuse/core', () => ({
  useDocumentVisibility: vi.fn(() => mockVisibility),
}))

// Suppress console.log during tests
vi.spyOn(console, 'log').mockImplementation(() => {})

describe('useWorkoutWakeLock', () => {
  beforeEach(() => {
    resetWorkout()
    mockAcquireAll.mockClear()
    mockReleaseAll.mockClear()
    mockVisibility.value = 'hidden'
    mockIsSupported.value = true
    mockIsActive.value = false
    mockVideoIsActive.value = false
  })

  afterEach(() => {
    resetWorkout()
  })

  describe('initial state', () => {
    it('returns isSupported from screen wake lock', () => {
      const [result, app] = withSetup(() => useWorkoutWakeLock())

      expect(result.isSupported.value).toBe(true)
      app.unmount()
    })

    it('returns isActive from screen wake lock', () => {
      const [result, app] = withSetup(() => useWorkoutWakeLock())

      expect(result.isActive.value).toBe(false)
      app.unmount()
    })

    it('returns usingFallback from screen wake lock videoIsActive', () => {
      mockVideoIsActive.value = true
      const [result, app] = withSetup(() => useWorkoutWakeLock())

      expect(result.usingFallback.value).toBe(true)
      app.unmount()
    })

    it('does not acquire wake lock when workout is in builder mode', () => {
      const { workout } = useWorkout()
      expect(workout.value.mode).toBe('builder')

      const [, app] = withSetup(() => useWorkoutWakeLock())

      expect(mockAcquireAll).not.toHaveBeenCalled()
      app.unmount()
    })
  })

  describe('mode transitions', () => {
    it('acquires wake lock when workout mode changes to active', async () => {
      const { workout } = useWorkout()
      const [, app] = withSetup(() => useWorkoutWakeLock())

      workout.value.mode = 'active'
      await nextTick()

      expect(mockAcquireAll).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('releases wake lock when workout mode changes to builder', async () => {
      const { workout } = useWorkout()
      const [, app] = withSetup(() => useWorkoutWakeLock())

      // Clear mocks after setup (builder mode triggers initial release)
      mockReleaseAll.mockClear()

      workout.value.mode = 'active'
      await nextTick()
      workout.value.mode = 'builder'
      await nextTick()

      expect(mockReleaseAll).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('acquires wake lock immediately if workout starts in active mode', async () => {
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      expect(mockAcquireAll).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('handles multiple mode transitions correctly', async () => {
      const { workout } = useWorkout()
      const [, app] = withSetup(() => useWorkoutWakeLock())

      // Clear mocks after setup (builder mode triggers initial release)
      mockAcquireAll.mockClear()
      mockReleaseAll.mockClear()

      workout.value.mode = 'active'
      await nextTick()
      expect(mockAcquireAll).toHaveBeenCalledTimes(1)

      workout.value.mode = 'builder'
      await nextTick()
      expect(mockReleaseAll).toHaveBeenCalledTimes(1)

      workout.value.mode = 'active'
      await nextTick()
      expect(mockAcquireAll).toHaveBeenCalledTimes(2)

      workout.value.mode = 'builder'
      await nextTick()
      expect(mockReleaseAll).toHaveBeenCalledTimes(2)

      app.unmount()
    })
  })

  describe('cleanup', () => {
    it('releases wake lock when component unmounts with active workout', async () => {
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      expect(mockAcquireAll).toHaveBeenCalled()

      mockReleaseAll.mockClear()
      app.unmount()

      expect(mockReleaseAll).toHaveBeenCalledTimes(1)
    })

    it('calls release on unmount even in builder mode (safe cleanup)', async () => {
      const { workout } = useWorkout()
      expect(workout.value.mode).toBe('builder')

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      // release() called once from initial watch (builder mode triggers release)
      expect(mockReleaseAll).toHaveBeenCalledTimes(1)
      mockReleaseAll.mockClear()

      app.unmount()

      // release() called again on dispose (safe cleanup)
      expect(mockReleaseAll).toHaveBeenCalledTimes(1)
    })
  })

  describe('visibility changes', () => {
    it('releases wake lock when page goes hidden during active workout', async () => {
      mockVisibility.value = 'visible' // Start visible
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      mockReleaseAll.mockClear()

      mockVisibility.value = 'hidden'
      await nextTick()

      expect(mockReleaseAll).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('re-acquires wake lock when page becomes visible during active workout', async () => {
      mockVisibility.value = 'visible' // Start visible
      const { workout } = useWorkout()
      workout.value.mode = 'active'

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      mockAcquireAll.mockClear()

      // Simulate tab going hidden then visible
      mockVisibility.value = 'hidden'
      await nextTick()
      mockVisibility.value = 'visible'
      await nextTick()

      expect(mockAcquireAll).toHaveBeenCalledTimes(1)

      app.unmount()
    })

    it('does not release wake lock when page goes hidden in builder mode', async () => {
      const { workout } = useWorkout()
      expect(workout.value.mode).toBe('builder')

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      mockReleaseAll.mockClear()

      mockVisibility.value = 'hidden'
      await nextTick()

      expect(mockReleaseAll).not.toHaveBeenCalled()

      app.unmount()
    })

    it('does not re-acquire wake lock when page becomes visible in builder mode', async () => {
      const { workout } = useWorkout()
      expect(workout.value.mode).toBe('builder')

      const [, app] = withSetup(() => useWorkoutWakeLock())
      await nextTick()

      mockAcquireAll.mockClear()

      // Simulate tab going hidden then visible
      mockVisibility.value = 'hidden'
      await nextTick()
      mockVisibility.value = 'visible'
      await nextTick()

      expect(mockAcquireAll).not.toHaveBeenCalled()

      app.unmount()
    })
  })
})
