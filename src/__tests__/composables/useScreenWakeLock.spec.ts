import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref, shallowRef } from 'vue'
import { useScreenWakeLock } from '@/composables/useScreenWakeLock'
import { withSetup } from '../helpers/withSetup'

// Create a mock sentinel factory that satisfies the WakeLockSentinel interface
function createMockSentinel() {
  return {
    released: false,
    type: 'screen' as const,
    release: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(() => true),
    onrelease: null,
  }
}

// Mock @vueuse/core's useWakeLock
const mockRequest = vi.fn()
const mockRelease = vi.fn()
const mockIsSupported = ref(true)
const mockIsActive = ref(false)
const mockSentinel = shallowRef<WakeLockSentinel | null>(null)
const mockVisibility = ref<DocumentVisibilityState>('visible')

vi.mock('@vueuse/core', () => ({
  useWakeLock: vi.fn(() => ({
    isSupported: mockIsSupported,
    isActive: mockIsActive,
    request: mockRequest,
    release: mockRelease,
    sentinel: mockSentinel,
  })),
  useDocumentVisibility: vi.fn(() => mockVisibility),
}))

// Suppress console.log/warn during tests
vi.spyOn(console, 'log').mockImplementation(() => {})
vi.spyOn(console, 'warn').mockImplementation(() => {})

// Mock window.matchMedia for PWA standalone detection
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false, // Not in PWA standalone mode by default
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

