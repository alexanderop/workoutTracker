import 'fake-indexeddb/auto'
import { vi } from 'vitest'
import { setupAudioContextMock } from './helpers/audioMock'

// Re-export resetDatabase for backwards compatibility
export { resetDatabase } from './helpers/resetDatabase'

// Setup AudioContext mock before any components are loaded
setupAudioContextMock()

/**
 * Mock window.matchMedia for PWA standalone detection and media queries in tests.
 * Required for useScreenWakeLock composable and VueUse's useMediaQuery.
 * Uses a regular function (not vi.fn()) so it survives vi.restoreAllMocks().
 */
window.matchMedia = (query: string): MediaQueryList => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => true,
})

/**
 * Mock HTMLMediaElement methods not implemented by jsdom.
 * Required for useScreenWakeLock fallback video element.
 * Uses configurable: true to allow test-specific overrides.
 */
Object.defineProperty(window.HTMLMediaElement.prototype, 'play', {
  configurable: true,
  writable: true,
  value: vi.fn().mockResolvedValue(undefined),
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'pause', {
  configurable: true,
  writable: true,
  value: vi.fn(),
})

Object.defineProperty(window.HTMLMediaElement.prototype, 'load', {
  configurable: true,
  writable: true,
  value: vi.fn(),
})

