import { effectScope, watch, onScopeDispose } from 'vue'
import { useWakeLock } from '@vueuse/core'
import { useWorkout } from './useWorkout'

export function useWorkoutWakeLock() {
  const { workout } = useWorkout()
  const { isSupported, isActive, request, release } = useWakeLock()

  // Create a dedicated scope for this composable's watchers
  const scope = effectScope()

  scope.run(() => {
    // Handle initial state and watch for mode changes
    watch(
      () => workout.value.mode,
      (mode, oldMode) => {
        if (mode === 'active') {
          request('screen')
          return
        }
        // Only release if transitioning from active to builder
        if (oldMode === 'active' && mode === 'builder') {
          release()
        }
      },
      { immediate: true, flush: 'sync' },
    )
  })

  onScopeDispose(() => {
    scope.stop()
    if (workout.value.mode === 'active') {
      release()
    }
  })

  return { isSupported, isActive }
}
