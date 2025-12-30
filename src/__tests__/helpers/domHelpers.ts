/**
 * Type guard to ensure element is HTMLElement (not SVGElement).
 * Useful when Vitest Browser locators return HTMLElement | SVGElement
 * but you need to access HTMLElement-specific properties.
 * @throws Error if element is SVGElement
 */
export function ensureHTMLElement(element: HTMLElement | SVGElement): HTMLElement {
  if (!(element instanceof HTMLElement)) {
    throw new TypeError('Expected HTMLElement, got SVGElement')
  }
  return element
}
