import { page } from '../helpers/locator'
import { userEvent } from 'vitest/browser'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { expectElement, expectPoll } from '../helpers/assertions'
import { RouteNames } from '@/router'
import { createTestApp } from '../helpers/createTestApp'
import { cleanupIntegrationTest, setupIntegrationTest } from '../helpers/integrationSetup'

describe('AddBlockDialog - Time Block Icons and Colors', () => {
  beforeEach(setupIntegrationTest)
  afterEach(cleanupIntegrationTest)

  it('displays distinctive icons and colors for each timed block type', async () => {
    const { getByRole, common, navigateTo, cleanup } = await createTestApp()

    // Navigate to Create Template page
    await navigateTo({ name: RouteNames.CreateTemplate })
    await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

    // Open add block dialog
    await userEvent.click(getByRole('button', { name: /add/i }))
    await common.waitForDialog()

    // Switch to Timed Blocks tab (Zeitblöcke)
    await userEvent.click(getByRole('tab', { name: /timed/i }))

    // Define expected block configurations
    const expectedBlocks = [
      {
        name: 'AMRAP',
        iconClass: 'lucide-refresh-ccw',
        colorClass: 'text-purple-500',
      },
      {
        name: 'EMOM',
        iconClass: 'lucide-clock',
        colorClass: 'text-orange-500',
      },
      {
        name: 'Tabata',
        iconClass: 'lucide-zap',
        colorClass: 'text-emerald-500',
      },
      {
        name: 'For Time',
        iconClass: 'lucide-gauge',
        colorClass: 'text-rose-500',
      },
    ]

    // Verify each timed block has its distinctive icon and color
    for (const block of expectedBlocks) {
      // Find the block card by its title text
      const blockTitle = page.getByText(block.name, { exact: true })
      await expect.element(blockTitle).toBeVisible()

      // Get the card container (parent button element)
      const titleElement = await blockTitle.element()
      const cardButton = titleElement.closest('button')
      expect(cardButton).toBeTruthy()

      if (cardButton) {
        // Verify the icon is present with correct Lucide class
        // eslint-disable-next-line no-restricted-syntax -- Testing icon CSS class implementation
        const icon = cardButton.querySelector(`svg.${block.iconClass}`)
        expect(icon, `${block.name} should have ${block.iconClass} icon`).toBeTruthy()

        // Verify the title has the correct color class
        // eslint-disable-next-line no-restricted-syntax -- Testing color CSS class implementation
        const coloredTitle = cardButton.querySelector(`.${block.colorClass}`)
        expect(coloredTitle, `${block.name} should have ${block.colorClass} styling`).toBeTruthy()
      }
    }

    // Also verify Cardio block (which was already styled correctly)
    const cardioTitle = page.getByText('Cardio', { exact: true })
    await expect.element(cardioTitle).toBeVisible()

    const cardioElement = await cardioTitle.element()
    const cardioCard = cardioElement.closest('button')
    expect(cardioCard).toBeTruthy()

    if (cardioCard) {
      // eslint-disable-next-line no-restricted-syntax -- Testing icon CSS class implementation
      const cardioIcon = cardioCard.querySelector('svg.lucide-activity')
      expect(cardioIcon, 'Cardio should have lucide-activity icon').toBeTruthy()

      // eslint-disable-next-line no-restricted-syntax -- Testing color CSS class implementation
      const cardioColor = cardioCard.querySelector('.text-cyan-500')
      expect(cardioColor, 'Cardio should have text-cyan-500 styling').toBeTruthy()
    }

    cleanup()
  })

  it('each timed block card is clickable and opens configuration dialog', async () => {
    const { getByRole, common, navigateTo, cleanup } = await createTestApp()

    // Navigate to Create Template page
    await navigateTo({ name: RouteNames.CreateTemplate })
    await expect.element(page.getByRole('textbox', { name: /template name/i })).toBeVisible()

    // Open add block dialog
    await userEvent.click(getByRole('button', { name: /add/i }))
    await common.waitForDialog()

    // Switch to Timed Blocks tab
    await userEvent.click(getByRole('tab', { name: /timed/i }))

    // Click AMRAP block - should open configuration dialog
    await userEvent.click(page.getByText('AMRAP', { exact: true }))

    // Verify AMRAP configuration dialog opens (has "Add Block" button)
    await expect.element(page.getByRole('button', { name: /add block/i })).toBeVisible()

    cleanup()
  })
})
