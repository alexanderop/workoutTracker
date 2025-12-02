import { ref, watch, onScopeDispose } from 'vue'
import { useWakeLock, useDocumentVisibility } from '@vueuse/core'
import { useWorkout } from './useWorkout'

// Minimal silent MP4 video (base64) - used as fallback for browsers without Wake Lock API
// This is a 1-second silent video that loops to keep the screen awake
const SILENT_VIDEO_BASE64 =
  'data:video/mp4;base64,AAAAIGZ0eXBpc29tAAACAGlzb21pc28yYXZjMW1wNDEAAAAIZnJlZQAAAwBtZGF0AAACrQYF//+p3EXpvebZSLeWLNgg2SPu73gyNjQgLSBjb3JlIDE1MiByMjg1NCBlOWE1OTAzIC0gSC4yNjQvTVBFRy00IEFWQyBjb2RlYyAtIENvcHlsZWZ0IDIwMDMtMjAxNyAtIGh0dHA6Ly93d3cudmlkZW9sYW4ub3JnL3gyNjQuaHRtbCAtIG9wdGlvbnM6IGNhYmFjPTEgcmVmPTMgZGVibG9jaz0xOjA6MCBhbmFseXNlPTB4MzoweDExMyBtZT1oZXggc3VibWU9NyBwc3k9MSBwc3lfcmQ9MS4wMDowLjAwIG1peGVkX3JlZj0xIG1lX3JhbmdlPTE2IGNocm9tYV9tZT0xIHRyZWxsaXM9MSA4eDhkY3Q9MSBjcW09MCBkZWFkem9uZT0yMSwxMSBmYXN0X3Bza2lwPTEgY2hyb21hX3FwX29mZnNldD0tMiB0aHJlYWRzPTMgbG9va2FoZWFkX3RocmVhZHM9MSBzbGljZWRfdGhyZWFkcz0wIG5yPTAgZGVjaW1hdGU9MSBpbnRlcmxhY2VkPTAgYmx1cmF5X2NvbXBhdD0wIGNvbnN0cmFpbmVkX2ludHJhPTAgYmZyYW1lcz0zIGJfcHlyYW1pZD0yIGJfYWRhcHQ9MSBiX2JpYXM9MCBkaXJlY3Q9MSB3ZWlnaHRiPTEgb3Blbl9nb3A9MCB3ZWlnaHRwPTIga2V5aW50PTI1MCBrZXlpbnRfbWluPTI1IHNjZW5lY3V0PTQwIGludHJhX3JlZnJlc2g9MCByY19sb29rYWhlYWQ9NDAgcmM9Y3JmIG1idHJlZT0xIGNyZj0yMy4wIHFjb21wPTAuNjAgcXBtaW49MCBxcG1heD02OSBxcHN0ZXA9NCBpcF9yYXRpbz0xLjQwIGFxPTE6MS4wMACAAAAAD2WIhAA3//728P4FNjuZQQAAAu5tb292AAAAbG12aGQAAAAAAAAAAAAAAAAAAAPoAAAAZAABAAABAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACAAACGHRyYWsAAABcdGtoZAAAAAMAAAAAAAAAAAAAAAEAAAAAAAAAZAAAAAAAAAAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAEAAAAAAAAAAAAAAAAAAEAAAAAAAgAAAAIAAAAAACRlZHRzAAAAHGVsc3QAAAAAAAAAAQAAAGQAAAAAAAEAAAAAAZBtZGlhAAAAIG1kaGQAAAAAAAAAAAAAAAAAACgAAAAEAFXEAAAAAAAtaGRscgAAAAAAAAAAdmlkZQAAAAAAAAAAAAAAAFZpZGVvSGFuZGxlcgAAAAE7bWluZgAAABR2bWhkAAAAAQAAAAAAAAAAAAAAJGRpbmYAAAAcZHJlZgAAAAAAAAABAAAADHVybCAAAAABAAAA+3N0YmwAAACXc3RzZAAAAAAAAAABAAAAh2F2YzEAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAAAAAgACAEgAAABIAAAAAAAAAAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAY//8AAAAxYXZjQwFkAAr/4QAYZ2QACqzZX4iIhAAAAwAEAAADAFA8SJZYAQAGaOvjyyLAAAAAGHN0dHMAAAAAAAAAAQAAAAEAAAQAAAAAHHN0c2MAAAAAAAAAAQAAAAEAAAABAAAAAQAAABRzdHN6AAAAAAAAAsUAAAABAAAAFHN0Y28AAAAAAAAAAQAAADAAAABidWR0YQAAAFptZXRhAAAAAAAAACFoZGxyAAAAAAAAAABtZGlyYXBwbAAAAAAAAAAAAAAAAC1pbHN0AAAAJal0b28AAAAdZGF0YQAAAAEAAAAATGF2ZjU3LjgzLjEwMA=='

export function useWorkoutWakeLock() {
  const { workout } = useWorkout()
  const { isSupported, isActive, request, release } = useWakeLock()
  const visibility = useDocumentVisibility()

  const usingFallback = ref(false)
  let videoElement: HTMLVideoElement | null = null

  // Video fallback for iOS Safari and browsers where native API fails
  function startVideoFallback() {
    if (videoElement) return

    console.log('[WakeLock] Starting video fallback')
    videoElement = document.createElement('video')
    videoElement.setAttribute('playsinline', '')
    videoElement.setAttribute('muted', '')
    videoElement.muted = true
    videoElement.src = SILENT_VIDEO_BASE64
    videoElement.loop = true
    videoElement.style.position = 'fixed'
    videoElement.style.top = '-9999px'
    videoElement.style.left = '-9999px'
    videoElement.style.width = '1px'
    videoElement.style.height = '1px'
    document.body.appendChild(videoElement)
    const playPromise = videoElement.play()
    if (playPromise !== undefined) {
      playPromise.catch((err) => console.warn('[WakeLock] Video fallback play failed:', err))
    }
    usingFallback.value = true
  }

  function stopVideoFallback() {
    if (!videoElement) return

    console.log('[WakeLock] Stopping video fallback')
    videoElement.pause()
    videoElement.remove()
    videoElement = null
    usingFallback.value = false
  }

  async function acquireWakeLock() {
    console.log('[WakeLock] Acquiring...', { isSupported: isSupported.value })

    // Try native Wake Lock API first
    if (isSupported.value) {
      try {
        await request('screen')
        console.log('[WakeLock] Native API acquired successfully')
        return
      } catch (err) {
        console.warn('[WakeLock] Native API failed:', err)
      }
    }

    // Fallback to video method
    startVideoFallback()
  }

  function releaseWakeLock() {
    console.log('[WakeLock] Releasing...')
    release()
    stopVideoFallback()
  }

  // Request/release based on workout mode
  watch(
    () => workout.value.mode,
    (mode) => {
      if (mode === 'active') {
        acquireWakeLock()
        return
      }
      releaseWakeLock()
    },
    { immediate: true },
  )

  // Re-acquire when page becomes visible (browser releases lock on tab switch)
  watch(visibility, (state) => {
    if (state === 'visible' && workout.value.mode === 'active') {
      console.log('[WakeLock] Page visible, re-acquiring...')
      acquireWakeLock()
    }
  })

  onScopeDispose(() => releaseWakeLock())

  return { isSupported, isActive, usingFallback }
}
