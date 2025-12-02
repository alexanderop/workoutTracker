import { watch, onScopeDispose } from 'vue'
import { useDocumentVisibility } from '@vueuse/core'
import { useWorkout } from './useWorkout'
import { useScreenWakeLock } from './useScreenWakeLock'

export function useWorkoutWakeLock() {
  const { workout } = useWorkout()
  const visibility = useDocumentVisibility()
  const wakeLock = useScreenWakeLock()

  // Request/release based on workout mode
  watch(
    () => workout.value.mode,
    (mode) => {
      if (mode === 'active') {
        wakeLock.acquireAll()
        return
      }
      wakeLock.releaseAll()
    },
    { immediate: true },
  )

  // Release on hidden to save battery, re-acquire on visible
  watch(visibility, (state, prevState) => {
    if (workout.value.mode !== 'active') return

    if (state === 'hidden') {
      console.log('[WakeLock] Page hidden, releasing to save battery...')
      wakeLock.releaseAll()
      return
    }

    if (state === 'visible' && prevState === 'hidden') {
      console.log('[WakeLock] Page visible, re-acquiring...')
      wakeLock.acquireAll()
    }
  })

  onScopeDispose(() => wakeLock.releaseAll())

  return {
    isSupported: wakeLock.isSupported,
    isActive: wakeLock.isActive,
    usingFallback: wakeLock.videoIsActive,
  }
}
