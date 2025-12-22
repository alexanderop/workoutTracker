import { useMediaQuery } from '@vueuse/core'

/**
 * Detects if the current device uses touch input.
 *
 * Uses the `pointer: coarse` media query which matches devices with
 * imprecise pointing devices (touchscreens). This is more accurate than
 * width-based breakpoints because:
 * - A 1024px tablet would fail `max-width: 768px` but passes `pointer: coarse`
 * - Desktop users with touchscreens get the appropriate experience
 *
 * @returns Object with `isTouchDevice` computed ref
 */
export function useTouchDevice() {
  const isTouchDevice = useMediaQuery('(pointer: coarse)')

  return { isTouchDevice }
}
