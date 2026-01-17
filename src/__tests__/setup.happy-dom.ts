import { faker } from '@faker-js/faker'
import 'fake-indexeddb/auto'
import '@/style.css'
import '@testing-library/jest-dom/vitest'

// Seed faker for reproducible randomization across test runs
faker.seed(12_345)

/**
 * Happy-DOM setup for fast local testing.
 * Provides polyfills for browser APIs not available in Happy-DOM.
 */

// Mock matchMedia for components using responsive design
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
})

// Mock IntersectionObserver for virtual scroll and lazy loading
class MockIntersectionObserver {
  readonly root: Element | null = null
  readonly rootMargin: string = ''
  readonly thresholds: ReadonlyArray<number> = []

  

  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
  takeRecords(): Array<IntersectionObserverEntry> {
    return []
  }
}

Object.defineProperty(globalThis, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
})

// Mock ResizeObserver for responsive components
class MockResizeObserver {
  

  observe(_target: Element): void {}
  unobserve(_target: Element): void {}
  disconnect(): void {}
}

Object.defineProperty(globalThis, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
})

// Re-export resetDatabase for backwards compatibility
export { resetDatabase } from './helpers/resetDatabase'
