import type { ComputedRef, MaybeRefOrGetter } from 'vue'

import { TransitionPresets, useTransition } from '@vueuse/core'
import { computed, shallowRef, toValue, watch } from 'vue'

export type UseAnimatedCounterOptions = {
  /**
   * Animation duration in milliseconds.
   * @default 1500
   */
  duration?: number
  /**
   * Delay before the animation starts, in milliseconds.
   * @default 0
   */
  delay?: number
  /**
   * Decimal places to round the animated value to.
   * @default 0
   */
  decimals?: number
}

export type UseAnimatedCounterReturn = {
  displayValue: ComputedRef<number>
  /** Restart the animation from 0 toward the current target. */
  restart: () => void
}

/**
 * Animates a number from 0 to a target value using easeOutExpo easing.
 *
 * @param target The value to animate toward; a ref or getter restarts the animation on change
 * @param options
 */
export function useAnimatedCounter(
  target: MaybeRefOrGetter<number>,
  options: UseAnimatedCounterOptions = {},
): UseAnimatedCounterReturn {
  const { duration = 1500, delay = 0, decimals = 0 } = options

  const source = shallowRef(0)

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
