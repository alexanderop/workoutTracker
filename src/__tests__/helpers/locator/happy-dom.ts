/**
 * Happy-DOM Locator Implementation
 *
 * This module provides the Happy-DOM implementation of the Locator abstraction.
 * It uses @testing-library/vue for queries and @testing-library/user-event for interactions.
 *
 * Usage:
 * - Import `page` from this module instead of `vitest/browser`
 * - All queries and interactions work identically to the browser API
 *
 * Note: This file uses querySelectorAll for scoped element queries within locators.
 * This is intentional - testing-library's screen queries are only used at the page level.
 */

/* eslint-disable no-restricted-syntax */

import { screen } from '@testing-library/vue'
import testingLibraryUserEvent from '@testing-library/user-event'
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

// Create a userEvent instance for all interactions
const user = testingLibraryUserEvent.setup()


/**
 * Type guard to check if a value is a HappyDomLocator
 */
function isHappyDomLocator(value: unknown): value is HappyDomLocator {
  return value instanceof HappyDomLocator
}

/**
 * Type guard to check if a value is an HTMLElement
 */
function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement
}

/**
 * Type guard to check if a value is an HTMLSelectElement
 */
function isHTMLSelectElement(value: unknown): value is HTMLSelectElement {
  return value instanceof HTMLSelectElement
}

/**
 * Type guard to check if a value is a string
 */
function isString(value: unknown): value is string {
  return typeof value === 'string'
}

/**
 * Convert LocatorByRoleOptions to testing-library format
 * Note: testing-library's getByRole doesn't support 'exact' option
 */
function toByRoleOptions(options?: LocatorByRoleOptions): Parameters<typeof screen.getByRole>[1] {
  if (!options) {
    return undefined
  }
  return {
    checked: options.checked,
    pressed: options.pressed,
    selected: options.selected,
    expanded: options.expanded,
    level: options.level,
    hidden: options.includeHidden,
    name: options.name,
  }
}

/**
 * Convert LocatorOptions to testing-library format
 */
function toQueryOptions(options?: LocatorOptions): { exact?: boolean } | undefined {
  if (!options) {
    return undefined
  }
  return {
    exact: options.exact,
  }
}

/**
 * Check if text matches a string or regex pattern
 */
function textMatches(text: string, pattern: string | RegExp, exact?: boolean): boolean {
  if (typeof pattern === 'string') {
    return exact ? text === pattern : text.includes(pattern)
  }
  return pattern.test(text)
}

/**
 * Filter elements based on hasText/hasNotText options
 */
function filterByText(elements: Array<HTMLElement>, options?: LocatorOptions): Array<HTMLElement> {
  if (!options) {
    return elements
  }

  return elements.filter((el) => {
    const text = el.textContent ?? ''

    if (options.hasText && !textMatches(text, options.hasText)) {
      return false
    }

    if (options.hasNotText && textMatches(text, options.hasNotText)) {
      return false
    }

    return true
  })
}

/**
 * Filter elements based on has/hasNot locator options
 */
function filterByLocator(elements: Array<HTMLElement>, options?: LocatorOptions): Array<HTMLElement> {
  if (!options) {
    return elements
  }

  return elements.filter((el) => {
    if (options.has && isHappyDomLocator(options.has)) {
      // Element must contain a match for the 'has' locator
      const hasMatch = options.has.queryWithin(el)
      if (!hasMatch) return false
    }

    if (options.hasNot && isHappyDomLocator(options.hasNot)) {
      // Element must NOT contain a match for the 'hasNot' locator
      const hasNotMatch = options.hasNot.queryWithin(el)
      if (hasNotMatch) return false
    }

    return true
  })
}

/**
 * Apply all filters to elements
 */
function applyFilters(elements: Array<HTMLElement>, options?: LocatorOptions): Array<HTMLElement> {
  let result = elements
  result = filterByText(result, options)
  result = filterByLocator(result, options)
  return result
}

/**
 * Safely cast array of Elements to HTMLElement array using filter
 */
