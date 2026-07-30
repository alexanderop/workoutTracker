import type { ComputedRef } from 'vue'
import { watch } from 'vue'
import { defaultDocument, tryOnScopeDispose, useDocumentVisibility } from '@vueuse/core'
import { useSettingsStore } from '@/stores/settings'
import { useScreenWakeLock, type UseScreenWakeLockOptions } from './useScreenWakeLock'

export type UseGlobalWakeLockReturn = {
  isSupported: ComputedRef<boolean>
  isActive: ComputedRef<boolean>
}

export type UseGlobalWakeLockOptions = UseScreenWakeLockOptions

/**
 * Global wake lock composable that respects user settings.
 * Keeps screen awake when enabled and page is visible.
 * Call this once at the app root level (App.vue).
 */
export function useGlobalWakeLock(options: UseGlobalWakeLockOptions = {}): UseGlobalWakeLockReturn {
  const document = options.document ?? options.window?.document ?? defaultDocument
  const settingsStore = useSettingsStore()
  const visibility = useDocumentVisibility({ document })
  const wakeLock = useScreenWakeLock(options)

  // Track if we should be holding a wake lock
  let shouldBeActive = false

  function updateWakeLock() {
    if (!document) return

    const enabled = settingsStore.screenWakeLock
    const isVisible = visibility.value === 'visible'
    const settingsLoaded = settingsStore.isLoaded

    // Wait for settings to load before making decisions
    if (!settingsLoaded) return

    const shouldActivate = enabled && isVisible

    if (shouldActivate && !shouldBeActive) {
      void wakeLock.acquireAll()
      shouldBeActive = true
      return
    }

    if (!shouldActivate && shouldBeActive) {
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
  watch(visibility, (state, previousState) => {
    if (!document) return
    if (!settingsStore.isLoaded || !settingsStore.screenWakeLock) return

    if (state === 'hidden') {
      wakeLock.releaseAll()
      shouldBeActive = false
      return
    }

    if (state === 'visible' && previousState === 'hidden') {
      void wakeLock.acquireAll()
      shouldBeActive = true
    }
  })

  tryOnScopeDispose(() => {
    wakeLock.releaseAll()
    shouldBeActive = false
  })

  return {
    isSupported: wakeLock.isSupported,
    isActive: wakeLock.isActive,
  }
}
