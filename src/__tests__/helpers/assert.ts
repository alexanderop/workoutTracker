/**
 * Narrows a condition for test setup without making assertions conditional.
 *
 * Use this after an explicit `expect` when a test needs TypeScript to narrow a
 * discriminated union before inspecting the value further.
 */
export function assert(
  condition: unknown,
  message = 'Test setup assertion failed',
): asserts condition {
  if (!condition) throw new Error(message)
}
