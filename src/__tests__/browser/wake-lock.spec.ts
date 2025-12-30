import { afterEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useScreenWakeLock } from '@/composables/useScreenWakeLock'
import { tryCatch } from '@/lib/tryCatch'
import { withSetup } from '../helpers/withSetup'

/**
 * Browser tests for useScreenWakeLock with real browser APIs.
 * Tests verify Wake Lock API and video fallback behavior that jsdom cannot simulate.
 * Note: Each withSetup() call creates a fresh Pinia instance with default settings.
 */
describe('useScreenWakeLock - browser mode', () => {
  let cleanup: (() => void) | null = null

  afterEach(async () => {
    // Call cleanup to unmount app
    cleanup?.()
    cleanup = null
    await nextTick()

    // Clean up any remaining video elements
    // eslint-disable-next-line no-restricted-syntax -- Testing composable that creates raw DOM elements, not rendered components
    document.querySelectorAll('video').forEach((video) => {
      video.pause()
      video.remove()
    })
  })

  describe('native Wake Lock API', () => {
    it('reports wake lock support correctly', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      // In Chromium, Wake Lock API should be supported
      expect(result.isSupported.value).toBe(true)
    })

    it('attempts to request wake lock', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      if (!result.isSupported.value) {
        return
      }

      // In headless mode, may fail due to permissions
      const [error] = await tryCatch(result.acquireNative())
      // Expected: either succeeds (nativeIsActive=true) or fails in headless (nativeIsActive=false)
      const expectedActive = !error
      expect(result.nativeIsActive.value).toBe(expectedActive)
    })

    it('releases wake lock successfully', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      if (!result.isSupported.value) {
        return
      }

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
      cleanup = () => app.unmount()

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
      cleanup = () => app.unmount()

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
      cleanup = () => app.unmount()

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
      cleanup = () => app.unmount()

      result.startVideoFallback()
      result.startVideoFallback()
      result.startVideoFallback()

      // eslint-disable-next-line no-restricted-syntax -- Testing composable that creates raw DOM elements
      const videos = document.querySelectorAll('video')
      expect(videos.length).toBe(1)
    })

    it('video has playsinline attribute for mobile compatibility', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      result.startVideoFallback()

      // eslint-disable-next-line no-restricted-syntax -- Testing composable that creates raw DOM elements
      const videoElement = document.querySelector('video')
      expect(videoElement?.hasAttribute('playsinline')).toBe(true)
    })
  })

  describe('combined controls', () => {
    it('acquireAll activates wake lock', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      await result.acquireAll({ redundant: false })

      // Either native or video should activate
      expect(result.isActive.value).toBe(true)
    })

    it('acquireAll uses redundant mode when requested', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      await result.acquireAll({ redundant: true })

      expect(result.isActive.value).toBe(true)
      expect(result.videoIsActive.value).toBe(true)
    })

    it('releaseAll clears all wake locks', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      await result.acquireAll({ redundant: true })
      expect(result.isActive.value).toBe(true)

      result.releaseAll()

      expect(result.nativeIsActive.value).toBe(false)
      expect(result.videoIsActive.value).toBe(false)
      expect(result.isActive.value).toBe(false)
    })

    it('isActive reflects video being active', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      expect(result.isActive.value).toBe(false)

      result.startVideoFallback()
      expect(result.isActive.value).toBe(true)

      result.stopVideoFallback()
      expect(result.isActive.value).toBe(false)
    })
  })

  describe('PWA detection', () => {
    it('matchMedia works for standalone detection', () => {
      const [, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      const standaloneMedia = window.matchMedia('(display-mode: standalone)')
      expect(standaloneMedia).toBeTruthy()
      expect(typeof standaloneMedia.matches).toBe('boolean')
    })
  })
})