function toHTMLElements(elements: Array<Element>): Array<HTMLElement> {
  return elements.filter(isHTMLElement)
}

/**
 * Extract HTMLElement from a locator's element() result
 */
function getHTMLElementFromLocator(locator: HappyDomLocator): HTMLElement {
  const el = locator.element()
  if (!isHTMLElement(el)) {
    throw new Error('Expected HTMLElement from locator')
  }
  return el
}

/**
 * Convert select values to user-event format
 */
function convertSelectValues(
  values: HTMLElement | HTMLElement[] | Locator | Locator[] | string | string[],
): HTMLElement | HTMLElement[] | string | string[] {
  // Handle single Locator
  if (isHappyDomLocator(values)) {
    return getHTMLElementFromLocator(values)
  }

  // Handle single HTMLElement
  if (isHTMLElement(values)) {
    return values
  }

  // Handle string
  if (isString(values)) {
    return values
  }

  // Handle arrays - need to process each element
  if (!Array.isArray(values)) {
    // This shouldn't happen given the type, but TypeScript needs it
    throw new TypeError('Unexpected value type for selectOptions')
  }

  return convertArrayValues(values)
}

/**
 * Convert array of select values
 */
function convertArrayValues(
  values: Array<HTMLElement | Locator | string>,
): HTMLElement[] | string[] {
  const firstValue = values[0]
  if (firstValue === undefined) {
    return []
  }

  // Check if array contains locators
  if (isHappyDomLocator(firstValue)) {
    return extractLocatorElements(values)
  }

  // Check if array contains HTMLElements
  if (isHTMLElement(firstValue)) {
    return extractHTMLElements(values)
  }

  // Must be strings
  if (isString(firstValue)) {
    return extractStrings(values)
  }

  throw new Error('Unexpected array element type for selectOptions')
}

function extractLocatorElements(values: Array<HTMLElement | Locator | string>): Array<HTMLElement> {
  const result: Array<HTMLElement> = []
  for (const v of values) {
    if (isHappyDomLocator(v)) {
      result.push(getHTMLElementFromLocator(v))
    }
  }
  return result
}

function extractHTMLElements(values: Array<HTMLElement | Locator | string>): Array<HTMLElement> {
  const result: Array<HTMLElement> = []
  for (const v of values) {
    if (isHTMLElement(v)) {
      result.push(v)
    }
  }
  return result
}

function extractStrings(values: Array<HTMLElement | Locator | string>): Array<string> {
  const result: Array<string> = []
  for (const v of values) {
    if (isString(v)) {
      result.push(v)
    }
  }
  return result
}

/**
 * Mapping of ARIA roles to their implicit HTML element selectors.
 * HTML elements have implicit ARIA roles that don't require explicit role attributes.
 * @see https://www.w3.org/TR/html-aria/#docconformance
 */
const IMPLICIT_ROLE_SELECTORS: Record<string, string> = {
  // Table roles
  table: 'table',
  row: 'tr',
  cell: 'td',
  columnheader: 'th',
  rowheader: 'th[scope="row"]',
  rowgroup: 'tbody, thead, tfoot',
  // Form roles
  button: 'button, input[type="button"], input[type="submit"], input[type="reset"], input[type="image"]',
  checkbox: 'input[type="checkbox"]',
  radio: 'input[type="radio"]',
  textbox: 'input:not([type]), input[type="text"], input[type="email"], input[type="tel"], input[type="url"], input[type="search"], input[type="password"], textarea',
  spinbutton: 'input[type="number"]',
  combobox: 'select:not([multiple]):not([size]), select[size="1"]',
  listbox: 'select[multiple], select[size]:not([size="1"])',
  slider: 'input[type="range"]',
  option: 'option',
  // Landmark roles
  main: 'main',
  navigation: 'nav',
  banner: 'header:not(article header, section header)',
  contentinfo: 'footer:not(article footer, section footer)',
  complementary: 'aside',
  form: 'form[aria-label], form[aria-labelledby], form[name]',
  region: 'section[aria-label], section[aria-labelledby]',
  search: 'search',
  // Document structure roles
  article: 'article',
  heading: 'h1, h2, h3, h4, h5, h6',
  list: 'ul, ol',
  listitem: 'li',
  link: 'a[href]',
  img: 'img[alt]:not([alt=""])',
  figure: 'figure',
  separator: 'hr',
  // Widget roles
  dialog: '[role="dialog"], dialog',
  tab: '[role="tab"]',
  tablist: '[role="tablist"]',
  tabpanel: '[role="tabpanel"]',
  menu: '[role="menu"]',
  menuitem: '[role="menuitem"]',
  menuitemcheckbox: '[role="menuitemcheckbox"]',
  menuitemradio: '[role="menuitemradio"]',
  progressbar: 'progress',
  status: 'output',
  alert: '[role="alert"]',
  alertdialog: '[role="alertdialog"]',
  tooltip: '[role="tooltip"]',
  tree: '[role="tree"]',
  treeitem: '[role="treeitem"]',
  grid: '[role="grid"]',
  gridcell: '[role="gridcell"]',
}

