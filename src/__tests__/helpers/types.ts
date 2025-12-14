import type { Router } from 'vue-router'

export type TestContext = {
  router: Router
}

export type SetInputs = {
  kg: HTMLInputElement
  reps: HTMLInputElement
  rir: HTMLInputElement
  complete: HTMLElement
}

export type SetValues = {
  kg?: number
  reps?: number
  rir?: number
}

/**
 * Makes all properties required and non-undefined.
 * Use in factories to catch missing fields at compile time.
 *
 * @example
 * ```ts
 * const result: Complete<Set> = {
 *   id: 1,
 *   kg: '100',
 *   reps: '8',
 *   rir: '2',
 *   status: 'active',
 *   ...overrides,
 * }
 * // TypeScript will error if any required property is missing
 * ```
 */
export type Complete<T> = {
  [P in keyof Required<T>]: T[P]
}
