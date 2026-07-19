import { page, userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'
import { createDbTemplateStrengthBlock as createDatabaseTemplateStrengthBlock } from '../factories'
import { getTemplateById, seedTemplate } from '../helpers/dbAssertions'
import { ensureHTMLElement } from '../helpers/domHelpers'

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

describe('Template Drag-and-Drop Reordering', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  describe('drag handle visibility', () => {
    it('renders the sortable blocks in order with handles and no legacy arrow controls', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      // Seed template with 2 exercises
      const template = await seedTemplate({
        name: 'Drag Handle Test',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'Exercise A', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Exercise B', equipment: 'barbell' }),
        ],
      })

      // Navigate to template detail
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
      await expect.element(page.getByText('Exercise A')).toBeVisible()
      await expect.element(page.getByText('Exercise B')).toBeVisible()

      // Assert: Each block should have a visible drag handle
      const cards = getBlockCards()
      expect(cards).toHaveLength(2)

      for (const card of cards) {
        const handle = getDragHandle(card)
        expect(handle).toBeTruthy()
        // Drag handle should have cursor-grab styling
        expect(handle.classList.contains('cursor-grab')).toBe(true)
        expect(handle.classList.contains('drag-handle')).toBe(true)
      }

      // Assert: Move up/down buttons should NOT exist
      await expect.element(page.getByRole('button', { name: /move up/i })).not.toBeInTheDocument()
      await expect.element(page.getByRole('button', { name: /move down/i })).not.toBeInTheDocument()

      await expect.element(page.getByRole('list')).toBeVisible()
      expect(getBlockNames()).toEqual(['Exercise A', 'Exercise B'])

      cleanup()
    })
  })

  describe('reordering blocks via drag', () => {
    it('reorders three blocks with a real drag and persists the new order', async () => {
      const { navigateTo, cleanup } = await createTestApp()

      const template = await seedTemplate({
        name: 'Persisted Drag Order',
        blocks: [
          createDatabaseTemplateStrengthBlock({ name: 'First Exercise', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Second Exercise', equipment: 'barbell' }),
          createDatabaseTemplateStrengthBlock({ name: 'Third Exercise', equipment: 'barbell' }),
        ],
      })

      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
      await expect.element(page.getByText('First Exercise')).toBeVisible()

      const firstBlock = page.getByRole('group', { name: 'First Exercise' })
      const thirdBlock = page.getByRole('group', { name: 'Third Exercise' })
      const firstHandle = getDragHandle(ensureHTMLElement(await firstBlock.findElement()))

      await userEvent.dragAndDrop(firstHandle, thirdBlock)

      await expect
        .poll(getBlockNames)
        .toEqual(['Second Exercise', 'Third Exercise', 'First Exercise'])

      await page.getByRole('button', { name: /save changes/i }).click()
      await expect
        .poll(async () =>
          (await getTemplateById(template.id))?.blocks.map((block) =>
            block.kind === 'strength' ? block.name : block.kind,
          ),
        )
        .toEqual(['Second Exercise', 'Third Exercise', 'First Exercise'])

      await navigateTo({ name: RouteNames.Workouts })
      await navigateTo({ name: RouteNames.TemplateDetail, params: { id: template.id } })
      await expect
        .poll(getBlockNames)
        .toEqual(['Second Exercise', 'Third Exercise', 'First Exercise'])

      cleanup()
    })
  })
})
