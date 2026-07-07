import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

/**
 * UX review finding M2: unmatched routes rendered a blank `<main>` with only
 * the bottom nav — no heading, no message, no way back except the nav bar.
 * `/benchmarks` (a plausible URL, since create/detail routes exist under that
 * prefix) and `/timers/emom/custom` both hit this. Fix: a catch-all
 * `/:pathMatch(.*)*` route renders a real "not found" view with a way home.
 */
describe('Not Found Route', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('shows a not-found view instead of a blank page for an unknown URL', async () => {
    const { navigateTo, router, cleanup } = await createTestApp()

    await navigateTo('/this-route-does-not-exist')

    await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.NotFound)
    await expect.element(page.getByRole('heading', { name: /not found/i })).toBeVisible()
    await expect.element(page.getByRole('button', { name: /go home/i })).toBeVisible()

    cleanup()
  })

  it('shows a not-found view for the plausible-but-missing /benchmarks list URL', async () => {
    const { navigateTo, router, cleanup } = await createTestApp()

    await navigateTo('/benchmarks')

    await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.NotFound)

    cleanup()
  })

  it('navigates home when the Go Home button is clicked', async () => {
    const { navigateTo, router, cleanup } = await createTestApp()

    await navigateTo('/timers/emom/custom')
    await expect.element(page.getByRole('button', { name: /go home/i })).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: /go home/i }))
    await expect.poll(() => router.currentRoute.value.name).toBe(RouteNames.Home)

    cleanup()
  })
})
