/**
 * Browser Mode Render Implementation
 *
 * This module provides the browser mode implementation of the render abstraction.
 * It wraps vitest-browser-vue's render function, providing a unified API.
 *
 * Usage:
 * - Import `render` from this module instead of `vitest-browser-vue`
 * - All render options work identically to vitest-browser-vue
 */

import { render as nativeRender } from 'vitest-browser-vue'
import type { Component } from 'vue'
import { BrowserLocator } from '../locator/browser'
import type {
  Locator,
  ARIARole,
  LocatorOptions,
  LocatorByRoleOptions,
} from '../locator/types'
import type { RenderResult, RenderOptions } from './types'

/**
 * Native render result type from vitest-browser-vue
 */
type NativeRenderResult = ReturnType<typeof nativeRender>

/**
 * Convert native LocatorByRoleOptions to abstraction format
 * (Options conversion is handled by BrowserLocator, this is for type compatibility)
 */
function toNativeByRoleOptions(
  options?: LocatorByRoleOptions,
): Parameters<NativeRenderResult['getByRole']>[1] {
  if (!options) {
    return undefined
  }
  return {
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
}

/**
 * Convert LocatorOptions to native format
 */
function toNativeOptions(
  options?: LocatorOptions,
): Parameters<NativeRenderResult['getByText']>[1] {
  if (!options) {
    return undefined
  }
  return {
    exact: options.exact,
    hasText: options.hasText,
    hasNotText: options.hasNotText,
  }
}

/**
 * Browser implementation of RenderResult
 * Wraps the native vitest-browser-vue render result
 */
class BrowserRenderResult implements RenderResult {
  private readonly native: NativeRenderResult

  constructor(native: NativeRenderResult) {
    this.native = native
  }

  get container(): HTMLElement {
    return this.native.container
  }

  unmount(): void {
    this.native.unmount()
  }

  emitted<T = unknown>(): Record<string, Array<T>>
  emitted<T = unknown[]>(eventName: string): Array<T> | undefined
  emitted(eventName?: string): Record<string, Array<unknown>> | Array<unknown> | undefined {
    if (eventName === undefined) {
      return this.native.emitted()
    }
    return this.native.emitted(eventName)
  }

  async rerender(props: Record<string, unknown>): Promise<void> {
    this.native.rerender(props)
  }

  // ─── Query Methods (delegate to native, wrap in BrowserLocator) ────────────

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
}

/**
 * Render a Vue component in browser mode.
 * Returns the native vitest-browser-vue render result directly for backward
 * compatibility with Vitest's expect.element() which expects native Locator instances.
 *
 * The BrowserRenderResult class is kept for future use when tests migrate to
 * the abstraction layer (US-010+).
 *
 * @param component - The Vue component to render
 * @param options - Render options (props, global plugins, etc.)
 * @returns The native render result
 */
export function render(
  component: Component,
  options?: RenderOptions,
): NativeRenderResult {
  return nativeRender(component, {
    props: options?.props,
    global: options?.global,
  })
}

// Keep BrowserRenderResult for future use but not used by default
void BrowserRenderResult
