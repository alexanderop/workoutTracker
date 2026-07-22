/**
 * Mobile condensed-search mode for the "Add to Workout" sheet.
 *
 * UX finding: on a phone, opening the on-screen keyboard leaves the bottom
 * sheet only a few hundred pixels. The sheet's chrome — title, description,
 * tabs, two filter rows, and the pinned "Create Custom Exercise" footer —
 * consumed nearly all of it, so a search for "Pull" showed a single result
 * row.
 *
 * Fix under test: while the user is actively searching (search input focused
 * or a query typed), the chrome collapses at mobile widths so the result list
 * gets the space. Active filter rows stay visible so the user can always see
 * why results are narrowed. When the search ends, the chrome returns (after a
 * short delay that protects in-flight taps from layout shift). Desktop
 * widths are unaffected.
 */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

/**
 * Failure-safe app teardown: tests may end with the sheet still open
 * (teleported dialog content), and unmounting that lazily from the NEXT
 * test's automatic cleanup crashes Vue's unmount. Register the handle here
 * so cleanup runs in afterEach even when an assertion fails mid-test.
 */
let cleanupApp: (() => void) | undefined

async function createApp() {
  const app = await createTestApp()
  cleanupApp = app.cleanup
  return app
}

describe('AddBlockDialog - condensed search mode on mobile', () => {
  beforeEach(async () => {
    await setupIntegrationTest()
    await page.viewport(390, 844)
  })

  afterEach(async () => {
    cleanupApp?.()
    cleanupApp = undefined
    await cleanupIntegrationTest()
  })

  it('collapses chrome while searching, stays collapsed while a query remains, and restores after clearing', async () => {
    const { builder } = await createApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    // Chrome is fully visible before the user starts searching.
    await expect.element(page.getByRole('tab', { name: /timed blocks/i })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Chest', exact: true })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Barbell', exact: true })).toBeVisible()

    // Start searching: focus alone must condense (this is when the keyboard
    // opens). Collapsed chrome is display:none, which drops out of the
    // accessibility tree entirely — assert absence via query(), not visibility.
    const searchInput = page.getByRole('textbox')
    await userEvent.click(searchInput)
    await expect.poll(() => page.getByRole('tab', { name: /timed blocks/i }).query()).toBeNull()
    await expect
      .poll(() => page.getByRole('button', { name: 'Chest', exact: true }).query())
      .toBeNull()
    await expect
      .poll(() => page.getByRole('button', { name: 'Barbell', exact: true }).query())
      .toBeNull()

    // Results are still shown while condensed.
    await userEvent.fill(searchInput, 'Bench Press')
    await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()

    // The pinned create footer must not eat list space while condensed.
    await expect
      .poll(() => page.getByRole('button', { name: /create custom exercise/i }).query())
      .toBeNull()

    // Blur with the query still entered (e.g. keyboard dismissed): the
    // results are still narrowed, so the chrome must STAY collapsed — even
    // after the tap-protection delay has fully elapsed.
    vi.useFakeTimers()
    try {
      ;(await searchInput.element()).blur()
      await vi.advanceTimersByTimeAsync(500)
      expect(page.getByRole('tab', { name: /timed blocks/i }).query()).toBeNull()
      expect(page.getByRole('button', { name: 'Chest', exact: true }).query()).toBeNull()
    } finally {
      vi.useRealTimers()
    }

    // End the search for real: clear the query and blur. The chrome must
    // still be collapsed immediately — expanding right away would shift an
    // in-flight tap's target...
    await userEvent.fill(searchInput, '')
    ;(await searchInput.element()).blur()
    expect(page.getByRole('tab', { name: /timed blocks/i }).query()).toBeNull()
    expect(page.getByRole('button', { name: 'Chest', exact: true }).query()).toBeNull()

    // ...and returns once the tap-protection delay has elapsed. Browser
    // locators retry against the actual expanded DOM state.
    await expect.element(page.getByRole('tab', { name: /timed blocks/i })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Chest', exact: true })).toBeVisible()
  })

  it('adds the exercise when a result is tapped while condensed', async () => {
    const { builder, common } = await createApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    await userEvent.fill(page.getByRole('textbox'), 'Bench Press')
    await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()

    // Selecting the condensed result must complete the real flow: the sheet
    // closes and the never-silent confirmation toast appears.
    await userEvent.click(common.getDialogButton('Bench Press'))
    await common.waitForDialogClose()
    await expect.element(page.getByRole('status').getByText(/added bench press/i)).toBeVisible()
  })

  it('keeps an active filter row visible while condensed so narrowing stays transparent', async () => {
    const { builder } = await createApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    // Activate the Chest muscle filter and prove it took effect: chest
    // exercises remain while back exercises drop out of the list.
    await userEvent.click(page.getByRole('button', { name: 'Chest', exact: true }))
    await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()
    await expect.poll(() => page.getByText('Deadlift', { exact: true }).query()).toBeNull()

    // Start searching: the active muscle row stays; the inactive equipment
    // row collapses.
    await userEvent.click(page.getByRole('textbox'))
    await expect.element(page.getByRole('button', { name: 'Chest', exact: true })).toBeVisible()
    await expect
      .poll(() => page.getByRole('button', { name: 'Barbell', exact: true }).query())
      .toBeNull()
  })

  it('offers Create Custom Exercise inline when a condensed search has no results', async () => {
    const { builder } = await createApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    await userEvent.fill(page.getByRole('textbox'), 'Zzzz-no-such-exercise')
    await expect.element(page.getByText(/no.*found|no results/i)).toBeVisible()

    // Exactly one create action remains in the accessibility tree: the inline
    // one (the hidden footer drops out of the tree entirely).
    const createButtons = await page.getByRole('button', { name: /create custom exercise/i }).all()
    expect(createButtons).toHaveLength(1)
    await expect.element(createButtons[0]).toBeVisible()
  })
})

describe('AddBlockDialog - condensed search mode does not apply on desktop', () => {
  beforeEach(async () => {
    await setupIntegrationTest()
    await page.viewport(1280, 720)
  })

  afterEach(async () => {
    cleanupApp?.()
    cleanupApp = undefined
    await cleanupIntegrationTest()
  })

  it('keeps tabs, filters, and the create footer visible while searching at desktop width', async () => {
    const { builder } = await createApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    // Search actively — focus and a non-empty query — and verify the chrome
    // stays fully visible: collapsing is gated to mobile widths only.
    const searchInput = page.getByRole('textbox')
    await userEvent.click(searchInput)
    await userEvent.fill(searchInput, 'Bench Press')
    await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()

    await expect.element(page.getByRole('tab', { name: /timed blocks/i })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Chest', exact: true })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Barbell', exact: true })).toBeVisible()
    await expect
      .element(page.getByRole('button', { name: /create custom exercise/i }))
      .toBeVisible()
  })
})