describe('useScreenWakeLock', () => {
  beforeEach(() => {
    mockRequest.mockClear().mockResolvedValue(undefined)
    mockRelease.mockClear()
    mockIsSupported.value = true
    mockIsActive.value = false
    mockSentinel.value = null
    mockVisibility.value = 'visible'
    // Clean up any video elements from previous tests
    document.querySelectorAll('video').forEach((el) => el.remove())
  })

  afterEach(() => {
    document.querySelectorAll('video').forEach((el) => el.remove())
  })

  describe('native API', () => {
    it('acquires wake lock when supported', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      await result.acquireNative()

      expect(mockRequest).toHaveBeenCalledWith('screen')
      app.unmount()
    })

    it('does not call request when not supported', async () => {
      mockIsSupported.value = false
      const [result, app] = withSetup(() => useScreenWakeLock())

      await result.acquireNative()

      expect(mockRequest).not.toHaveBeenCalled()
      app.unmount()
    })

    it('releases wake lock', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      result.releaseNative()

      expect(mockRelease).toHaveBeenCalled()
      app.unmount()
    })

    it('throws when native API fails', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Permission denied'))
      const [result, app] = withSetup(() => useScreenWakeLock())

      await expect(result.acquireNative()).rejects.toThrow('Permission denied')
      app.unmount()
    })

    it('re-acquires when sentinel fires release event after user interaction', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      // First acquire to set userHasInteracted = true
      await result.acquireAll({ redundant: false })

      // Simulate acquiring and getting a sentinel
      const mockSentinelObj = createMockSentinel()
      mockSentinel.value = mockSentinelObj
      await nextTick()

      // Get the handler that was registered
      const releaseHandler = mockSentinelObj.addEventListener.mock.calls.find(
        (call) => call[0] === 'release',
      )?.[1]

      expect(releaseHandler).toBeDefined()

      // Simulate forced release
      mockRequest.mockClear()
      releaseHandler()

      // Should re-acquire since user has interacted and page is visible
      expect(mockRequest).toHaveBeenCalledWith('screen')
      app.unmount()
    })

    it('does not re-acquire on release if user has not interacted', async () => {
      const [, app] = withSetup(() => useScreenWakeLock())

      // Simulate getting a sentinel WITHOUT calling acquireAll first
      const mockSentinelObj = createMockSentinel()
      mockSentinel.value = mockSentinelObj
      await nextTick()

      // Get the handler that was registered
      const releaseHandler = mockSentinelObj.addEventListener.mock.calls.find(
        (call) => call[0] === 'release',
      )?.[1]

      expect(releaseHandler).toBeDefined()

      // Simulate forced release
      mockRequest.mockClear()
      releaseHandler()

      // Should NOT re-acquire since userHasInteracted is still false
      expect(mockRequest).not.toHaveBeenCalled()
      app.unmount()
    })

    it('does not re-acquire on release when page is hidden', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      // First acquire to set userHasInteracted = true
      await result.acquireAll({ redundant: false })

      // Simulate getting a sentinel
      const mockSentinelObj = createMockSentinel()
      mockSentinel.value = mockSentinelObj
      await nextTick()

      // Get the handler that was registered
      const releaseHandler = mockSentinelObj.addEventListener.mock.calls.find(
        (call) => call[0] === 'release',
      )?.[1]

      // Simulate page becoming hidden
      mockVisibility.value = 'hidden'

      // Simulate forced release
      mockRequest.mockClear()
      releaseHandler()

      // Should NOT re-acquire since page is hidden
      expect(mockRequest).not.toHaveBeenCalled()
      app.unmount()
    })

    it('removes event listener from old sentinel when new one is set', async () => {
      const [, app] = withSetup(() => useScreenWakeLock())

      const oldSentinel = createMockSentinel()
      mockSentinel.value = oldSentinel
      await nextTick()

      const newSentinel = createMockSentinel()
      mockSentinel.value = newSentinel
      await nextTick()

      expect(oldSentinel.removeEventListener).toHaveBeenCalledWith('release', expect.any(Function))
      expect(newSentinel.addEventListener).toHaveBeenCalledWith('release', expect.any(Function))
      app.unmount()
    })
  })

  describe('video fallback', () => {
    it('starts video element when called', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      result.startVideoFallback()

      expect(result.videoIsActive.value).toBe(true)
      expect(document.querySelector('video')).toBeTruthy()
      app.unmount()
    })

    it('video element has correct attributes', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      result.startVideoFallback()

      const video = document.querySelector('video')
      expect(video?.hasAttribute('playsinline')).toBe(true)
      expect(video?.hasAttribute('muted')).toBe(true)
      expect(video?.loop).toBe(true)
      expect(video?.muted).toBe(true)
      app.unmount()
    })

    it('video element is hidden off-screen', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      result.startVideoFallback()

      const video = document.querySelector('video')
      expect(video?.style.position).toBe('fixed')
      expect(video?.style.top).toBe('-9999px')
      expect(video?.style.left).toBe('-9999px')
      app.unmount()
    })

    it('stops and removes video element when called', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      result.startVideoFallback()
      result.stopVideoFallback()

      expect(result.videoIsActive.value).toBe(false)
      expect(document.querySelector('video')).toBeFalsy()
      app.unmount()
    })

    it('does not create duplicate video elements', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      result.startVideoFallback()
      result.startVideoFallback()

      expect(document.querySelectorAll('video').length).toBe(1)
      app.unmount()
    })

    it('cleans up video on scope dispose', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      result.startVideoFallback()
      expect(document.querySelector('video')).toBeTruthy()

      app.unmount()

      expect(document.querySelector('video')).toBeFalsy()
    })
  })

  describe('combined controls', () => {
    it('acquires both native and video with redundant option', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      await result.acquireAll({ redundant: true })

      expect(mockRequest).toHaveBeenCalledWith('screen')
      expect(result.videoIsActive.value).toBe(true)
      app.unmount()
    })

    it('acquires only native when redundant is false and native succeeds', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      await result.acquireAll({ redundant: false })

      expect(mockRequest).toHaveBeenCalledWith('screen')
      expect(result.videoIsActive.value).toBe(false)
      app.unmount()
    })

    it('falls back to video when native fails on non-redundant mode', async () => {
      mockRequest.mockRejectedValueOnce(new Error('Failed'))

      const [result, app] = withSetup(() => useScreenWakeLock())

      await result.acquireAll({ redundant: false })

      expect(result.videoIsActive.value).toBe(true)
      app.unmount()
    })

    it('uses video only when native not supported on non-redundant mode', async () => {
      mockIsSupported.value = false

      const [result, app] = withSetup(() => useScreenWakeLock())

      await result.acquireAll({ redundant: false })

      expect(mockRequest).not.toHaveBeenCalled()
      expect(result.videoIsActive.value).toBe(true)
      app.unmount()
    })

    it('releases all active mechanisms', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      await result.acquireAll({ redundant: true })
      result.releaseAll()

      expect(mockRelease).toHaveBeenCalled()
      expect(result.videoIsActive.value).toBe(false)
      app.unmount()
    })
  })

  describe('state', () => {
    it('isActive reflects native OR video active', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      expect(result.isActive.value).toBe(false)

      result.startVideoFallback()
      expect(result.isActive.value).toBe(true)

      result.stopVideoFallback()
      expect(result.isActive.value).toBe(false)

      mockIsActive.value = true
      expect(result.isActive.value).toBe(true)

      app.unmount()
    })

    it('exposes nativeIsActive from VueUse', () => {
      mockIsActive.value = true
      const [result, app] = withSetup(() => useScreenWakeLock())

      expect(result.nativeIsActive.value).toBe(true)
      app.unmount()
    })

    it('exposes isSupported from VueUse', () => {
      mockIsSupported.value = false
      const [result, app] = withSetup(() => useScreenWakeLock())

      expect(result.isSupported.value).toBe(false)
      app.unmount()
    })
  })

  describe('cleanup', () => {
    it('removes sentinel listener on dispose', () => {
      const mockSentinelObj = createMockSentinel()
      mockSentinel.value = mockSentinelObj

      const [, app] = withSetup(() => useScreenWakeLock())

      app.unmount()

      expect(mockSentinelObj.removeEventListener).toHaveBeenCalledWith(
        'release',
        expect.any(Function),
      )
    })

    it('releases all on dispose', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())

      await result.acquireAll({ redundant: true })
      mockRelease.mockClear()

      app.unmount()

      expect(mockRelease).toHaveBeenCalled()
      expect(document.querySelector('video')).toBeFalsy()
    })
  })
})
