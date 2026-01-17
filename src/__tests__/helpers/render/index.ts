/**
 * Render Abstraction Layer
 *
 * This module provides a unified API for rendering Vue components
 * that works in both browser mode (Playwright) and Happy-DOM environments.
 *
 * Environment detection:
 * - Browser mode: Uses vitest-browser-vue's render function
 * - Happy-DOM: Uses @testing-library/vue's render function
 *
 * Usage:
 * - Import `render` for rendering components
 * - Import `RenderResult` for type annotations
 *
 * @example
 * ```ts
 * import { render } from '@/__tests__/helpers/render'
 *
 * const screen = render(MyComponent, {
 *   props: { foo: 'bar' },
 *   global: { plugins: [router] }
 * })
 *
 * const button = screen.getByRole('button', { name: 'Submit' })
 * await button.click()
 *
 * screen.unmount()
 * ```
 */

import type { RenderFunction } from './types'

/**
 * Detect if we're running in Vitest browser mode.
 * In browser mode, window.__vitest_browser__ is set by Vitest.
 */
const isBrowserMode =
  globalThis.window !== undefined && '__vitest_browser__' in globalThis

// Use top-level await with dynamic import to load the correct implementation
// This works in ESM environments (both Node and browser)
const impl = isBrowserMode
  ? await import('./browser')
  : await import('./happy-dom')

/**
 * Render a Vue component.
 * Automatically uses the correct implementation based on environment.
 *
 * Note: In browser mode, this returns the native vitest-browser-vue result
 * for backward compatibility. The type is RenderFunction for API consistency.
 */
// eslint-disable-next-line @typescript-eslint/consistent-type-assertions
export const render: RenderFunction = impl.render as any

// Re-export types
export type {
  RenderResult,
  RenderOptions,
  RenderGlobalOptions,
  RenderFunction,
} from './types'
