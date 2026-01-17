/**
 * Assertion Abstraction Layer
 *
 * This module provides unified assertion APIs that work in both browser mode (Playwright)
 * and Happy-DOM environments.
 *
 * In browser mode:
 * - expectElement wraps Vitest's native expect.element() with built-in retry
 * - expectPoll wraps Vitest's native expect.poll() for async value assertions
 *
 * In Happy-DOM:
 * - expectElement uses waitFor() + jest-dom matchers for retry behavior
 * - expectPoll uses waitFor() for async value assertions
 *
 * Usage:
 * ```ts
 * import { expectElement, expectPoll } from '../helpers/assertions'
 *
 * // Element assertions with retry
 * await expectElement(page.getByRole('button')).toBeVisible()
 * await expectElement(page.getByRole('dialog')).not.toBeInTheDocument()
 *
 * // Value assertions with polling
 * await expectPoll(() => counter.value).toBe(5)
 * await expectPoll(() => router.currentRoute.value.path).toContain('/home')
 * ```
 */

// Re-export browser implementations (default for now)
// TODO: In future user stories, this will be replaced with environment-aware exports
export { expectElement, expectPoll } from './browser'

// Re-export types for consumers
export type {
  ElementAssertion,
  NegatedElementAssertion,
  PollAssertion,
  ExpectPollOptions,
  ExpectElementFn,
  ExpectPollFn,
} from './types'
