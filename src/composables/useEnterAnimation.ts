import { onMounted, ref } from 'vue'
import { useTimeoutFn } from '@vueuse/core'

/**
 * Provides a simple enter animation trigger for staggered element reveals.
 *
 * @param delay - Milliseconds to wait before triggering visibility (default: 100)
 * @returns isVisible ref that becomes true after the delay on mount
 */
export function useEnterAnimation(delay = 100) {
  const isVisible = ref(false)

  const { start } = useTimeoutFn(
    () => {
      isVisible.value = true
    },
    delay,
    { immediate: false }
  )

  onMounted(start)

  return { isVisible }
}
