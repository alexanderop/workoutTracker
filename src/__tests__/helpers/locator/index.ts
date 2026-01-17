/**
 * Locator Abstraction Layer
 *
 * This module provides a unified API for locating and interacting with DOM elements
 * that works in both browser mode (Playwright) and Happy-DOM environments.
 *
 * Usage:
 * - Import `page` for querying elements
 * - Import `userEvent` for user interactions
 * - Import type `Locator` and `Page` for type annotations
 *
 * @example
 * ```ts
 * import { page, userEvent, type Locator } from '@/__tests__/helpers/locator'
 *
 * const button = page.getByRole('button', { name: 'Submit' })
 * await button.click()
 * ```
 */

// Re-export from browser implementation (will be swapped for happy-dom in that environment)
export { page, userEvent, BrowserLocator } from './browser'

// Re-export types
export type {
  Locator,
  Page,
  ARIARole,
  LocatorOptions,
  LocatorByRoleOptions,
  LocatorSelectors,
  UserEventClickOptions,
  UserEventFillOptions,
  UserEventClearOptions,
  UserEventHoverOptions,
  UserEventSelectOptions,
} from './types'
