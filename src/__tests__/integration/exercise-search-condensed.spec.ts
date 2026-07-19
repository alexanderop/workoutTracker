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
 * short delay that protects in-flight taps from layout shift).
 */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('AddBlockDialog - condensed search mode on mobile', () => {
  beforeEach(async () => {
    await setupIntegrationTest()
    await page.viewport(390, 844)
  })

  afterEach(cleanupIntegrationTest)

  it('collapses tabs, header, and inactive filter rows while searching, and restores them after', async () => {
    const { builder, cleanup } = await createTestApp()

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

    // Results are still shown and selectable while condensed.
    await userEvent.fill(searchInput, 'Bench Press')
    await expect.element(page.getByText('Bench Press', { exact: true })).toBeVisible()

    // The pinned create footer must not eat list space while condensed.
    await expect
      .poll(() => page.getByRole('button', { name: /create custom exercise/i }).query())
      .toBeNull()

    // End the search: clear the query and blur. Chrome returns (after the
    // tap-protection delay, covered by expect.element's auto-retry).
    await userEvent.fill(searchInput, '')
    ;(await searchInput.element()).blur()
    await expect.element(page.getByRole('tab', { name: /timed blocks/i })).toBeVisible()
    await expect.element(page.getByRole('button', { name: 'Chest', exact: true })).toBeVisible()

    cleanup()
  })

  it('keeps an active filter row visible while condensed so narrowing stays transparent', async () => {
    const { builder, cleanup } = await createTestApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    // Activate a muscle filter, then start searching.
    await userEvent.click(page.getByRole('button', { name: 'Chest', exact: true }))
    await userEvent.click(page.getByRole('textbox'))

    // The active muscle row stays; the inactive equipment row collapses.
    await expect.element(page.getByRole('button', { name: 'Chest', exact: true })).toBeVisible()
    await expect
      .poll(() => page.getByRole('button', { name: 'Barbell', exact: true }).query())
      .toBeNull()

    cleanup()
  })

  it('offers Create Custom Exercise inline when a condensed search has no results', async () => {
    const { builder, cleanup } = await createTestApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    await userEvent.fill(page.getByRole('textbox'), 'Zzzz-no-such-exercise')
    await expect.element(page.getByText(/no.*found|no results/i)).toBeVisible()

    // Exactly one create action remains in the accessibility tree: the inline
    // one (the hidden footer drops out of the tree entirely).
    const createButtons = await page.getByRole('button', { name: /create custom exercise/i }).all()
    expect(createButtons).toHaveLength(1)
    expect((await createButtons[0].element()).checkVisibility()).toBe(true)

    cleanup()
  })
})
