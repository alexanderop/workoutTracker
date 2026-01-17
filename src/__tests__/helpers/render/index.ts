/**
 * Render Abstraction Layer
 *
 * This module provides a unified API for rendering Vue components
 * that works in both browser mode (Playwright) and Happy-DOM environments.
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

// Re-export from browser implementation (will be swapped for happy-dom in that environment)
export { render } from './browser'

// Re-export types
export type {
  RenderResult,
  RenderOptions,
  RenderGlobalOptions,
  RenderFunction,
} from './types'
