import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

/**
 * The "update available" banner in settings. The app polls /version.json and
 * compares the deployed commit against the built-in one; after a new deploy a
 * user visiting settings should be offered a refresh. The network response is
 * stubbed (only for /version.json) to simulate the newer deployment.
 */
function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input
  if (input instanceof URL) return input.href
  return input.url
}

describe('Settings — app update notice', () => {
  beforeEach(setupIntegrationTest)

  afterEach(async () => {
    await cleanupIntegrationTest()
    vi.restoreAllMocks()
  })

  it('shows the update banner when a newer version is deployed', async () => {
    const originalFetch = globalThis.fetch.bind(globalThis)
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
      if (requestUrl(input).includes('/version.json')) {
        const body = JSON.stringify({
          version: '99.0.0',
          tag: 'v99.0.0',
          commit: 'a-new-deploy-commit',
          buildTime: new Date().toISOString(),
        })
        return Promise.resolve(
          new Response(body, { status: 200, headers: { 'Content-Type': 'application/json' } }),
        )
      }
      return originalFetch(input, init)
    })

    const { common, cleanup } = await createTestApp()
    await common.navigateToSettings()

    await expect.element(page.getByText(/update available/i)).toBeVisible()
    await expect.element(page.getByText(/refresh to get the latest version/i)).toBeVisible()
    await expect.element(page.getByRole('button', { name: /refresh/i })).toBeVisible()

    cleanup()
  })
})
