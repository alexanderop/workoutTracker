import type { MaybeRefOrGetter } from 'vue'

import { TransitionPresets, useTransition } from '@vueuse/core'
import { computed, ref, toValue, watch } from 'vue'

type UseAnimatedCounterOptions = {
  duration?: number
  delay?: number
  decimals?: number
}

/**
 * Animates a number from 0 to a target value using easeOutExpo easing.
 */
export function useAnimatedCounter(
  target: MaybeRefOrGetter<number>,
  options: UseAnimatedCounterOptions = {},
) {
  const { duration = 1500, delay = 0, decimals = 0 } = options

  const source = ref(0)

  const rawValue = useTransition(source, {
    duration,
    transition: TransitionPresets.easeOutExpo,
    delay,
  })

  // Round to specified decimal places to fix floating-point artifacts
  const displayValue = computed(() => {
    const factor = 10 ** decimals
    return Math.round(rawValue.value * factor) / factor
  })

  function restart() {
    source.value = 0
    source.value = toValue(target)
  }

  watch(() => toValue(target), restart, { immediate: true })

  return { displayValue, restart }
}
