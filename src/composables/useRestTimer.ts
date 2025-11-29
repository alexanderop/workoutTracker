import { useIntervalFn } from '@vueuse/core'
import { ref } from 'vue'
import { formatTime } from '@/lib/workout-utils'

// Maximum rest time before auto-stopping (5 minutes)
const MAX_REST_TIME = 300

export function useRestTimer() {
  const restTime = ref(0)

  const { pause, resume, isActive } = useIntervalFn(
    () => {
      restTime.value++
      if (restTime.value >= MAX_REST_TIME) {
        pause()
      }
    },
    1000,
    { immediate: false },
  )

  function toggleTimer() {
    if (isActive.value) {
      pause()
    }
    else {
      resume()
    }
  }

  function resetTimer() {
    restTime.value = 0
    pause()
  }

  function startTimer() {
    restTime.value = 0
    resume()
  }

  function getFormattedTime(): string {
    return formatTime(restTime.value)
  }

  return {
    restTime,
    isTimerRunning: isActive,
    toggleTimer,
    resetTimer,
    stop: pause,
    startTimer,
    getFormattedTime,
  }
}
