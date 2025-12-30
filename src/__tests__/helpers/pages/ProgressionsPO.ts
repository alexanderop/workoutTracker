import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'

/**
 * Page Object for the Progressions feature.
 * Provides methods to create, view, and interact with progressions.
 */
export class ProgressionsPO {
  constructor(private common: CommonPO) {}

  /**
   * Navigates to the progressions tab from the workouts view.
   */
  async navigateToTab(): Promise<void> {
    await this.common.navigateToWorkouts()
    const progressionsTab = page.getByRole('tab', { name: /progressions/i })
    await expect.element(progressionsTab).toBeVisible()
    await progressionsTab.click()
  }

  /**
   * Clicks the "Create Progression" button.
   */
  async clickCreateProgression(): Promise<void> {
    await page.getByRole('button', { name: /create progression/i }).click()
  }

  /**
   * Fills the progression name input.
   */
  async fillName(name: string): Promise<void> {
    const input = page.getByRole('textbox')
    await userEvent.fill(input, name)
  }

  /**
   * Toggles a kettlebell weight selection.
   */
  async toggleWeight(weight: number): Promise<void> {
    await page.getByRole('button', { name: `${weight}kg` }).click()
  }

  /**
   * Clicks the save button.
   */
  async clickSave(): Promise<void> {
    await page.getByRole('button', { name: /save/i }).click()
  }

  /**
   * Clicks a progression card by name.
   */
  async clickProgressionCard(name: string): Promise<void> {
    await page.getByText(name).first().click()
  }

  /**
   * Clicks the "Start Session" button on the detail view.
   */
  async clickStartSession(): Promise<void> {
    await page.getByRole('button', { name: /start session/i }).click()
  }

  /**
   * Clicks the play button to start the EMOM timer.
   */
  async clickPlayButton(): Promise<void> {
    // Find the button with play icon (circular button)
    const buttons = await page.getByRole('button').all()
    for (const btn of buttons) {
      const el = await btn.element()
      if (el.classList.contains('rounded-full')) {
        await btn.click()
        return
      }
    }
  }

  /**
   * Clicks "Yes, completed!" in the completion dialog.
   */
  async confirmSessionCompleted(): Promise<void> {
    await this.common.waitForDialog()
    await page.getByRole('button', { name: /yes, completed/i }).click()
  }

  /**
   * Clicks "No, missed some" in the completion dialog.
   */
  async confirmSessionFailed(): Promise<void> {
    await this.common.waitForDialog()
    await page.getByRole('button', { name: /no, missed/i }).click()
  }

  /**
   * Clicks the delete button on the detail view.
   */
  async clickDelete(): Promise<void> {
    // Find the delete button (trash icon in header)
    const buttons = await page.getByRole('button').all()
    for (const btn of buttons) {
      const el = await btn.element()
      // eslint-disable-next-line no-restricted-syntax -- Finding icon by CSS class, no accessible equivalent
      if (el.querySelector('[class*="lucide-trash"]') || el.innerHTML.includes('Trash')) {
        await btn.click()
        return
      }
    }
    // Fallback: click by aria or visible text
    await page.getByRole('button', { name: /delete/i }).click()
  }

  /**
   * Confirms deletion in the delete dialog.
   */
  async confirmDelete(): Promise<void> {
    await this.common.waitForDialog()
    await page.getByRole('button', { name: /^delete$/i }).click()
  }

  /**
   * Asserts the empty state is displayed.
   */
  async assertEmptyState(): Promise<void> {
    await expect.element(page.getByText(/no progressions yet/i)).toBeInTheDocument()
  }

  /**
   * Asserts a progression exists in the list.
   */
  async assertProgressionExists(name: string): Promise<void> {
    await expect.element(page.getByText(name).first()).toBeVisible()
  }

  /**
   * Asserts the current level display on detail view.
   * Waits for the level text to appear (handles async data loading).
   */
  async assertCurrentLevel(weight: number, reps: number, minutes: number): Promise<void> {
    const levelText = `${weight}kg • ${reps} reps • ${minutes} min`
    await expect.element(page.getByText(levelText), { timeout: 5000 }).toBeVisible()
  }

  /**
   * Asserts sessions completed count.
   */
  async assertSessionsCompleted(count: number): Promise<void> {
    await expect.element(page.getByText(new RegExp(`${count} sessions? completed`, 'i'))).toBeVisible()
  }

  /**
   * Asserts the completion badge is shown (main status badge, not session history).
   */
  async assertCompleteBadge(): Promise<void> {
    // Use exact match for "Complete" to avoid matching session history "Completed" badges
    await expect.element(page.getByText('Complete', { exact: true })).toBeVisible()
  }
}
