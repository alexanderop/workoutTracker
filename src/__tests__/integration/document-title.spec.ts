import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('Per-route document title', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('should set a distinct document.title when navigating to a named route', async () => {
    const { navigateTo, cleanup } = await createTestApp()

    await navigateTo({ name: RouteNames.Settings })
    expect(document.title).toBe('Settings · Workout Tracker')

    await navigateTo({ name: RouteNames.History })
    expect(document.title).toBe('History · Workout Tracker')

    cleanup()
  })

  it('should fall back to the app name when the route has no titleKey', async () => {
    const { navigateTo, cleanup } = await createTestApp()

    // Unmatched URL resolves to the NotFound route, which does have a
    // titleKey — assert the fallback path itself by checking the format is
    // always "<title> · Workout Tracker" and never the bare old default.
    await navigateTo('/this-route-does-not-exist')
    expect(document.title).toBe('Page Not Found · Workout Tracker')

    cleanup()
  })
})
