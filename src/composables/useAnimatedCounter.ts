import type { MaybeRefOrGetter } from 'vue'

import { TransitionPresets, useTransition } from '@vueuse/core'
import { ref, toValue, watch } from 'vue'

type UseAnimatedCounterOptions = {
  duration?: number
  delay?: number
}

/**
 * Animates a number from 0 to a target value using easeOutExpo easing.
 */
export function useAnimatedCounter(
  target: MaybeRefOrGetter<number>,
  options: UseAnimatedCounterOptions = {},
) {
  const { duration = 1500, delay = 0 } = options

  const source = ref(0)

  const displayValue = useTransition(source, {
    duration,
    transition: TransitionPresets.easeOutExpo,
    delay,
  })

  function restart() {
    source.value = 0
    source.value = toValue(target)
  }

  watch(() => toValue(target), restart, { immediate: true })

  return { displayValue, restart }
}
