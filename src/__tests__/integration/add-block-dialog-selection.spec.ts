/**
 * Regression coverage for a Critical UX finding:
 *
 * "Tapping an exercise in the unfiltered 'Add to Workout' list silently fails."
 * Reproduced at a 390x844 mobile viewport: opening the add-block sheet and
 * tapping an exercise directly in the full alphabetical list closed the sheet
 * without adding anything and with no feedback. Searching first and then
 * tapping the same item always worked.
 *
 * Root cause (see brain/reference/reviews for the full writeup): the exercise
 * search input in the sheet used the native `autofocus` attribute
 * unconditionally. On a touch device this pops the on-screen keyboard the
 * instant the sheet opens, resizing the viewport while the very first tap
 * (before the user has interacted with anything else) is in flight -- the
 * list item under the finger can move or the tap coordinates can miss their
 * target entirely. Searching first means the keyboard is already open and
 * the layout has already settled by the time the user taps a result, which
 * is why that path "always worked".
 *
 * This suite intentionally does not simulate the mobile virtual-keyboard
 * viewport reflow itself, since headless Chromium (no real IME) does not
 * reproduce that reflow regardless of viewport size or touch emulation. The
 * tests below instead cover:
 *   1. The concrete code-level fix: the search input must not carry the
 *      native `autofocus` attribute on touch devices.
 *   2. A "never-silent" guarantee: selecting an exercise always shows a
 *      confirmation toast, so even if a tap ever *did* land on the wrong
 *      target, the user has explicit feedback either way.
 *   3. A regression check exercising the exact QA repro steps (mobile
 *      viewport, scroll the unfiltered list, tap without searching) to
 *      guard the underlying add-to-workout mechanism going forward.
 */
import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { mockTouchDevice, restoreMatchMedia } from '../helpers/mockTouchDevice'
import { ensureHTMLElement } from '../helpers/domHelpers'

describe('AddBlockDialog - exercise selection reliability', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('should show an "Added <exercise>" confirmation toast when an exercise is selected from the unfiltered list', async () => {
    const { builder, common, cleanup } = await createTestApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    // Select directly from the full alphabetical list -- no search first,
    // matching the exact QA repro steps for this finding.
    await userEvent.click(common.getDialogButton('Bench Press'))
    await common.waitForDialogClose()

    // Never-silent guarantee: a confirmation toast must appear regardless of
    // whether the tap landed correctly, so the user always gets feedback.
    await expect.element(page.getByRole('status').getByText(/added bench press/i)).toBeVisible()

    cleanup()
  })

  it('should add the exercise to the workout when tapping it directly in the unfiltered list at a mobile viewport', async () => {
    await page.viewport(390, 844)

    const { builder, common, cleanup } = await createTestApp()

    await builder.navigateTo()
    await builder.openAddBlockDialog()

    // Mirror the QA repro: scroll the long unfiltered list before tapping.
    const dialog = page.getByRole('dialog').query()
    if (!dialog) throw new Error('Add block dialog not found')
    // eslint-disable-next-line no-restricted-syntax -- scoped scroll-container lookup, no accessible equivalent
    const list = ensureHTMLElement(dialog).querySelector('.overflow-y-auto')
    if (list) {
      list.scrollTop = 200
      list.dispatchEvent(new Event('scroll', { bubbles: true }))
    }

    // Tap the exercise directly in the full alphabetical list -- no search.
    await userEvent.click(common.getDialogButton('Bench Press'))
    await common.waitForDialogClose()

    // Verify the block was actually added: starting the workout should now
    // show the sets table (which only renders once at least one block exists).
    await builder.startWorkout()
    await expect.element(page.getByRole('table')).toBeVisible()

    cleanup()
  })

  describe('on touch devices', () => {
    beforeEach(mockTouchDevice)
    afterEach(restoreMatchMedia)

    it('should not autofocus the exercise search input, avoiding the on-screen-keyboard reflow race that swallows the first tap', async () => {
      const { builder, cleanup } = await createTestApp()

      await builder.navigateTo()
      await builder.openAddBlockDialog()

      const searchInput = await page.getByRole('textbox').element()

      expect(document.activeElement).not.toBe(searchInput)

      cleanup()
    })
  })
})
