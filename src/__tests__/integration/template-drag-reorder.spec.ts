import { page } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { seedTemplateAndOpenDetail } from '../helpers/templateHelpers'
import { createDbTemplateStrengthBlock as createDatabaseTemplateStrengthBlock } from '../factories'

/**
 * Gets all block cards in their current DOM order.
 * Finds cards by looking for the template block container with distinctive structure.
 */
function getBlockCards(): Array<HTMLElement> {
  // Find cards by their structure: rounded-xl with bg-muted/30 (template block items)
  // eslint-disable-next-line no-restricted-syntax -- Finding all block cards by class pattern
  const cards = document.querySelectorAll(String.raw`.rounded-xl.border.border-border\/50`)
  const result: Array<HTMLElement> = []
  for (const card of cards) {
    if (card instanceof HTMLElement) {
      result.push(card)
    }
  }
  return result
}

/**
 * Gets the drag handle within a block card.
 */
function getDragHandle(card: HTMLElement): HTMLElement {
  // eslint-disable-next-line no-restricted-syntax -- Finding drag handle within card scope
  const handle = card.querySelector('.drag-handle')
  if (!(handle instanceof HTMLElement)) {
    throw new TypeError(
      'Drag handle not found - template blocks should have drag handles for reordering',
    )
  }
  return handle
}

/**
 * Gets block names in their current DOM order.
 */
function getBlockNames(): Array<string> {
  const cards = getBlockCards()
  return cards.map((card) => {
    // Find the exercise name container (has flex-1 min-w-0), then get the name from within
    // eslint-disable-next-line no-restricted-syntax -- Extracting exercise name from card
    const nameContainer = card.querySelector('.flex-1.min-w-0')
    // eslint-disable-next-line no-restricted-syntax -- Extracting exercise name from container
    const nameElement = nameContainer?.querySelector('.font-semibold')
    return nameElement?.textContent?.trim() ?? ''
  })
}

/**
 * Note: Unlike workouts (which use a global singleton), templates create
 * a new composable instance per view. We can't easily access the view's
 * internal reorderBlocks function from tests.
 *
 * The reorder tests below verify the wiring is correct by checking:
 * 1. The drag handle exists and has correct styling
 * 2. The arrow buttons are removed
 * 3. The SortableJS integration is set up (handle class, container ref)
 *
 * Actual drag-and-drop behavior should be verified manually or through
 * E2E tests that can simulate real drag events.
 */

describe('Template Drag-and-Drop Reordering', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('drag handle visibility', () => {
    it('shows drag handle on each block for reordering', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed template with 2 exercises and open its detail page
      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-drag-handle-test',
        name: 'Drag Handle Test',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Exercise A', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Exercise B', equipment: 'barbell' }),
        ],
      })
      await expect.element(page.getByText('Exercise A')).toBeVisible()
      await expect.element(page.getByText('Exercise B')).toBeVisible()

      // Assert: Each block should have a visible drag handle
      const cards = getBlockCards()
      expect(cards.length).toBe(2)

      for (const card of cards) {
        const handle = getDragHandle(card)
        expect(handle).toBeTruthy()
        // Drag handle should have cursor-grab styling
        expect(handle.classList.contains('cursor-grab')).toBe(true)
      }

      cleanup()
    })

    it('does not show move up/down arrow buttons (replaced by drag)', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed template with 2 exercises and open its detail page
      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-no-arrows-test',
        name: 'No Arrows Test',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Exercise A', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Exercise B', equipment: 'barbell' }),
        ],
      })
      await expect.element(page.getByText('Exercise A')).toBeVisible()

      // Assert: Move up/down buttons should NOT exist
      await expect.element(page.getByRole('button', { name: /move up/i })).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /move down/i })).not.toBeInTheDocument()

      cleanup()
    })
  })

  describe('reordering blocks via drag', () => {
    // Note: These tests verify the SortableJS integration is wired up correctly.
    // Actual drag behavior can't be tested with synthetic events - use manual/E2E testing.

    it('has sortable container with correct structure', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed template with 2 exercises and open its detail page
      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-sortable-test',
        name: 'Sortable Structure Test',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Exercise A', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Exercise B', equipment: 'barbell' }),
        ],
      })
      await expect.element(page.getByText('Exercise A')).toBeVisible()

      // Verify the list container has the role="list" (used as sortable container)
      await expect.element(page.getByRole('list')).toBeVisible()

      // Verify each block has a drag handle that SortableJS can target
      const cards = getBlockCards()
      expect(cards.length).toBe(2)

      for (const card of cards) {
        const handle = getDragHandle(card)
        // The handle should have the .drag-handle class that SortableJS targets
        expect(handle.classList.contains('drag-handle')).toBe(true)
      }

      cleanup()
    })

    it('displays blocks in correct initial order', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed template with 3 exercises in specific order and open its detail page
      await seedTemplateAndOpenDetail(navigateTo, {
        id: 'tpl-order-test',
        name: 'Order Test',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'First Exercise', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Second Exercise', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Third Exercise', equipment: 'barbell' }),
        ],
      })
      await expect.element(page.getByText('First Exercise')).toBeVisible()

      // Verify blocks are displayed in correct order
      expect(getBlockNames()).toEqual(['First Exercise', 'Second Exercise', 'Third Exercise'])

      cleanup()
    })
  })
})
