import { expect } from 'vitest'

/** Narrow a parse result to its success shape, failing the test otherwise. */
export function assertSuccess<T>(result: {
  success: boolean
  data?: T
}): asserts result is { success: true; data: T } {
  expect(result).toBeParseSuccess()
}
