import { ref } from 'vue'
import { formatTime } from '@/lib/workout-utils'

const MAX_REST_TIME = 300 // 5 minutes

export function useRestTimer() {
  const restTime = ref(0)
  const isTimerRunning = ref(false)
  let interval: ReturnType<typeof setInterval> | null = null

  function toggleTimer() {
    isTimerRunning.value = !isTimerRunning.value

    if (isTimerRunning.value) {
      interval = setInterval(() => {
        restTime.value++
        if (restTime.value >= MAX_REST_TIME) {
          stop()
        }
      }, 1000)
    }
    else {
      if (interval)
        clearInterval(interval)
    }
  }

  function resetTimer() {
    restTime.value = 0
    isTimerRunning.value = false
    if (interval)
      clearInterval(interval)
  }

  function stop() {
    isTimerRunning.value = false
    if (interval)
      clearInterval(interval)
  }

  function getFormattedTime(): string {
    return formatTime(restTime.value)
  }

  return {
    restTime,
    isTimerRunning,
    toggleTimer,
    resetTimer,
    stop,
    getFormattedTime,
  }
}
