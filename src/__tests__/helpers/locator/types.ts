/**
 * Locator Abstraction Types
 *
 * This module defines a Locator interface that matches the Vitest browser API,
 * allowing tests to run in both browser mode (Playwright) and Happy-DOM.
 *
 * The interface is designed to be a subset of Vitest's Locator that covers
 * the functionality actually used in this codebase.
 */

/**
 * ARIA Role types for accessibility queries
 * Based on WAI-ARIA 1.2 specification
 */
export type ARIARole =
  // Widget roles
  | 'button'
  | 'checkbox'
  | 'gridcell'
  | 'link'
  | 'menuitem'
  | 'menuitemcheckbox'
  | 'menuitemradio'
  | 'option'
  | 'progressbar'
  | 'radio'
  | 'scrollbar'
  | 'searchbox'
  | 'slider'
  | 'spinbutton'
  | 'switch'
  | 'tab'
  | 'tabpanel'
  | 'textbox'
  | 'treeitem'
  // Composite widget roles
  | 'combobox'
  | 'grid'
  | 'listbox'
  | 'menu'
  | 'menubar'
  | 'radiogroup'
  | 'tablist'
  | 'tree'
  | 'treegrid'
  // Document structure roles
  | 'application'
  | 'article'
  | 'blockquote'
  | 'caption'
  | 'cell'
  | 'columnheader'
  | 'definition'
  | 'deletion'
  | 'directory'
  | 'document'
  | 'emphasis'
  | 'feed'
  | 'figure'
  | 'generic'
  | 'group'
  | 'heading'
  | 'img'
  | 'insertion'
  | 'list'
  | 'listitem'
  | 'math'
  | 'meter'
  | 'none'
  | 'note'
  | 'paragraph'
  | 'presentation'
  | 'row'
  | 'rowgroup'
  | 'rowheader'
  | 'separator'
  | 'strong'
  | 'subscript'
  | 'superscript'
  | 'table'
  | 'term'
  | 'time'
  | 'toolbar'
  | 'tooltip'
  // Landmark roles
  | 'banner'
  | 'complementary'
  | 'contentinfo'
  | 'form'
  | 'main'
  | 'navigation'
  | 'region'
  | 'search'
  // Live region roles
  | 'alert'
  | 'log'
  | 'marquee'
  | 'status'
  | 'timer'
  // Window roles
  | 'alertdialog'
  | 'dialog'
  // Uncategorized
  | 'code'

/**
 * Options for filtering locators
 */
export interface LocatorOptions {
  /**
   * Whether to find an exact match: case-sensitive and whole-string.
   * Ignored when locating by a regular expression.
   * @default false
   */
  exact?: boolean
  /**
   * Filter by text content
   */
  hasText?: string | RegExp
  /**
   * Exclude elements with text content
   */
  hasNotText?: string | RegExp
  /**
   * Filter by nested locator
   */
  has?: Locator
  /**
   * Exclude elements with nested locator
   */
  hasNot?: Locator
}

/**
 * Extended options for getByRole queries
 */
export interface LocatorByRoleOptions extends LocatorOptions {
  /**
   * Filter by checked state (aria-checked or input type="checkbox")
   */
  checked?: boolean
  /**
   * Filter by disabled state (aria-disabled)
   */
  disabled?: boolean
  /**
   * Filter by expanded state (aria-expanded)
   */
  expanded?: boolean
  /**
   * Include hidden elements
   * @default false
   */
  includeHidden?: boolean
  /**
   * Filter by aria-level (for headings, list items, etc.)
   */
  level?: number
  /**
   * Filter by accessible name
   */
  name?: string | RegExp
  /**
   * Filter by pressed state (aria-pressed)
   */
  pressed?: boolean
  /**
   * Filter by selected state (aria-selected)
   */
  selected?: boolean
}

/**
 * Options for click interactions
 */
export interface UserEventClickOptions {
  /**
   * Whether to force the action even if element is not visible
   */
  force?: boolean
}

/**
 * Options for fill interactions
 */
export interface UserEventFillOptions {
  /**
   * Whether to force the action even if element is not visible
   */
  force?: boolean
}

/**
 * Options for clear interactions
 */
export interface UserEventClearOptions {
  /**
   * Whether to force the action even if element is not visible
   */
  force?: boolean
}

/**
 * Options for hover interactions
 */
