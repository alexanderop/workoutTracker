import { watch, onScopeDispose } from 'vue'
import { useWakeLock, useDocumentVisibility } from '@vueuse/core'
import { useWorkout } from './useWorkout'

export function useWorkoutWakeLock() {
  const { workout } = useWorkout()
  const { isSupported, isActive, request, release } = useWakeLock()
  const visibility = useDocumentVisibility()

  // Request/release based on workout mode
  watch(
    () => workout.value.mode,
    (mode) => {
      if (mode === 'active') {
        request('screen')
        return
      }
      release()
    },
    { immediate: true, flush: 'sync' },
  )

  // Re-acquire when page becomes visible (browser releases lock on tab switch)
  watch(
    visibility,
    (state) => {
      if (state === 'visible' && workout.value.mode === 'active') {
        request('screen')
      }
    },
    { flush: 'sync' },
  )

  onScopeDispose(() => release())

  return { isSupported, isActive }
}
