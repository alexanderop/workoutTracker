import { onMounted, ref } from 'vue'

/**
 * Provides a simple enter animation trigger for staggered element reveals.
 *
 * @param delay - Milliseconds to wait before triggering visibility (default: 100)
 * @returns isVisible ref that becomes true after the delay on mount
 */
export function useEnterAnimation(delay = 100) {
  const isVisible = ref(false)

  onMounted(() => {
    setTimeout(() => {
      isVisible.value = true
    }, delay)
  })

  return { isVisible }
}
