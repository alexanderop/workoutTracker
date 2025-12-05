import { useIntervalFn } from '@vueuse/core'
import { computed, ref } from 'vue'
import { formatTime } from '@/lib/workout-utils'

// Maximum rest time before auto-stopping (5 minutes)
const MAX_REST_TIME_SECONDS = 300

export function useRestTimer() {
  // 1. Primary State
  const elapsedSeconds = ref(0)

  // 2. Internal interval setup
  const { pause, resume, isActive } = useIntervalFn(
    () => {
      elapsedSeconds.value++
      if (elapsedSeconds.value >= MAX_REST_TIME_SECONDS) {
        pause()
      }
    },
    1000,
    { immediate: false },
  )

  // 3. Computed
  const isRunning = computed(() => isActive.value)
  const formattedTime = computed(() => formatTime(elapsedSeconds.value))

  // 4. Methods
  function start() {
    elapsedSeconds.value = 0
    resume()
  }

  function stop() {
    pause()
  }

  function reset() {
    elapsedSeconds.value = 0
    pause()
  }

  function toggle() {
    if (isActive.value) {
      pause()
      return
    }
    resume()
  }

  return {
    elapsedSeconds,
    isRunning,
    formattedTime,
    start,
    stop,
    reset,
    toggle,
  }
}
