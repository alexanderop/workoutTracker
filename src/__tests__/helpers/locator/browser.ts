/**
 * Browser Mode Locator Implementation
 *
 * This module provides the browser mode implementation of the Locator abstraction.
 * It wraps the native vitest-browser-vue page object, delegating all calls to
 * Playwright's locator API.
 *
 * Usage:
 * - Import `page` from this module instead of `vitest/browser`
 * - All queries and interactions work identically to the native API
 */

import { page as nativePage,  } from 'vitest/browser'
import type {
  Locator,
  Page,
  ARIARole,
  LocatorOptions,
  LocatorByRoleOptions,
  UserEventClickOptions,
  UserEventFillOptions,
  UserEventClearOptions,
  UserEventHoverOptions,
  UserEventSelectOptions,
} from './types'

// Re-export userEvent for convenience


/**
 * Type representing the native Vitest browser Locator
 * We use ReturnType to get the actual type from the page object
 */
type NativeLocator = ReturnType<typeof nativePage.getByRole>

/**
 * Type guard to check if a value is a BrowserLocator
 */
function isBrowserLocator(value: unknown): value is BrowserLocator {
  return value instanceof BrowserLocator
}

/**
 * Safely extract element from native locator
 */
function extractElement(native: NativeLocator): HTMLElement | SVGElement {
  const el = native.element()
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    return el
  }
  // In browser mode, element() always returns HTMLElement or SVGElement
  // This fallback should never be reached
  throw new Error('Unexpected element type from native locator')
}

/**
 * Safely extract elements from native locator
 */
function extractElements(native: NativeLocator): Array<HTMLElement | SVGElement> {
  return native.elements().filter(
    (el): el is HTMLElement | SVGElement => el instanceof HTMLElement || el instanceof SVGElement,
  )
}

/**
 * Safely extract query result from native locator
 */
function extractQueryResult(native: NativeLocator): HTMLElement | SVGElement | null {
  const el = native.query()
  if (el === null) {
    return null
  }
  if (el instanceof HTMLElement || el instanceof SVGElement) {
    return el
  }
  throw new Error('Unexpected element type from native locator query')
}

/**
 * Type guard for string values
 */
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Convert an array of select values to native format
 */
function convertSelectArray(
  values: Array<HTMLElement | Locator | string>,
): NativeLocator[] | HTMLElement[] | string[] {
  // Check for locators first - if any present, convert all to native
  const hasLocators = values.some(isBrowserLocator)
  if (hasLocators) {
    const locators: Array<NativeLocator> = []
    for (const v of values) {
      if (isBrowserLocator(v)) {
        locators.push(v.native)
      }
    }
    return locators
  }
  // Check for HTMLElements
  const hasElements = values.some((v) => v instanceof HTMLElement)
  if (hasElements) {
    const elements: Array<HTMLElement> = []
    for (const v of values) {
      if (v instanceof HTMLElement) {
        elements.push(v)
      }
    }
    return elements
  }
  // Must be strings
  return values.filter(isString)
}

/**
 * Convert a single select value to native format
 */
function convertSelectSingle(
  value: HTMLElement | Locator | string,
): NativeLocator | HTMLElement | string {
  if (isBrowserLocator(value)) {
    return value.native
  }
  if (value instanceof HTMLElement) {
    return value
  }
  if (isString(value)) {
    return value
  }
  throw new Error('Unexpected value type: expected BrowserLocator, HTMLElement, or string')
}

/**
 * Convert select values to native format, extracting native locators from BrowserLocator instances
 */
function toNativeSelectValues(
  values: HTMLElement | HTMLElement[] | Locator | Locator[] | string | string[],
): Parameters<NativeLocator['selectOptions']>[0] {
  if (Array.isArray(values)) {
    return convertSelectArray(values)
  }
  return convertSelectSingle(values)
}

/**
 * Convert LocatorByRoleOptions to native format, extracting native locators from has/hasNot
 */
function toNativeByRoleOptions(
  options?: LocatorByRoleOptions,
): Parameters<NativeLocator['getByRole']>[1] {
  if (!options) {
    return undefined
  }
  const nativeOptions: Parameters<NativeLocator['getByRole']>[1] = {
    checked: options.checked,
    disabled: options.disabled,
    expanded: options.expanded,
    includeHidden: options.includeHidden,
    level: options.level,
    name: options.name,
    pressed: options.pressed,
    selected: options.selected,
    exact: options.exact,
    hasText: options.hasText,
    hasNotText: options.hasNotText,
  }
  if (options.has && isBrowserLocator(options.has)) {
    nativeOptions.has = options.has.native
  }
  if (options.hasNot && isBrowserLocator(options.hasNot)) {
    nativeOptions.hasNot = options.hasNot.native
  }
  return nativeOptions
}

/**
 * Convert LocatorOptions to native format, extracting native locators from has/hasNot
 */
function toNativeOptions(
  options?: LocatorOptions,
): Parameters<NativeLocator['getByText']>[1] {
  if (!options) {
    return undefined
  }
  const nativeOptions: Parameters<NativeLocator['getByText']>[1] = {
    exact: options.exact,
    hasText: options.hasText,
    hasNotText: options.hasNotText,
  }
  if (options.has && isBrowserLocator(options.has)) {
    nativeOptions.has = options.has.native
  }
  if (options.hasNot && isBrowserLocator(options.hasNot)) {
    nativeOptions.hasNot = options.hasNot.native
  }
  return nativeOptions
}

/**
 * Browser implementation of the Locator interface.
 * Wraps a native Vitest browser locator and delegates all operations.
 */
class BrowserLocator implements Locator {
  readonly native: NativeLocator

  constructor(native: NativeLocator) {
    this.native = native
  }

