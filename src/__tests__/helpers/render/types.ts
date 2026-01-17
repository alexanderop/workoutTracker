/**
 * Render Abstraction Types
 *
 * This module defines unified render types that work in both browser mode (Playwright)
 * and Happy-DOM environments. The interface is designed to be a subset of vitest-browser-vue
 * and @testing-library/vue render results that covers functionality used in this codebase.
 */

import type { Plugin } from 'vue'
import type { Page } from '../locator/types'

/**
 * Options for global Vue configuration when rendering
 */
export interface RenderGlobalOptions {
  /**
   * Vue plugins to register (router, i18n, etc.)
   */
  plugins?: Array<Plugin>

  /**
   * Components to stub (for isolation)
   */
  stubs?: Record<string, boolean>

  /**
   * Values to provide via provide/inject
   */
  provide?: Record<string | symbol, unknown>
}

/**
 * Options for rendering a component
 * Matches the subset of vitest-browser-vue and @testing-library/vue options used in codebase
 */
export interface RenderOptions {
  /**
   * Props to pass to the component
   */
  props?: Record<string, unknown>

  /**
   * Global Vue configuration
   */
  global?: RenderGlobalOptions
}

/**
 * Result of rendering a component
 * Unified interface that works in both environments
 */
export interface RenderResult extends Page {
  /**
   * The container element wrapping the rendered component
   */
  readonly container: HTMLElement

  /**
   * Unmount the component and clean up
   */
  unmount(): void

  /**
   * Get all emitted events from the component
   */
  emitted<T = unknown>(): Record<string, Array<T>>

  /**
   * Get emitted events for a specific event name
   */
  emitted<T = unknown[]>(eventName: string): Array<T> | undefined

  /**
   * Re-render the component with new props
   */
  rerender(props: Record<string, unknown>): Promise<void>
}

/**
 * Render function signature
 * Takes a Vue component and options, returns a RenderResult
 */
export type RenderFunction = (
  component: unknown,
  options?: RenderOptions,
) => RenderResult