export interface UserEventHoverOptions {
  /**
   * Whether to force the action even if element is not visible
   */
  force?: boolean
}

/**
 * Options for selectOptions interactions
 */
export interface UserEventSelectOptions {
  /**
   * Whether to force the action even if element is not visible
   */
  force?: boolean
}

/**
 * Query methods available on both page and locator objects
 */
export interface LocatorSelectors {
  /**
   * Locate element by ARIA role
   * @see https://vitest.dev/api/browser/locators#getbyrole
   */
  getByRole(role: ARIARole | (string & {}), options?: LocatorByRoleOptions): Locator

  /**
   * Locate element by associated label text
   * @see https://vitest.dev/api/browser/locators#getbylabeltext
   */
  getByLabelText(text: string | RegExp, options?: LocatorOptions): Locator

  /**
   * Locate element by alt attribute
   * @see https://vitest.dev/api/browser/locators#getbyalttext
   */
  getByAltText(text: string | RegExp, options?: LocatorOptions): Locator

  /**
   * Locate element by placeholder attribute
   * @see https://vitest.dev/api/browser/locators#getbyplaceholder
   */
  getByPlaceholder(text: string | RegExp, options?: LocatorOptions): Locator

  /**
   * Locate element by text content
   * @see https://vitest.dev/api/browser/locators#getbytext
   */
  getByText(text: string | RegExp, options?: LocatorOptions): Locator

  /**
   * Locate element by title attribute
   * @see https://vitest.dev/api/browser/locators#getbytitle
   */
  getByTitle(text: string | RegExp, options?: LocatorOptions): Locator

  /**
   * Locate element by test id attribute
   * @see https://vitest.dev/api/browser/locators#getbytestid
   */
  getByTestId(testId: string | RegExp): Locator
}

/**
 * Locator interface for interacting with DOM elements
 *
 * This interface is designed to match the Vitest browser Locator API
 * while being implementable in both browser mode and Happy-DOM.
 */
export interface Locator extends LocatorSelectors {
  /**
   * The selector string used to locate the element
   */
  readonly selector: string

  // ─── Interaction Methods ───────────────────────────────────────────────

  /**
   * Click on the element
   */
  click(options?: UserEventClickOptions): Promise<void>

  /**
   * Double-click on the element
   */
  dblClick(options?: UserEventClickOptions): Promise<void>

  /**
   * Set the value of an input, textarea, or contenteditable element
   */
  fill(text: string, options?: UserEventFillOptions): Promise<void>

  /**
   * Clear the input element content
   */
  clear(options?: UserEventClearOptions): Promise<void>

  /**
   * Move cursor to the element
   */
  hover(options?: UserEventHoverOptions): Promise<void>

  /**
   * Select one or more options from a select element
   */
  selectOptions(
    values: HTMLElement | HTMLElement[] | Locator | Locator[] | string | string[],
    options?: UserEventSelectOptions
  ): Promise<void>

  // ─── Element Access ────────────────────────────────────────────────────

  /**
   * Returns the matching element, throws if none or multiple match
   */
  element(): HTMLElement | SVGElement

  /**
   * Returns all matching elements
   */
  elements(): (HTMLElement | SVGElement)[]

  /**
   * Returns the matching element or null if none match
   * Throws if multiple elements match
   */
  query(): HTMLElement | SVGElement | null

  // ─── Collection Methods ────────────────────────────────────────────────

  /**
   * Returns an array of locators for all matching elements
   */
  all(): Locator[]

  /**
   * Returns a locator for the nth matching element (0-indexed)
   */
  nth(index: number): Locator

  /**
   * Returns a locator for the first matching element
   */
  first(): Locator

  /**
   * Returns a locator for the last matching element
   */
  last(): Locator

  // ─── Chaining Methods ──────────────────────────────────────────────────

  /**
   * Returns a locator matching both this and the provided locator
   */
  and(locator: Locator): Locator

  /**
   * Returns a locator matching either this or the provided locator
   */
  or(locator: Locator): Locator

  /**
   * Filter the locator by additional options
   */
  filter(options: LocatorOptions): Locator
}

/**
 * Page object interface for the root-level query methods
 */
export interface Page extends LocatorSelectors {
  /**
   * Create a locator from a CSS selector string
   */
  locator(selector: string): Locator

  /**
   * Create a locator for an element
   */
  elementLocator(element: Element): Locator
}
