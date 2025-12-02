import type { ComputedRef, Ref } from 'vue'
import { computed, onScopeDispose, ref, watch } from 'vue'
import { useDocumentVisibility, useWakeLock } from '@vueuse/core'

// Minimal silent MP4 video (base64) - loops to keep screen awake on iOS/fallback browsers
const SILENT_VIDEO_BASE64 =
  'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAwBtZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAA3//728P4FNjuZQQAAAu5tb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAAZAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACGHRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAZAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAgAAAAIAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAGQAAAAAAAEAAAAAAZBtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAACgAAAAEAFXEAAAAAAAtaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAAAE7bWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAAA+3N0YmwAAACXc3RzZAAAAAAAAAABAAAAh2F2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAgACAEgAAABIAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY//8AAAAxYXZjQwFkAAr/4QAYZ2QACqzZX4iIhAAAAwAEAAADAFA8SJZYAQAGaOvjyyLAAAAAGHN0dHMAAAAAAAAAAQAAAAEAAAQAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAABRzdHN6AAAAAAAAAsUAAAABAAAAFHN0Y28AAAAAAAAAAQAAADAAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjU3LjgzLjEwMA=='

export type UseScreenWakeLockReturn = {
  // State
  isSupported: ComputedRef<boolean>
  isActive: ComputedRef<boolean>
  nativeIsActive: Ref<boolean>
  videoIsActive: Ref<boolean>

  // Native API controls
  acquireNative: () => Promise<void>
  releaseNative: () => void

  // Video fallback controls
  startVideoFallback: () => void
  stopVideoFallback: () => void

  // Combined controls
  acquireAll: (options?: { redundant?: boolean }) => Promise<void>
  releaseAll: () => void
}

export function useScreenWakeLock(): UseScreenWakeLockReturn {
  // 1. Initializing - external dependencies
  const {
    isSupported: nativeIsSupported,
    isActive: nativeIsActive,
    request,
    release,
    sentinel,
  } = useWakeLock()
  const visibility = useDocumentVisibility()

  // 2. Primary State
  const videoIsActive = ref(false)
  let videoElement: HTMLVideoElement | null = null
  let userHasInteracted = false // Track user gesture for PWA autoplay

  // Mobile detection for redundancy decision
  const isMobileDevice = computed(() => {
    if (typeof navigator === 'undefined') return false
    return navigator.maxTouchPoints > 0
  })

  // PWA standalone mode detection - wake lock is less reliable in installed PWAs
  const isPWAStandalone = computed(() => {
    if (typeof window === 'undefined') return false
    // Check CSS media query for standalone mode (Chrome/Edge/Firefox)
    const isStandaloneMedia = window.matchMedia('(display-mode: standalone)').matches
    // Check Safari-specific standalone property
    const isSafariStandalone =
      'standalone' in window.navigator && window.navigator.standalone === true
    return isStandaloneMedia || isSafariStandalone
  })

  // 3. Computed - derived state
  const isSupported = computed(() => nativeIsSupported.value)
  const isActive = computed(() => nativeIsActive.value || videoIsActive.value)

  // 4. Methods

  // Handle forced release from OS (Android aggressive power management)
  function handleForcedRelease() {
    // Only re-acquire if page is visible - otherwise we'll fail anyway
    if (visibility.value === 'hidden') {
      console.log('[WakeLock] Forced release detected but page hidden, skipping re-acquire')
      return
    }
    // Only re-acquire if user has interacted (for PWA autoplay policies)
    if (!userHasInteracted) {
      console.log('[WakeLock] Forced release detected but no user interaction yet, skipping')
      return
    }
    console.log('[WakeLock] Forced release detected, re-acquiring all...')
    // Use acquireAll to try both native AND video fallback
    acquireAll()
  }

  async function acquireNative(): Promise<void> {
    if (!nativeIsSupported.value) {
      console.log('[WakeLock] Native API not supported')
      return
    }
    try {
      await request('screen')
      console.log('[WakeLock] Native API acquired')
    } catch (err) {
      console.warn('[WakeLock] Native API failed:', err)
      throw err
    }
  }

  function releaseNative(): void {
    release()
    console.log('[WakeLock] Native API released')
  }

  function startVideoFallback(): void {
    if (videoElement) return

    console.log('[WakeLock] Starting video fallback')
    videoElement = document.createElement('video')
    videoElement.setAttribute('playsinline', '')
    videoElement.setAttribute('muted', '')
    videoElement.muted = true
    videoElement.src = SILENT_VIDEO_BASE64
    videoElement.loop = true
    videoElement.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px'
    document.body.appendChild(videoElement)
    const playPromise = videoElement.play()
    // Handle browsers/jsdom where play() may return undefined
    if (playPromise) {
      playPromise.catch((err) => {
        console.warn('[WakeLock] Video fallback play failed:', err)
      })
    }
    videoIsActive.value = true
  }

  function stopVideoFallback(): void {
    if (!videoElement) return

    console.log('[WakeLock] Stopping video fallback')
    videoElement.pause()
    videoElement.remove()
    videoElement = null
    videoIsActive.value = false
  }

  async function acquireAll(options?: { redundant?: boolean }): Promise<void> {
    // Mark that user has interacted - enables re-acquisition after forced release
    userHasInteracted = true

    // Always use redundancy on mobile OR in PWA standalone mode (less reliable there)
    const useRedundancy = options?.redundant ?? (isMobileDevice.value || isPWAStandalone.value)
    console.log('[WakeLock] Acquiring all...', {
      useRedundancy,
      isSupported: nativeIsSupported.value,
      isMobile: isMobileDevice.value,
      isPWA: isPWAStandalone.value,
    })

    let nativeSucceeded = false
    if (nativeIsSupported.value) {
      try {
        await acquireNative()
        nativeSucceeded = true
      } catch {
        // Native failed, will use fallback
        console.log('[WakeLock] Native failed, falling back to video')
      }
    }

    // On mobile/PWA, ALWAYS start video as backup (native API unreliable in PWA mode)
    // On desktop browser, only start if native failed
    if (useRedundancy || !nativeSucceeded) {
      startVideoFallback()
    }
  }

  function releaseAll(): void {
    console.log('[WakeLock] Releasing all...')
    releaseNative()
    stopVideoFallback()
  }

  // 5. Watchers

  // Listen for forced release events on sentinel (Android power management)
  watch(sentinel, (newSentinel, oldSentinel) => {
    if (oldSentinel) {
      oldSentinel.removeEventListener('release', handleForcedRelease)
    }
    if (newSentinel && !newSentinel.released) {
      newSentinel.addEventListener('release', handleForcedRelease)
    }
  })

  // 6. Cleanup
  onScopeDispose(() => {
    if (sentinel.value) {
      sentinel.value.removeEventListener('release', handleForcedRelease)
    }
    releaseAll()
  })

  return {
    isSupported,
    isActive,
    nativeIsActive,
    videoIsActive,
    acquireNative,
    releaseNative,
    startVideoFallback,
    stopVideoFallback,
    acquireAll,
    releaseAll,
  }
}
