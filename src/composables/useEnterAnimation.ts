import type { MaybeRefOrGetter, ShallowRef } from 'vue'
import { shallowReadonly, shallowRef } from 'vue'
import { tryOnMounted, useTimeoutFn } from '@vueuse/core'

export type UseEnterAnimationReturn = {
  /** Becomes true once the delay elapses after mount. */
  isVisible: Readonly<ShallowRef<boolean>>
}

/**
 * Provides a simple enter animation trigger for staggered element reveals.
 *
 * @param delay Milliseconds to wait before triggering visibility; may be a ref or getter
 */
export function useEnterAnimation(delay: MaybeRefOrGetter<number> = 100): UseEnterAnimationReturn {
  const isVisible = shallowRef(false)

  const { start } = useTimeoutFn(
    () => {
      isVisible.value = true
    },
    delay,
    { immediate: false },
  )

  tryOnMounted(start)

  return { isVisible: shallowReadonly(isVisible) }
}