/**
 * Build a CSS selector for a given ARIA role that includes both explicit and implicit matches.
 */
function buildRoleSelector(role: string): string {
  const explicitSelector = `[role="${role}"]`
  const implicitSelector = IMPLICIT_ROLE_SELECTORS[role]

  if (implicitSelector) {
    return `${explicitSelector}, ${implicitSelector}`
  }
  return explicitSelector
}

/**
 * Get the accessible name from aria-labelledby attribute.
 */
function getNameFromLabelledBy(element: HTMLElement): string | null {
  const labelledBy = element.getAttribute('aria-labelledby')
  if (!labelledBy) return null

  const labelIds = labelledBy.split(/\s+/)
  const labelTexts: Array<string> = []
  for (const id of labelIds) {
    const labelElement = document.querySelector(`#${id}`)
    if (labelElement) {
      labelTexts.push(labelElement.textContent?.trim() ?? '')
    }
  }
  const combinedLabel = labelTexts.join(' ').trim()
  return combinedLabel || null
}

/**
 * Get the accessible name from associated label element.
 */
function getNameFromAssociatedLabel(element: HTMLElement): string | null {
  if (!(element instanceof HTMLInputElement || element instanceof HTMLTextAreaElement || element instanceof HTMLSelectElement)) {
    return null
  }
  const { id } = element
  if (!id) return null

  const label = document.querySelector<HTMLLabelElement>(`label[for="${id}"]`)
  return label?.textContent?.trim() ?? null
}

/**
 * Get the accessible name of an element.
 * Checks aria-label, aria-labelledby, and falls back to text content.
 * @see https://www.w3.org/TR/accname-1.1/
 */
function getAccessibleName(element: HTMLElement): string {
  // 1. Check aria-label attribute
  const ariaLabel = element.getAttribute('aria-label')
  if (ariaLabel) return ariaLabel.trim()

  // 2. Check aria-labelledby attribute
  const labelledByName = getNameFromLabelledBy(element)
  if (labelledByName) return labelledByName

  // 3. For form elements, check associated label
  const associatedLabel = getNameFromAssociatedLabel(element)
  if (associatedLabel) return associatedLabel

  // 4. Fall back to text content for buttons, links, etc.
  return element.textContent?.trim() ?? ''
}

/**
 * Filter elements by accessible name.
 */
function filterByAccessibleName(elements: Array<HTMLElement>, namePattern: string | RegExp | undefined): Array<HTMLElement> {
  if (namePattern === undefined) {
    return elements
  }

  return elements.filter((el) => {
    const accessibleName = getAccessibleName(el)
    return textMatches(accessibleName, namePattern)
  })
}

/**
 * Create a scoped query function for getByRole within parent elements
 */
