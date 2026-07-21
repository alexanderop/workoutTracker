import { faker } from '@faker-js/faker'
import 'fake-indexeddb/auto'
import '@/style.css'
import 'vitest-browser-vue'
import './helpers/customMatchers'

// Seed faker for reproducible randomization across test runs
faker.seed(12_345)

/**
 * Browser mode setup - no mocks needed since real browser APIs are available.
 * Only fake-indexeddb is required since tests run in isolated contexts.
 * vitest-browser-vue provides page.render() for Vue component rendering.
 */

// Re-export resetDatabase for backwards compatibility
export { resetDatabase } from './helpers/resetDatabase'
