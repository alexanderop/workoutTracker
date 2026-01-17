/**
 * Happy-DOM Render Implementation
 *
 * This module provides the Happy-DOM implementation of the render abstraction.
 * It wraps @testing-library/vue's render function, providing a unified API.
 *
 * Usage:
 * - Import `render` from this module instead of `@testing-library/vue`
 * - All render options work identically to @testing-library/vue
 */

import { render as nativeRender, screen } from '@testing-library/vue'
import type { Component } from 'vue'
import { HappyDomLocator } from '../locator/happy-dom'
import type {
  Locator,
  ARIARole,
  LocatorOptions,
  LocatorByRoleOptions,
} from '../locator/types'
import type { RenderResult, RenderOptions } from './types'

/**
 * Native render result type from @testing-library/vue
 */
type NativeRenderResult = ReturnType<typeof nativeRender>

/**
 * Type guard to check if a value is an HTMLElement
 */
function isHTMLElement(value: unknown): value is HTMLElement {
  return value instanceof HTMLElement
}

/**
 * Safely cast array of Elements to HTMLElement array using filter
 */
function toHTMLElements(elements: Array<Element>): Array<HTMLElement> {
  return elements.filter(isHTMLElement)
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
 * Apply filters to elements
 */
function applyFilters(elements: Array<HTMLElement>, options?: LocatorOptions): Array<HTMLElement> {
  return filterByText(elements, options)
}

/**
 * Happy-DOM implementation of RenderResult
 * Wraps the native @testing-library/vue render result
 */
class HappyDomRenderResult implements RenderResult {
  private readonly native: NativeRenderResult
  private readonly _container: HTMLElement

  constructor(native: NativeRenderResult, container: HTMLElement) {
    this.native = native
    this._container = container
  }

  get container(): HTMLElement {
    return this._container
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
    return this.native.emitted()[eventName]
  }

  async rerender(props: Record<string, unknown>): Promise<void> {
    await this.native.rerender(props)
  }

  // ─── Query Methods (use screen queries, wrap in HappyDomLocator) ───────────

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
 * Get HTMLElement from Element, using type guard
 */
function ensureHTMLElement(element: Element): HTMLElement {
  if (isHTMLElement(element)) {
    return element
  }
  // In Happy-DOM, container is always a div which is an HTMLElement
  // This fallback creates a wrapper if somehow that's not the case
  const wrapper = document.createElement('div')
  wrapper.append(element)
  return wrapper
}

/**
 * Render a Vue component in Happy-DOM mode.
 * Wraps @testing-library/vue's render function with the abstraction layer.
 *
 * @param component - The Vue component to render
 * @param options - Render options (props, global plugins, etc.)
 * @returns A RenderResult with unified query methods and cleanup
 */
export function render(
  component: Component,
  options?: RenderOptions,
): RenderResult {
  const nativeResult = nativeRender(component, {
    props: options?.props,
    global: options?.global,
  })

  const container = ensureHTMLElement(nativeResult.container)
  return new HappyDomRenderResult(nativeResult, container)
}
