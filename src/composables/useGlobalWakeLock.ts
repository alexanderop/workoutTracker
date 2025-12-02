import { watch, onScopeDispose } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'
import { useSettingsStore } from '@/stores/settings'
import { useScreenWakeLock } from './useScreenWakeLock'

// Check for browser environment
const isBrowser = typeof document !== 'undefined'

/**
 * Global wake lock composable that respects user settings.
 * Keeps screen awake when enabled and page is visible.
 * Call this once at the app root level (App.vue).
 */
export function useGlobalWakeLock() {
  const settingsStore = useSettingsStore()
  const visibility = useDocumentVisibility()
  const wakeLock = useScreenWakeLock()

  // Track if we should be holding a wake lock
  let shouldBeActive = false

  function updateWakeLock() {
    // Skip in non-browser environments (SSR, tests)
    if (!isBrowser) return

    const enabled = settingsStore.screenWakeLock
    const visible = visibility.value === 'visible'
    const settingsLoaded = settingsStore.isLoaded

    // Wait for settings to load before making decisions
    if (!settingsLoaded) return

    const shouldActivate = enabled && visible

    if (shouldActivate && !shouldBeActive) {
      console.log('[GlobalWakeLock] Acquiring wake lock...')
      wakeLock.acquireAll()
      shouldBeActive = true
      return
    }

    if (!shouldActivate && shouldBeActive) {
      console.log('[GlobalWakeLock] Releasing wake lock...')
      wakeLock.releaseAll()
      shouldBeActive = false
    }
  }

  // Watch settings changes
  watch(
    () => settingsStore.screenWakeLock,
    () => updateWakeLock(),
  )

  // Watch settings loaded state
  watch(
    () => settingsStore.isLoaded,
    () => updateWakeLock(),
    { immediate: true },
  )

  // Watch visibility changes
  watch(visibility, (state, prevState) => {
    if (!isBrowser) return
    if (!settingsStore.isLoaded || !settingsStore.screenWakeLock) return

    if (state === 'hidden') {
      console.log('[GlobalWakeLock] Page hidden, releasing to save battery...')
      wakeLock.releaseAll()
      shouldBeActive = false
      return
    }

    if (state === 'visible' && prevState === 'hidden') {
      console.log('[GlobalWakeLock] Page visible, re-acquiring...')
      wakeLock.acquireAll()
      shouldBeActive = true
    }
  })

  onScopeDispose(() => {
    wakeLock.releaseAll()
    shouldBeActive = false
  })

  return {
    isSupported: wakeLock.isSupported,
    isActive: wakeLock.isActive,
  }
}
