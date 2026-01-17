/**
 * Happy-DOM Assertion Implementation
 *
 * This module provides the Happy-DOM implementation of the assertion abstraction.
 * It uses waitFor() from @testing-library for retry behavior and jest-dom matchers
 * for element assertions.
 *
 * Usage:
 * - Import `expectElement` and `expectPoll` from this module
 * - Use them identically to Vitest's expect.element() and expect.poll()
 *
 * Note: jest-dom must be imported in the setup file for matchers to work.
 */

import { expect } from 'vitest'
import { waitFor } from '@testing-library/vue'
import type { Locator } from '../locator/types'
import type {
  ElementAssertion,
  NegatedElementAssertion,
  PollAssertion,
  ExpectPollOptions,
} from './types'

// Import HappyDomLocator for type checking
import { HappyDomLocator } from '../locator/happy-dom'

/**
 * Default polling options matching Vitest's defaults
 */
const DEFAULT_TIMEOUT = 1000
const DEFAULT_INTERVAL = 50

/**
 * Type guard to check if value is a HappyDomLocator
 */
function isHappyDomLocator(value: unknown): value is HappyDomLocator {
  return value instanceof HappyDomLocator
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
 * Type guard to check if value is a Locator (has element method)
 */
function isLocator(value: unknown): value is Locator {
  return (
    value !== null &&
    typeof value === 'object' &&
    'element' in value &&
    typeof value.element === 'function'
  )
}

/**
 * Get element from the input, handling Locator and raw elements
 */
function getElement(
  elementOrLocator: Locator | HTMLElement | SVGElement | null,
): HTMLElement | SVGElement | null {
  if (elementOrLocator === null) {
    return null
  }
  if (isHTMLElement(elementOrLocator) || isSVGElement(elementOrLocator)) {
    return elementOrLocator
  }
  if (isHappyDomLocator(elementOrLocator)) {
    return elementOrLocator.query()
  }
  if (isLocator(elementOrLocator)) {
    return elementOrLocator.query()
  }
  return null
}

/**
 * Convert our ExpectPollOptions to waitFor options
 */
function toWaitForOptions(options?: ExpectPollOptions): { timeout: number; interval: number } {
  return {
    timeout: options?.timeout ?? DEFAULT_TIMEOUT,
    interval: options?.interval ?? DEFAULT_INTERVAL,
  }
}

/**
 * Negated element assertion for Happy-DOM
 * Uses waitFor to poll until assertion passes
 */
class HappyDomNegatedElementAssertion implements NegatedElementAssertion {
  private readonly elementOrLocator: Locator | HTMLElement | SVGElement | null
  private readonly options: ExpectPollOptions | undefined

  constructor(
    elementOrLocator: Locator | HTMLElement | SVGElement | null,
    options?: ExpectPollOptions,
  ) {
    this.elementOrLocator = elementOrLocator
    this.options = options
  }

  async toBeInTheDocument(): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).not.toBeInTheDocument()
      },
      waitForOptions,
    )
  }

  async toBeVisible(): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).not.toBeVisible()
      },
      waitForOptions,
    )
  }

  async toBeDisabled(): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).not.toBeDisabled()
      },
      waitForOptions,
    )
  }

  async toHaveTextContent(text: string | RegExp): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).not.toHaveTextContent(text)
      },
      waitForOptions,
    )
  }

  async toHaveValue(value?: string | string[] | number | null): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).not.toHaveValue(value)
      },
      waitForOptions,
    )
  }

  async toHaveAttribute(attr: string, value?: string | RegExp): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).not.toHaveAttribute(attr, value)
      },
      waitForOptions,
    )
  }

  async toHaveClass(...classNames: string[]): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).not.toHaveClass(...classNames)
      },
      waitForOptions,
    )
  }
}

/**
 * Element assertion for Happy-DOM
 * Uses waitFor to poll until assertion passes
 */
class HappyDomElementAssertion implements ElementAssertion {
  private readonly elementOrLocator: Locator | HTMLElement | SVGElement | null
  private readonly options: ExpectPollOptions | undefined

  constructor(
    elementOrLocator: Locator | HTMLElement | SVGElement | null,
    options?: ExpectPollOptions,
  ) {
    this.elementOrLocator = elementOrLocator
    this.options = options
  }

  get not(): NegatedElementAssertion {
    return new HappyDomNegatedElementAssertion(this.elementOrLocator, this.options)
  }

