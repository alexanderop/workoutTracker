/**
 * Browser Mode Assertion Implementation
 *
 * This module provides the browser mode implementation of the assertion abstraction.
 * It wraps Vitest's native expect.element() and expect.poll() which have built-in
 * retry behavior.
 *
 * Usage:
 * - Import `expectElement` and `expectPoll` from this module
 * - Use them identically to Vitest's expect.element() and expect.poll()
 */

import { expect } from 'vitest'
import type { Locator } from '../locator/types'
import type {
  ElementAssertion,
  NegatedElementAssertion,
  PollAssertion,
  ExpectPollOptions,
} from './types'

// Import BrowserLocator to extract native locator
import { BrowserLocator } from '../locator/browser'

/**
 * Type for native Vitest element assertion result
 */
type NativeElementAssertion = ReturnType<typeof expect.element>

/**
 * Type for negated native assertion
 */
type NativeNegatedAssertion = NativeElementAssertion['not']

/**
 * Type for native poll assertion
 */
type NativePollAssertion = ReturnType<typeof expect.poll>

/**
 * Type guard to check if value is a BrowserLocator
 */
function isBrowserLocator(value: unknown): value is BrowserLocator {
  return value instanceof BrowserLocator
}

/**
 * Type guard to check if value is an HTMLElement
 */
function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement
}

/**
 * Type guard to check if value is an SVGElement
 */
function isSVGElement(value: unknown): value is SVGElement {
  return value instanceof SVGElement
}


/**
 * Wraps native negated assertion to match our interface
 */
class BrowserNegatedElementAssertion implements NegatedElementAssertion {
  private readonly nativeNot: NativeNegatedAssertion

  constructor(nativeNot: NativeNegatedAssertion) {
    this.nativeNot = nativeNot
  }

  async toBeInTheDocument(): Promise<void> {
    await this.nativeNot.toBeInTheDocument()
  }

  async toBeVisible(): Promise<void> {
    await this.nativeNot.toBeVisible()
  }

  async toBeDisabled(): Promise<void> {
    await this.nativeNot.toBeDisabled()
  }

  async toHaveTextContent(text: string | RegExp): Promise<void> {
    await this.nativeNot.toHaveTextContent(text)
  }

  async toHaveValue(value?: string | string[] | number | null): Promise<void> {
    await this.nativeNot.toHaveValue(value)
  }

  async toHaveAttribute(attr: string, value?: string | RegExp): Promise<void> {
    await this.nativeNot.toHaveAttribute(attr, value)
  }
}

/**
 * Wraps native element assertion to match our interface
 */
class BrowserElementAssertion implements ElementAssertion {
  private readonly native: NativeElementAssertion

  constructor(native: NativeElementAssertion) {
    this.native = native
  }

  get not(): NegatedElementAssertion {
    return new BrowserNegatedElementAssertion(this.native.not)
  }

  async toBeInTheDocument(): Promise<void> {
    await this.native.toBeInTheDocument()
  }

  async toBeVisible(): Promise<void> {
    await this.native.toBeVisible()
  }

  async toBeDisabled(): Promise<void> {
    await this.native.toBeDisabled()
  }

  async toHaveTextContent(text: string | RegExp): Promise<void> {
    await this.native.toHaveTextContent(text)
  }

  async toHaveValue(value?: string | string[] | number | null): Promise<void> {
    await this.native.toHaveValue(value)
  }

  async toHaveAttribute(attr: string, value?: string | RegExp): Promise<void> {
    await this.native.toHaveAttribute(attr, value)
  }
}

/**
 * Wraps native poll assertion to match our interface
 */
class BrowserPollAssertion<T> implements PollAssertion<T> {
  private readonly native: NativePollAssertion
  private readonly isNegated: boolean

  constructor(native: NativePollAssertion, isNegated = false) {
    this.native = native
    this.isNegated = isNegated
  }

  get not(): PollAssertion<T> {
    // Access native.not which returns the same structure
    const negatedNative = this.native.not
    // Create new instance with negated flag - native.not returns same type
    return new BrowserPollAssertion<T>(negatedNative, true)
  }

  async toBe(expected: T): Promise<void> {
    const assertion = this.isNegated ? this.native.not : this.native
    await assertion.toBe(expected)
  }

  async toEqual(expected: T): Promise<void> {
    const assertion = this.isNegated ? this.native.not : this.native
    await assertion.toEqual(expected)
  }

  async toBeTruthy(): Promise<void> {
    const assertion = this.isNegated ? this.native.not : this.native
    await assertion.toBeTruthy()
  }

  async toBeFalsy(): Promise<void> {
    const assertion = this.isNegated ? this.native.not : this.native
    await assertion.toBeFalsy()
  }

  async toBeGreaterThan(expected: number): Promise<void> {
    const assertion = this.isNegated ? this.native.not : this.native
    await assertion.toBeGreaterThan(expected)
  }

  async toBeGreaterThanOrEqual(expected: number): Promise<void> {
    const assertion = this.isNegated ? this.native.not : this.native
    await assertion.toBeGreaterThanOrEqual(expected)
  }

  async toBeLessThan(expected: number): Promise<void> {
    const assertion = this.isNegated ? this.native.not : this.native
    await assertion.toBeLessThan(expected)
  }

  async toContain(expected: string | unknown): Promise<void> {
    const assertion = this.isNegated ? this.native.not : this.native
    await assertion.toContain(expected)
  }
}

/**
 * Browser implementation of expect.element()
 *
 * Wraps Vitest's native expect.element() which provides automatic retry behavior.
 * This is essentially a shorthand for expect.poll(() => locator.element()).
 *
 * @param element - A Locator, HTMLElement, SVGElement, or null
 * @param options - Polling options (timeout, interval, message)
 * @returns An ElementAssertion object with async matchers
 */
export function expectElement(
  element: Locator | HTMLElement | SVGElement | null,
  options?: ExpectPollOptions,
): ElementAssertion {
  // For BrowserLocator, pass the native locator directly to preserve retry behavior
  if (isBrowserLocator(element)) {
    const native = expect.element(element.native, options)
    return new BrowserElementAssertion(native)
  }

  // For raw HTML/SVG elements, pass directly
  if (isHTMLElement(element) || isSVGElement(element)) {
    const native = expect.element(element, options)
    return new BrowserElementAssertion(native)
  }

  // For null, pass directly
  if (element === null) {
    const native = expect.element(element, options)
    return new BrowserElementAssertion(native)
  }

  // For other Locator implementations (including native Vitest locators),
  // pass directly to expect.element() which handles the retry behavior
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  const native = expect.element(element as any, options)
  return new BrowserElementAssertion(native)
}

/**
 * Browser implementation of expect.poll()
 *
 * Wraps Vitest's native expect.poll() which repeatedly calls the getter
 * until the assertion passes or times out.
 *
 * @param getter - A function that returns the value to assert on
 * @param options - Polling options (timeout, interval, message)
 * @returns A PollAssertion object with async matchers
 */
export function expectPoll<T>(
  getter: () => T | Promise<T>,
  options?: ExpectPollOptions,
): PollAssertion<Awaited<T>> {
  const native = expect.poll(getter, options)
  return new BrowserPollAssertion<Awaited<T>>(native)
}