function createScopedRoleQuery(
  parentQueryFn: () => Array<HTMLElement>,
  role: ARIARole | (string & {}),
  options?: LocatorByRoleOptions,
): () => Array<HTMLElement> {
  return () => {
    const parentElements = parentQueryFn()
    const results: Array<HTMLElement> = []
    const selector = buildRoleSelector(role)
    for (const parentEl of parentElements) {
      const els = parentEl.querySelectorAll<HTMLElement>(selector)
      for (const el of els) {
        results.push(el)
      }
    }
    // Filter by accessible name if provided
    const filteredByName = filterByAccessibleName(results, options?.name)
    return applyFilters(filteredByName, options)
  }
}

/**
 * Create a scoped query function for getByLabelText within parent elements
 */
function createScopedLabelTextQuery(
  parentQueryFn: () => Array<HTMLElement>,
  text: string | RegExp,
  options?: LocatorOptions,
): () => Array<HTMLElement> {
  return () => {
    const parentElements = parentQueryFn()
    const results: Array<HTMLElement> = []
    for (const parentEl of parentElements) {
      const labels = parentEl.querySelectorAll<HTMLLabelElement>('label')
      for (const label of labels) {
        const labelText = label.textContent ?? ''
        const matches = textMatches(labelText, text, options?.exact)
        if (matches && label.htmlFor) {
          const input = parentEl.querySelector<HTMLElement>(`#${label.htmlFor}`)
          if (input) results.push(input)
        }
      }
    }
    return applyFilters(results, options)
  }
}

/**
 * Create a scoped query function for getByAltText within parent elements
 */
function createScopedAltTextQuery(
  parentQueryFn: () => Array<HTMLElement>,
  text: string | RegExp,
  options?: LocatorOptions,
): () => Array<HTMLElement> {
  return () => {
    const parentElements = parentQueryFn()
    const results: Array<HTMLElement> = []
    for (const parentEl of parentElements) {
      const els = parentEl.querySelectorAll<HTMLElement>('[alt]')
      for (const el of els) {
        const altText = el.getAttribute('alt') ?? ''
        const matches = textMatches(altText, text, options?.exact)
        if (matches) results.push(el)
      }
    }
    return applyFilters(results, options)
  }
}

/**
 * Create a scoped query function for getByPlaceholder within parent elements
 */
function createScopedPlaceholderQuery(
  parentQueryFn: () => Array<HTMLElement>,
  text: string | RegExp,
  options?: LocatorOptions,
): () => Array<HTMLElement> {
  return () => {
    const parentElements = parentQueryFn()
    const results: Array<HTMLElement> = []
    for (const parentEl of parentElements) {
      const els = parentEl.querySelectorAll<HTMLElement>('[placeholder]')
      for (const el of els) {
        const placeholderText = el.getAttribute('placeholder') ?? ''
        const matches = textMatches(placeholderText, text, options?.exact)
        if (matches) results.push(el)
      }
    }
    return applyFilters(results, options)
  }
}

/**
 * Create a scoped query function for getByText within parent elements
 */
function createScopedTextQuery(
  parentQueryFn: () => Array<HTMLElement>,
  text: string | RegExp,
  options?: LocatorOptions,
): () => Array<HTMLElement> {
  return () => {
    const parentElements = parentQueryFn()
    const results: Array<HTMLElement> = []
    for (const parentEl of parentElements) {
      const walker = document.createTreeWalker(parentEl, NodeFilter.SHOW_TEXT)
      let node: Node | null
      while ((node = walker.nextNode())) {
        const nodeText = node.textContent ?? ''
        const textToMatch = options?.exact ? nodeText.trim() : nodeText
        const matches = textMatches(textToMatch, text, options?.exact)
        if (matches && node.parentElement) {
          results.push(node.parentElement)
        }
      }
    }
    return applyFilters(results, options)
  }
}

/**
 * Create a scoped query function for getByTitle within parent elements
 */
function createScopedTitleQuery(
  parentQueryFn: () => Array<HTMLElement>,
  text: string | RegExp,
  options?: LocatorOptions,
): () => Array<HTMLElement> {
  return () => {
    const parentElements = parentQueryFn()
    const results: Array<HTMLElement> = []
    for (const parentEl of parentElements) {
      const els = parentEl.querySelectorAll<HTMLElement>('[title]')
      for (const el of els) {
        const titleText = el.getAttribute('title') ?? ''
        const matches = textMatches(titleText, text, options?.exact)
        if (matches) results.push(el)
      }
    }
    return applyFilters(results, options)
  }
}

