/**
 * Helper to mock window.matchMedia for touch device simulation.
 *
 * In Vitest browser mode, vi.mock() doesn't work for module mocking due to
 * ESM sealing. Instead, we mock window.matchMedia which is what VueUse's
 * useMediaQuery uses internally.
 *
 * This makes `useMediaQuery('(pointer: coarse)')` return true, simulating
 * a touch device for tests that need NumericInputModal instead of NumberField.
 */

let originalMatchMedia: typeof window.matchMedia | null = null

/**
 * Mock window.matchMedia to simulate a touch device.
 * Must be called BEFORE createTestApp() so the component uses the mocked value.
 */
export function mockTouchDevice(): void {
  originalMatchMedia = window.matchMedia

  window.matchMedia = (query: string): MediaQueryList => {
    // Return true for touch device queries
    const isTouchQuery = query === '(pointer: coarse)'

    return {
      matches: isTouchQuery,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }
  }
}

/**
 * Restore the original window.matchMedia.
 * Should be called in afterEach to clean up.
 */
export function restoreMatchMedia(): void {
  if (originalMatchMedia) {
    window.matchMedia = originalMatchMedia
    originalMatchMedia = null
  }
}
