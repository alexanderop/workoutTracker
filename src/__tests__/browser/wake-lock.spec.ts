import { afterEach, describe, expect, it, vi } from 'vitest'
import type { WakeLockSentinel } from '@vueuse/core'
import { nextTick } from 'vue'
import { useScreenWakeLock } from '@/composables/useScreenWakeLock'
import { tryCatch } from '@/lib/tryCatch'
import { withSetup } from '../helpers/withSetup'

class TestWakeLockSentinel extends EventTarget implements WakeLockSentinel {
  readonly type = 'screen'
  released = false

  constructor(readonly release: () => Promise<void>) {
    super()
  }
}

function restoreProperty(
  target: object,
  key: PropertyKey,
  descriptor: PropertyDescriptor | undefined,
): void {
  if (descriptor) {
    Object.defineProperty(target, key, descriptor)
    return
  }
  Reflect.deleteProperty(target, key)
}

function getBrowserWindow(): Window {
  const browserWindow = document.defaultView
  if (!browserWindow) throw new Error('Expected a browser window')
  return browserWindow
}

/**
 * Browser tests for useScreenWakeLock with real browser APIs.
 * Tests verify Wake Lock API and video fallback behavior that jsdom cannot simulate.
 * Note: Each withSetup() call creates a fresh Pinia instance with default settings.
 */
describe('useScreenWakeLock - browser mode', () => {
  const context: { cleanup: (() => void) | null } = { cleanup: null }

  afterEach(async () => {
    // Call cleanup to unmount app
    context.cleanup?.()
    context.cleanup = null
    await nextTick()

    // Clean up any remaining video elements
    // eslint-disable-next-line no-restricted-syntax -- Testing composable that creates raw DOM elements, not rendered components
    for (const video of document.querySelectorAll('video')) {
      video.pause()
      video.remove()
    }
  })

  describe('native Wake Lock API', () => {
    it('reports wake lock support correctly', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      // In Chromium, Wake Lock API should be supported
      expect(result.isSupported.value).toBe(true)
    })

    it('attempts to request wake lock', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      expect(result.isSupported.value).toBe(true)

      // In headless mode, may fail due to permissions
      const [error] = await tryCatch(result.acquireNative())
      // Expected: either succeeds (nativeIsActive=true) or fails in headless (nativeIsActive=false)
      const isExpectedActive = !error
      expect(result.nativeIsActive.value).toBe(isExpectedActive)
    })

    it('releases wake lock successfully', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      expect(result.isSupported.value).toBe(true)

      // Try to acquire, but may fail in headless mode (expected behavior)
      await tryCatch(result.acquireNative())

      // Release should work regardless
      result.releaseNative()
      expect(result.nativeIsActive.value).toBe(false)
    })
  })

  describe('video fallback', () => {
    it('creates silent video element', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      result.startVideoFallback()

      // eslint-disable-next-line no-restricted-syntax -- Testing composable that creates raw DOM elements
      const videoElement = document.querySelector('video')
      expect(videoElement).toBeTruthy()
      expect(videoElement?.muted).toBe(true)
      expect(videoElement?.loop).toBe(true)
      expect(result.videoIsActive.value).toBe(true)
    })

    it('positions video element off-screen', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      result.startVideoFallback()

      // eslint-disable-next-line no-restricted-syntax -- Testing composable that creates raw DOM elements
      const videoElement = document.querySelector('video')
      expect(videoElement).toBeTruthy()

      const style = videoElement?.style
      expect(style?.position).toBe('fixed')
      expect(style?.width).toBe('1px')
      expect(style?.height).toBe('1px')
    })

    it('removes video element on stop', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      result.startVideoFallback()
      // eslint-disable-next-line no-restricted-syntax -- Testing composable that creates raw DOM elements
      expect(document.querySelector('video')).toBeTruthy()

      result.stopVideoFallback()
      // eslint-disable-next-line no-restricted-syntax -- Testing composable that creates raw DOM elements
      expect(document.querySelector('video')).toBeNull()
      expect(result.videoIsActive.value).toBe(false)
    })

    it('does not create duplicate videos on multiple starts', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      result.startVideoFallback()
      result.startVideoFallback()
      result.startVideoFallback()

      // eslint-disable-next-line no-restricted-syntax -- Testing composable that creates raw DOM elements
      const videos = document.querySelectorAll('video')
      expect(videos).toHaveLength(1)
    })

    it('video has playsinline attribute for mobile compatibility', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      result.startVideoFallback()

      // eslint-disable-next-line no-restricted-syntax -- Testing composable that creates raw DOM elements
      const videoElement = document.querySelector('video')
      expect(videoElement?.hasAttribute('playsinline')).toBe(true)
    })
  })

  describe('combined controls', () => {
    it('acquireAll activates wake lock', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      await result.acquireAll({ redundant: false })

      // Either native or video should activate
      expect(result.isActive.value).toBe(true)
    })

    it('acquireAll uses redundant mode when requested', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      await result.acquireAll({ redundant: true })

      expect(result.isActive.value).toBe(true)
      expect(result.videoIsActive.value).toBe(true)
    })

    it('releaseAll clears all wake locks', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      await result.acquireAll({ redundant: true })
      expect(result.isActive.value).toBe(true)

      result.releaseAll()

      expect(result.nativeIsActive.value).toBe(false)
      expect(result.videoIsActive.value).toBe(false)
      expect(result.isActive.value).toBe(false)
    })

    it('isActive reflects video being active', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      expect(result.isActive.value).toBe(false)

      result.startVideoFallback()
      expect(result.isActive.value).toBe(true)

      result.stopVideoFallback()
      expect(result.isActive.value).toBe(false)
    })

    it('does not recreate a fallback when acquisition settles after unmount', async () => {
      const release = vi.fn(async () => {})
      const sentinel = new TestWakeLockSentinel(release)
      const pendingRequest = Promise.withResolvers<WakeLockSentinel>()
      const originalWakeLock = Object.getOwnPropertyDescriptor(globalThis.navigator, 'wakeLock')
      Object.defineProperty(globalThis.navigator, 'wakeLock', {
        configurable: true,
        value: {
          request: () => pendingRequest.promise,
        },
      })
      try {
        const [result, app] = withSetup(() =>
          useScreenWakeLock({
            window: getBrowserWindow(),
            document,
            navigator: globalThis.navigator,
          }),
        )

        const acquisition = result.acquireAll({ redundant: true })
        app.unmount()
        pendingRequest.resolve(sentinel)
        await acquisition

        // eslint-disable-next-line no-restricted-syntax -- Verifying the raw DOM fallback is absent after teardown
        expect(document.querySelector('video')).toBeNull()
        expect(result.isActive.value).toBe(false)
        expect(release).toHaveBeenCalledOnce()
      } finally {
        restoreProperty(globalThis.navigator, 'wakeLock', originalWakeLock)
      }
    })
  })

  describe('PWA detection', () => {
    it('matchMedia works for standalone detection', () => {
      const [, app] = withSetup(() => useScreenWakeLock())
      context.cleanup = () => app.unmount()

      const standaloneMedia = globalThis.matchMedia('(display-mode: standalone)')
      expect(standaloneMedia).toBeTruthy()
      expect(typeof standaloneMedia.matches).toBe('boolean')
    })
  })
})