  get selector(): string {
    // Native locator exposes selector property
    const nativeWithSelector = this.native
    if ('selector' in nativeWithSelector && typeof nativeWithSelector.selector === 'string') {
      return nativeWithSelector.selector
    }
    return '[browser-locator]'
  }

  // ─── Query Methods ──────────────────────────────────────────────────────────

  getByRole(role: ARIARole | (string & {}), options?: LocatorByRoleOptions): Locator {
    return new BrowserLocator(this.native.getByRole(role, toNativeByRoleOptions(options)))
  }

  getByLabelText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new BrowserLocator(this.native.getByLabelText(text, toNativeOptions(options)))
  }

  getByAltText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new BrowserLocator(this.native.getByAltText(text, toNativeOptions(options)))
  }

  getByPlaceholder(text: string | RegExp, options?: LocatorOptions): Locator {
    return new BrowserLocator(this.native.getByPlaceholder(text, toNativeOptions(options)))
  }

  getByText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new BrowserLocator(this.native.getByText(text, toNativeOptions(options)))
  }

  getByTitle(text: string | RegExp, options?: LocatorOptions): Locator {
    return new BrowserLocator(this.native.getByTitle(text, toNativeOptions(options)))
  }

  getByTestId(testId: string | RegExp): Locator {
    return new BrowserLocator(this.native.getByTestId(testId))
  }

  // ─── Interaction Methods ────────────────────────────────────────────────────

  async click(options?: UserEventClickOptions): Promise<void> {
    await this.native.click(options)
  }

  async dblClick(options?: UserEventClickOptions): Promise<void> {
    await this.native.dblClick(options)
  }

  async fill(text: string, options?: UserEventFillOptions): Promise<void> {
    await this.native.fill(text, options)
  }

  async clear(options?: UserEventClearOptions): Promise<void> {
    await this.native.clear(options)
  }

  async hover(options?: UserEventHoverOptions): Promise<void> {
    await this.native.hover(options)
  }

  async selectOptions(
    values: HTMLElement | HTMLElement[] | Locator | Locator[] | string | string[],
    options?: UserEventSelectOptions,
  ): Promise<void> {
    await this.native.selectOptions(toNativeSelectValues(values), options)
  }

  // ─── Element Access ─────────────────────────────────────────────────────────

  element(): HTMLElement | SVGElement {
    return extractElement(this.native)
  }

  elements(): Array<HTMLElement | SVGElement> {
    return extractElements(this.native)
  }

  query(): HTMLElement | SVGElement | null {
    return extractQueryResult(this.native)
  }

  // ─── Collection Methods ─────────────────────────────────────────────────────

  all(): Array<Locator> {
    return this.native.all().map((loc) => new BrowserLocator(loc))
  }

  nth(index: number): Locator {
    return new BrowserLocator(this.native.nth(index))
  }

  first(): Locator {
    return new BrowserLocator(this.native.first())
  }

  last(): Locator {
    return new BrowserLocator(this.native.last())
  }

  // ─── Chaining Methods ───────────────────────────────────────────────────────

  and(locator: Locator): Locator {
    if (!isBrowserLocator(locator)) {
      throw new Error('and() requires a BrowserLocator instance')
    }
    return new BrowserLocator(this.native.and(locator.native))
  }

  or(locator: Locator): Locator {
    if (!isBrowserLocator(locator)) {
      throw new Error('or() requires a BrowserLocator instance')
    }
    return new BrowserLocator(this.native.or(locator.native))
  }

  filter(options: LocatorOptions): Locator {
    // Convert our Locator types to native locators if present
    const nativeOptions: Parameters<typeof this.native.filter>[0] = {
      exact: options.exact,
      hasText: options.hasText,
      hasNotText: options.hasNotText,
    }
    if (options.has && isBrowserLocator(options.has)) {
      nativeOptions.has = options.has.native
    }
    if (options.hasNot && isBrowserLocator(options.hasNot)) {
      nativeOptions.hasNot = options.hasNot.native
    }
    return new BrowserLocator(this.native.filter(nativeOptions))
  }
}

/**
 * Browser implementation of the Page interface.
 * Wraps the native Vitest browser page object.
 */
class BrowserPage implements Page {
  // ─── Query Methods ──────────────────────────────────────────────────────────

  getByRole(role: ARIARole | (string & {}), options?: LocatorByRoleOptions): Locator {
    return new BrowserLocator(nativePage.getByRole(role, toNativeByRoleOptions(options)))
  }

  getByLabelText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new BrowserLocator(nativePage.getByLabelText(text, toNativeOptions(options)))
  }

  getByAltText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new BrowserLocator(nativePage.getByAltText(text, toNativeOptions(options)))
  }

  getByPlaceholder(text: string | RegExp, options?: LocatorOptions): Locator {
    return new BrowserLocator(nativePage.getByPlaceholder(text, toNativeOptions(options)))
  }

  getByText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new BrowserLocator(nativePage.getByText(text, toNativeOptions(options)))
  }

  getByTitle(text: string | RegExp, options?: LocatorOptions): Locator {
    return new BrowserLocator(nativePage.getByTitle(text, toNativeOptions(options)))
  }

  getByTestId(testId: string | RegExp): Locator {
    return new BrowserLocator(nativePage.getByTestId(testId))
  }
}

/**
 * The page object for browser mode.
 * We export the native page directly (not wrapped) for backward compatibility
 * with Vitest's expect.element() which expects native Locator instances.
 *
 * The BrowserPage class is kept for future use when tests migrate to the
 * abstraction layer (US-010+).
 */


/**
 * Export the BrowserLocator class for instanceof checks
 */
export { BrowserLocator }

// Kept for future use but not exported as default page
const _wrappedPage: Page = new BrowserPage()
void _wrappedPage

export { userEvent, page } from 'vitest/browser'