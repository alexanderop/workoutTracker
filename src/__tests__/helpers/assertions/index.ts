/**
 * Assertion Abstraction Layer
 *
 * This module provides unified assertion APIs that work in both browser mode (Playwright)
 * and Happy-DOM environments.
 *
 * Environment detection:
 * - Browser mode: Uses Vitest's native expect.element() and expect.poll()
 * - Happy-DOM: Uses waitFor() from @testing-library + jest-dom matchers
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

import type { ExpectElementFn, ExpectPollFn } from './types'

/**
 * Detect if we're running in Vitest browser mode.
 * In browser mode, window.__vitest_browser__ is set by Vitest.
 */
const isBrowserMode =
  globalThis.window !== undefined && '__vitest_browser__' in globalThis

// Use top-level await with dynamic import to load the correct implementation
// This works in ESM environments (both Node and browser)
const impl = isBrowserMode
  ? await import('./browser')
  : await import('./happy-dom')

/**
 * Assert on an element with automatic retry.
 * Automatically uses the correct implementation based on environment.
 */
export const expectElement: ExpectElementFn = impl.expectElement

/**
 * Poll a value until assertion passes.
 * Automatically uses the correct implementation based on environment.
 */
export const expectPoll: ExpectPollFn = impl.expectPoll

// Re-export types for consumers
export type {
  ElementAssertion,
  NegatedElementAssertion,
  PollAssertion,
  ExpectPollOptions,
  ExpectElementFn,
  ExpectPollFn,
} from './types'
