import type { DesignControl, DesignControlState } from '../types'

/**
 * Reading control values without type assertions, which the lint config bans —
 * and rightly so here: the state is a loose string/boolean bag, so every read
 * has to prove the value is one the component actually accepts rather than
 * asserting it.
 */

export function initialControlState(
  controls: ReadonlyArray<DesignControl> | undefined,
): DesignControlState {
  const state: DesignControlState = {}
  for (const control of controls ?? []) {
    state[control.key] = control.initial
  }
  return state
}

/**
 * Narrow a stored value to one of `options`, falling back when the state holds
 * something stale (a control was renamed) or nothing yet.
 */
export function readOption<T extends string>(
  state: DesignControlState | undefined,
  key: string,
  options: ReadonlyArray<T>,
  fallback: T,
): T {
  const value = state?.[key]
  return options.find((option) => option === value) ?? fallback
}

export function readBoolean(
  state: DesignControlState | undefined,
  key: string,
  fallback: boolean,
): boolean {
  const value = state?.[key]
  return typeof value === 'boolean' ? value : fallback
}

export function readText(
  state: DesignControlState | undefined,
  key: string,
  fallback: string,
): string {
  const value = state?.[key]
  return typeof value === 'string' && value.length > 0 ? value : fallback
}
