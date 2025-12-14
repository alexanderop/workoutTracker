/**
 * Type guard to ensure element is HTMLElement (not SVGElement).
 * Useful when Vitest Browser locators return HTMLElement | SVGElement
 * but you need to access HTMLElement-specific properties.
 * @throws Error if element is SVGElement
 */
export function ensureHTMLElement(el: HTMLElement | SVGElement): HTMLElement {
  if (!(el instanceof HTMLElement)) {
    throw new Error('Expected HTMLElement, got SVGElement')
  }
  return el
}
