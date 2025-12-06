import 'fake-indexeddb/auto'
import '@/style.css'

/**
 * Browser mode setup - no mocks needed since real browser APIs are available.
 * Only fake-indexeddb is required since tests run in isolated contexts.
 */

// Re-export resetDatabase from shared module
export { resetDatabase } from '../helpers/resetDatabase'