/**
 * Create a scoped query function for getByTestId within parent elements
 */
function createScopedTestIdQuery(
  parentQueryFn: () => Array<HTMLElement>,
  testId: string | RegExp,
): () => Array<HTMLElement> {
  return () => {
    const parentElements = parentQueryFn()
    const results: Array<HTMLElement> = []
    for (const parentEl of parentElements) {
      const els = parentEl.querySelectorAll<HTMLElement>('[data-testid]')
      for (const el of els) {
        const id = el.dataset.testid ?? ''
        const matches = typeof testId === 'string' ? id === testId : testId.test(id)
        if (matches) results.push(el)
      }
    }
    return results
  }
}

/**
 * Create an nth query function
 */
function createNthQuery(parentQueryFn: () => Array<HTMLElement>, index: number): () => Array<HTMLElement> {
  return () => {
    const elements = parentQueryFn()
    return elements[index] ? [elements[index]] : []
  }
}

/**
 * Create a last query function
 */
function createLastQuery(parentQueryFn: () => Array<HTMLElement>): () => Array<HTMLElement> {
  return () => {
    const elements = parentQueryFn()
    return elements.length > 0 ? [elements.at(-1)!] : []
  }
}

/**
 * Create an 'and' query function
 */
function createAndQuery(
  queryFn1: () => Array<HTMLElement>,
  queryFn2: () => Array<HTMLElement>,
): () => Array<HTMLElement> {
  return () => {
    const thisElements = new Set(queryFn1())
    const otherElements = queryFn2()
    return otherElements.filter((el) => thisElements.has(el))
  }
}

/**
 * Create an 'or' query function
 */
function createOrQuery(
  queryFn1: () => Array<HTMLElement>,
  queryFn2: () => Array<HTMLElement>,
): () => Array<HTMLElement> {
  return () => {
    const thisElements = queryFn1()
    const otherElements = queryFn2()
    const combined = new Map<HTMLElement, true>()
    for (const el of thisElements) combined.set(el, true)
    for (const el of otherElements) combined.set(el, true)
    return [...combined.keys()]
  }
}

/**
 * Create a filter query function
 */
function createFilterQuery(
  parentQueryFn: () => Array<HTMLElement>,
  options: LocatorOptions,
): () => Array<HTMLElement> {
  return () => {
    const elements = parentQueryFn()
    return applyFilters(elements, options)
  }
}

/**
 * Happy-DOM implementation of the Locator interface.
 * Uses @testing-library for queries and user-event for interactions.
 */
class HappyDomLocator implements Locator {
  private readonly queryFn: () => Array<HTMLElement>
  private readonly selectorStr: string

  constructor(queryFn: () => Array<HTMLElement>, selector: string) {
    this.queryFn = queryFn
    this.selectorStr = selector
  }

  get selector(): string {
    return this.selectorStr
  }

  /**
   * Query for elements within a specific container (used by has/hasNot)
   */
  queryWithin(container: HTMLElement): HTMLElement | null {
    const allElements = this.queryFn()
    return allElements.find((el) => container.contains(el)) ?? null
  }

  // ─── Query Methods ──────────────────────────────────────────────────────────

  getByRole(role: ARIARole | (string & {}), options?: LocatorByRoleOptions): Locator {
    return new HappyDomLocator(
      createScopedRoleQuery(this.queryFn, role, options),
      `${this.selectorStr} >> role=${role}`,
    )
  }

