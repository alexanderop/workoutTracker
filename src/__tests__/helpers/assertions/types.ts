/**
 * Assertion Abstraction Types
 *
 * This module defines unified assertion types that work in both browser mode (Playwright)
 * and Happy-DOM environments. The interfaces are designed to mirror Vitest's expect.element()
 * and expect.poll() APIs.
 *
 * In browser mode: Uses native Vitest expect.element() with automatic retry
 * In Happy-DOM: Uses waitFor() from @testing-library with standard jest-dom matchers
 */

import type { Locator } from '../locator/types'

/**
 * Options for polling assertions
 * Matches Vitest's ExpectPollOptions interface
 */
export interface ExpectPollOptions {
  /**
   * Time in milliseconds between checks
   * @default 50
   */
  interval?: number

  /**
   * Maximum time to wait in milliseconds
   * @default 1000
   */
  timeout?: number

  /**
   * Custom error message on failure
   */
  message?: string
}

/**
 * Negated element assertion for .not chaining
 */
export interface NegatedElementAssertion {
  /**
   * Assert element does NOT exist in the DOM
   */
  toBeInTheDocument(): Promise<void>

  /**
   * Assert element is NOT visible
   */
  toBeVisible(): Promise<void>

  /**
   * Assert form control is NOT disabled
   */
  toBeDisabled(): Promise<void>

  /**
   * Assert element does NOT have text content
   */
  toHaveTextContent(text: string | RegExp): Promise<void>

  /**
   * Assert form element does NOT have value
   */
  toHaveValue(value?: string | string[] | number | null): Promise<void>

  /**
   * Assert element does NOT have attribute
   */
  toHaveAttribute(attr: string, value?: string | RegExp): Promise<void>
}

/**
 * Element assertion interface matching Vitest's expect.element() matchers
 * These are the matchers actually used in this codebase
 */
export interface ElementAssertion {
  /**
   * Negate the assertion
   */
  not: NegatedElementAssertion

  /**
   * Assert element exists in the DOM
   */
  toBeInTheDocument(): Promise<void>

  /**
   * Assert element is visible (not display:none, visibility:hidden, opacity:0, or hidden attribute)
   */
  toBeVisible(): Promise<void>

  /**
   * Assert form control is disabled
   */
  toBeDisabled(): Promise<void>

  /**
   * Assert element has text content
   */
  toHaveTextContent(text: string | RegExp): Promise<void>

  /**
   * Assert form element has value
   */
  toHaveValue(value?: string | string[] | number | null): Promise<void>

  /**
   * Assert element has attribute (optionally with specific value)
   */
  toHaveAttribute(attr: string, value?: string | RegExp): Promise<void>
}

/**
 * Poll assertion interface for async value assertions
 * Matches Vitest's expect.poll() behavior
 */
export interface PollAssertion<T> {
  /**
   * Negate the assertion
   */
  not: PollAssertion<T>

  /**
   * Assert value equals expected
   */
  toBe(expected: T): Promise<void>

  /**
   * Assert value deeply equals expected
   */
  toEqual(expected: T): Promise<void>

  /**
   * Assert value is truthy
   */
  toBeTruthy(): Promise<void>

  /**
   * Assert value is falsy
   */
  toBeFalsy(): Promise<void>

  /**
   * Assert value is greater than expected (for numbers)
   */
  toBeGreaterThan(expected: number): Promise<void>

  /**
   * Assert value is greater than or equal to expected (for numbers)
   */
  toBeGreaterThanOrEqual(expected: number): Promise<void>

  /**
   * Assert value is less than expected (for numbers)
   */
  toBeLessThan(expected: number): Promise<void>

  /**
   * Assert value contains expected substring/item
   */
  toContain(expected: string | unknown): Promise<void>
}

/**
 * Element assertion function type
 * Takes a Locator or HTMLElement and returns an assertion object
 */
export type ExpectElementFn = (
  element: Locator | HTMLElement | SVGElement | null,
  options?: ExpectPollOptions
) => ElementAssertion

/**
 * Poll assertion function type
 * Takes a getter function and returns an assertion object
 */
export type ExpectPollFn = <T>(
  getter: () => T | Promise<T>,
  options?: ExpectPollOptions
) => PollAssertion<Awaited<T>>