  async toBeInTheDocument(): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).toBeInTheDocument()
      },
      waitForOptions,
    )
  }

  async toBeVisible(): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).toBeVisible()
      },
      waitForOptions,
    )
  }

  async toBeDisabled(): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).toBeDisabled()
      },
      waitForOptions,
    )
  }

  async toHaveTextContent(text: string | RegExp): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).toHaveTextContent(text)
      },
      waitForOptions,
    )
  }

  async toHaveValue(value?: string | string[] | number | null): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).toHaveValue(value)
      },
      waitForOptions,
    )
  }

  async toHaveAttribute(attr: string, value?: string | RegExp): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).toHaveAttribute(attr, value)
      },
      waitForOptions,
    )
  }

  async toHaveClass(...classNames: string[]): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    await waitFor(
      () => {
        const el = getElement(this.elementOrLocator)
        expect(el).toHaveClass(...classNames)
      },
      waitForOptions,
    )
  }
}

/**
 * Poll assertion for Happy-DOM
 * Uses waitFor to poll until assertion passes
 */
class HappyDomPollAssertion<T> implements PollAssertion<T> {
  private readonly getter: () => Promise<T>
  private readonly options: ExpectPollOptions | undefined
  private readonly isNegated: boolean

  constructor(getter: () => Promise<T>, options?: ExpectPollOptions, isNegated = false) {
    this.getter = getter
    this.options = options
    this.isNegated = isNegated
  }

  get not(): PollAssertion<T> {
    return new HappyDomPollAssertion<T>(this.getter, this.options, true)
  }

  async toBe(expected: T): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    const negated = this.isNegated
    await waitFor(
      async () => {
        const value = await this.getter()
        const assertion = negated ? expect(value).not : expect(value)
        assertion.toBe(expected)
      },
      waitForOptions,
    )
  }

  async toEqual(expected: T): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    const negated = this.isNegated
    await waitFor(
      async () => {
        const value = await this.getter()
        const assertion = negated ? expect(value).not : expect(value)
        assertion.toEqual(expected)
      },
      waitForOptions,
    )
  }

  async toBeTruthy(): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    const negated = this.isNegated
    await waitFor(
      async () => {
        const value = await this.getter()
        const assertion = negated ? expect(value).not : expect(value)
        assertion.toBeTruthy()
      },
      waitForOptions,
    )
  }

  async toBeFalsy(): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    const negated = this.isNegated
    await waitFor(
      async () => {
        const value = await this.getter()
        const assertion = negated ? expect(value).not : expect(value)
        assertion.toBeFalsy()
      },
      waitForOptions,
    )
  }

  async toBeGreaterThan(expected: number): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    const negated = this.isNegated
    await waitFor(
      async () => {
        const value = await this.getter()
        const assertion = negated ? expect(value).not : expect(value)
        assertion.toBeGreaterThan(expected)
      },
      waitForOptions,
    )
  }

  async toBeGreaterThanOrEqual(expected: number): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    const negated = this.isNegated
    await waitFor(
      async () => {
        const value = await this.getter()
        const assertion = negated ? expect(value).not : expect(value)
        assertion.toBeGreaterThanOrEqual(expected)
      },
      waitForOptions,
    )
  }

  async toBeLessThan(expected: number): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    const negated = this.isNegated
    await waitFor(
      async () => {
        const value = await this.getter()
        const assertion = negated ? expect(value).not : expect(value)
        assertion.toBeLessThan(expected)
      },
      waitForOptions,
    )
  }

  async toContain(expected: string | unknown): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    const negated = this.isNegated
    await waitFor(
      async () => {
        const value = await this.getter()
        const assertion = negated ? expect(value).not : expect(value)
        assertion.toContain(expected)
      },
      waitForOptions,
    )
  }

  async toBeCloseTo(expected: number, numDigits?: number): Promise<void> {
    const waitForOptions = toWaitForOptions(this.options)
    const negated = this.isNegated
    await waitFor(
      async () => {
        const value = await this.getter()
        const assertion = negated ? expect(value).not : expect(value)
        assertion.toBeCloseTo(expected, numDigits)
      },
      waitForOptions,
    )
  }
}

/**
 * Happy-DOM implementation of expect.element()
 *
 * Uses waitFor() from @testing-library to provide retry behavior,
 * similar to Vitest's native expect.element().
 *
 * @param element - A Locator, HTMLElement, SVGElement, or null
 * @param options - Polling options (timeout, interval, message)
 * @returns An ElementAssertion object with async matchers
 */
export function expectElement(
  element: Locator | HTMLElement | SVGElement | null,
  options?: ExpectPollOptions,
): ElementAssertion {
  return new HappyDomElementAssertion(element, options)
}

/**
 * Happy-DOM implementation of expect.poll()
 *
 * Uses waitFor() from @testing-library to repeatedly call the getter
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
  // Wrap the getter to always return a Promise that awaits the result
  const asyncGetter = async (): Promise<Awaited<T>> => {
    const result = await getter()
    return result
  }
  return new HappyDomPollAssertion<Awaited<T>>(asyncGetter, options)
}