  getByLabelText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new HappyDomLocator(
      createScopedLabelTextQuery(this.queryFn, text, options),
      `${this.selectorStr} >> labelText=${String(text)}`,
    )
  }

  getByAltText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new HappyDomLocator(
      createScopedAltTextQuery(this.queryFn, text, options),
      `${this.selectorStr} >> altText=${String(text)}`,
    )
  }

  getByPlaceholder(text: string | RegExp, options?: LocatorOptions): Locator {
    return new HappyDomLocator(
      createScopedPlaceholderQuery(this.queryFn, text, options),
      `${this.selectorStr} >> placeholder=${String(text)}`,
    )
  }

  getByText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new HappyDomLocator(
      createScopedTextQuery(this.queryFn, text, options),
      `${this.selectorStr} >> text=${String(text)}`,
    )
  }

  getByTitle(text: string | RegExp, options?: LocatorOptions): Locator {
    return new HappyDomLocator(
      createScopedTitleQuery(this.queryFn, text, options),
      `${this.selectorStr} >> title=${String(text)}`,
    )
  }

  getByTestId(testId: string | RegExp): Locator {
    return new HappyDomLocator(
      createScopedTestIdQuery(this.queryFn, testId),
      `${this.selectorStr} >> testId=${String(testId)}`,
    )
  }

  // ─── Interaction Methods ────────────────────────────────────────────────────

  async click(_options?: UserEventClickOptions): Promise<void> {
    const el = this.element()
    await user.click(el)
  }

  async dblClick(_options?: UserEventClickOptions): Promise<void> {
    const el = this.element()
    await user.dblClick(el)
  }

  async fill(text: string, _options?: UserEventFillOptions): Promise<void> {
    const el = this.element()
    await user.clear(el)
    await user.type(el, text)
  }

  async clear(_options?: UserEventClearOptions): Promise<void> {
    const el = this.element()
    await user.clear(el)
  }

  async hover(_options?: UserEventHoverOptions): Promise<void> {
    const el = this.element()
    await user.hover(el)
  }

  async selectOptions(
    values: HTMLElement | HTMLElement[] | Locator | Locator[] | string | string[],
    _options?: UserEventSelectOptions,
  ): Promise<void> {
    const el = this.element()
    if (!isHTMLSelectElement(el)) {
      throw new Error('selectOptions can only be called on a <select> element')
    }

    const selectValues = convertSelectValues(values)
    await user.selectOptions(el, selectValues)
  }

  // ─── Element Access ─────────────────────────────────────────────────────────

  element(): HTMLElement | SVGElement {
    const elements = this.queryFn()
    if (elements.length === 0) {
      throw new Error(`No element found for selector: ${this.selectorStr}`)
    }
    if (elements.length > 1) {
      throw new Error(
        `Multiple elements (${elements.length}) found for selector: ${this.selectorStr}. Use nth(), first(), last(), or a more specific query.`,
      )
    }
    return elements[0]!
  }

  elements(): Array<HTMLElement | SVGElement> {
    return this.queryFn()
  }

  query(): HTMLElement | SVGElement | null {
    const elements = this.queryFn()
    if (elements.length === 0) {
      return null
    }
    if (elements.length > 1) {
      throw new Error(
        `Multiple elements (${elements.length}) found for selector: ${this.selectorStr}. Use nth(), first(), last(), or a more specific query.`,
      )
    }
    return elements[0]!
  }

  // ─── Collection Methods ─────────────────────────────────────────────────────

  all(): Array<Locator> {
    const elements = this.queryFn()
    const queryFnRef = this.queryFn
    const selectorBase = this.selectorStr
    return elements.map(
      (_el, index) =>
        new HappyDomLocator(
          createNthQuery(queryFnRef, index),
          `${selectorBase} >> nth=${index}`,
        ),
    )
  }

  nth(index: number): Locator {
    return new HappyDomLocator(
      createNthQuery(this.queryFn, index),
      `${this.selectorStr} >> nth=${index}`,
    )
  }

  first(): Locator {
    return this.nth(0)
  }

  last(): Locator {
    return new HappyDomLocator(
      createLastQuery(this.queryFn),
      `${this.selectorStr} >> last`,
    )
  }

  // ─── Chaining Methods ───────────────────────────────────────────────────────

  and(locator: Locator): Locator {
    if (!isHappyDomLocator(locator)) {
      throw new Error('and() requires a HappyDomLocator instance')
    }
    return new HappyDomLocator(
      createAndQuery(this.queryFn, locator.queryFn),
      `(${this.selectorStr}) AND (${locator.selector})`,
    )
  }

  or(locator: Locator): Locator {
    if (!isHappyDomLocator(locator)) {
      throw new Error('or() requires a HappyDomLocator instance')
    }
    return new HappyDomLocator(
      createOrQuery(this.queryFn, locator.queryFn),
      `(${this.selectorStr}) OR (${locator.selector})`,
    )
  }

  filter(options: LocatorOptions): Locator {
    return new HappyDomLocator(
      createFilterQuery(this.queryFn, options),
      `${this.selectorStr} >> filter`,
    )
  }
}

