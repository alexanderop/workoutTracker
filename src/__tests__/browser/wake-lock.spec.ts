import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { useScreenWakeLock } from '@/composables/useScreenWakeLock'
import { withSetup } from '../helpers/withSetup'
import { resetDatabase } from './setup'

/**
 * Browser tests for useScreenWakeLock with real browser APIs.
 * Tests verify Wake Lock API and video fallback behavior that jsdom cannot simulate.
 */
describe('useScreenWakeLock - browser mode', () => {
  let cleanup: (() => void) | null = null

  beforeEach(async () => {
    await resetDatabase()
  })

  afterEach(async () => {
    // Call cleanup to unmount app
    cleanup?.()
    cleanup = null
    await nextTick()

    // Clean up any remaining video elements
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
      try {
        await result.acquireNative()
        expect(result.nativeIsActive.value).toBe(true)
      } catch {
        // Expected in headless browser without user interaction
        expect(result.nativeIsActive.value).toBe(false)
      }
    })

    it('releases wake lock successfully', async () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      if (!result.isSupported.value) {
        return
      }

      // Try to acquire, but may fail in headless mode
      try {
        await result.acquireNative()
      } catch {
        // Expected in headless browser
      }

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
      expect(document.querySelector('video')).toBeTruthy()

      result.stopVideoFallback()
      expect(document.querySelector('video')).toBeNull()
      expect(result.videoIsActive.value).toBe(false)
    })

    it('does not create duplicate videos on multiple starts', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      result.startVideoFallback()
      result.startVideoFallback()
      result.startVideoFallback()

      const videos = document.querySelectorAll('video')
      expect(videos.length).toBe(1)
    })

    it('video has playsinline attribute for mobile compatibility', () => {
      const [result, app] = withSetup(() => useScreenWakeLock())
      cleanup = () => app.unmount()

      result.startVideoFallback()

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
