/**
 * Locator Abstraction Layer
 *
 * This module provides a unified API for locating and interacting with DOM elements
 * that works in both browser mode (Playwright) and Happy-DOM environments.
 *
 * Environment detection:
 * - Browser mode: Uses vitest-browser-vue native page object and userEvent
 * - Happy-DOM: Uses @testing-library/vue screen queries and user-event
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

import type { Page } from './types'

/**
 * Detect if we're running in Vitest browser mode.
 * In browser mode, window.__vitest_browser__ is set by Vitest.
 */
const isBrowserMode =
  globalThis.window !== undefined && '__vitest_browser__' in globalThis

// Import the correct implementation based on environment
// Using conditional require to avoid loading browser-specific imports in happy-dom
// eslint-disable-next-line @typescript-eslint/no-require-imports
const impl = isBrowserMode ? require('./browser') : require('./happy-dom')

/**
 * Page object for querying elements.
 * Automatically uses the correct implementation based on environment.
 */
export const page: Page = impl.page

/**
 * User event for simulating user interactions.
 * Automatically uses the correct implementation based on environment.
 */
export const userEvent = impl.userEvent

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