/**
 * Happy-DOM implementation of the Page interface.
 * Uses @testing-library/vue screen object for root queries.
 */
class HappyDomPage implements Page {
  // ─── Query Methods ──────────────────────────────────────────────────────────

  getByRole(role: ARIARole | (string & {}), options?: LocatorByRoleOptions): Locator {
    return new HappyDomLocator(() => {
      try {
        const els = screen.queryAllByRole(role, toByRoleOptions(options))
        return applyFilters(toHTMLElements(els), options)
      } catch {
        return []
      }
    }, `role=${role}${options?.name ? `[name=${String(options.name)}]` : ''}`)
  }

  getByLabelText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new HappyDomLocator(() => {
      try {
        const els = screen.queryAllByLabelText(text, toQueryOptions(options))
        return applyFilters(toHTMLElements(els), options)
      } catch {
        return []
      }
    }, `labelText=${String(text)}`)
  }

  getByAltText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new HappyDomLocator(() => {
      try {
        const els = screen.queryAllByAltText(text, toQueryOptions(options))
        return applyFilters(toHTMLElements(els), options)
      } catch {
        return []
      }
    }, `altText=${String(text)}`)
  }

  getByPlaceholder(text: string | RegExp, options?: LocatorOptions): Locator {
    return new HappyDomLocator(() => {
      try {
        const els = screen.queryAllByPlaceholderText(text, toQueryOptions(options))
        return applyFilters(toHTMLElements(els), options)
      } catch {
        return []
      }
    }, `placeholder=${String(text)}`)
  }

  getByText(text: string | RegExp, options?: LocatorOptions): Locator {
    return new HappyDomLocator(() => {
      try {
        const els = screen.queryAllByText(text, toQueryOptions(options))
        return applyFilters(toHTMLElements(els), options)
      } catch {
        return []
      }
    }, `text=${String(text)}`)
  }

  getByTitle(text: string | RegExp, options?: LocatorOptions): Locator {
    return new HappyDomLocator(() => {
      try {
        const els = screen.queryAllByTitle(text, toQueryOptions(options))
        return applyFilters(toHTMLElements(els), options)
      } catch {
        return []
      }
    }, `title=${String(text)}`)
  }

  getByTestId(testId: string | RegExp): Locator {
    return new HappyDomLocator(() => {
      try {
        const els = screen.queryAllByTestId(testId)
        return toHTMLElements(els)
      } catch {
        return []
      }
    }, `testId=${String(testId)}`)
  }
}

/**
 * The page object for Happy-DOM mode.
 * Drop-in replacement for `page` from browser mode.
 */
export const page: Page = new HappyDomPage()

/**
 * Export the HappyDomLocator class for instanceof checks
 */
export { HappyDomLocator }

/**
 * Wrapper around @testing-library/user-event that provides API compatibility
 * with vitest/browser's userEvent (which has `fill` instead of `type`).
 */
export const userEvent = {
  ...testingLibraryUserEvent,
  /**
   * Fill an input element with text. Clears existing content first.
   * Maps to testing-library's clear() + type() since it doesn't have fill().
   */
  async fill(element: Element, text: string): Promise<void> {
    await user.clear(element)
    await user.type(element, text)
  },
}