import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import type { TestContext } from '../types'
import type { CommonPO } from './CommonPO'

function ensureHTMLElement(el: HTMLElement | SVGElement): HTMLElement {
  if (!(el instanceof HTMLElement)) {
    throw new Error('Expected HTMLElement, got SVGElement')
  }
  return el
}

/**
 * Page Object for the workout builder view.
 * Provides methods to navigate, add exercise blocks, and start workouts.
 */
export class BuilderPO {
  constructor(
    private ctx: TestContext,
    private common: CommonPO,
  ) {}

  /**
   * Navigates to the workout builder by clicking the "Start New Workout" card.
   */
  async navigateTo(): Promise<void> {
    await page.getByRole('button', { name: /start new workout/i }).click()
  }

  /**
   * Opens the add block dialog by clicking the appropriate button.
   * Handles both empty state ("Add first block") and populated state ("Add block").
   */
  async openAddBlockDialog(): Promise<void> {
    const addFirstBlock = page.getByRole('button', { name: /add first block/i }).query()
    if (addFirstBlock) {
      await userEvent.click(addFirstBlock)
      await this.common.waitForDialog()
      return
    }
    await page.getByRole('button', { name: /add block/i }).click()
    await this.common.waitForDialog()
  }

  /**
   * Adds a strength exercise block to the workout.
   * Navigates to builder, opens dialog, and selects the specified exercise.
   * @param exerciseName - The name of the exercise to add
   */
  async addStrengthBlock(exerciseName: string): Promise<void> {
    await this.navigateTo()
    await this.openAddBlockDialog()
    await userEvent.click(this.common.getDialogButton(exerciseName))
    this.common.assertDialogClosed()
  }

  /**
   * Starts the workout by clicking the "Start Workout" button.
   */
  async startWorkout(): Promise<void> {
    await page.getByRole('button', { name: /start workout/i }).click()
  }

  /**
   * Switches to the timed blocks tab in the add block dialog.
   */
  async switchToTimedBlocksTab(): Promise<void> {
    await page.getByRole('tab', { name: /timed blocks/i }).click()
  }

  /**
   * Retrieves all exercise buttons in the carousel, excluding the "Add exercise" button.
   * @returns Array of toggle button elements representing exercises
   */
  async getCarouselExerciseButtons(): Promise<ReadonlyArray<HTMLElement>> {
    const allButtons = await page.getByRole('button').all()
    const htmlButtons: Array<HTMLElement> = []
    for (const locator of allButtons) {
      const el = ensureHTMLElement(await locator.element())
      if (
        el.getAttribute('aria-pressed') !== null &&
        el.getAttribute('aria-label') !== 'Add exercise'
      ) {
        htmlButtons.push(el)
      }
    }
    return htmlButtons
  }

  /**
   * Retrieves all block buttons in the workout playlist.
   * @returns Array of toggle button elements representing workout blocks
   */
  async getPlaylistBlockButtons(): Promise<ReadonlyArray<HTMLElement>> {
    const allButtons = await page.getByRole('button').all()
    const htmlButtons: Array<HTMLElement> = []
    for (const locator of allButtons) {
      const el = ensureHTMLElement(await locator.element())
      if (el.getAttribute('aria-pressed') !== null) {
        htmlButtons.push(el)
      }
    }
    return htmlButtons
  }

  /**
   * Adds a timed block (AMRAP, EMOM, Tabata, or For Time) with an exercise.
   * Opens the add block dialog, switches to timed blocks tab, configures the block,
   * adds an exercise, and confirms.
   * @param blockType - The type of timed block to add
   * @param exerciseName - The name of the exercise to add (defaults to 'Push-ups')
   */
  async addTimedBlock(
    blockType: 'AMRAP' | 'EMOM' | 'Tabata' | 'For Time',
    exerciseName = 'Push-ups',
  ): Promise<void> {
    await this.openAddBlockDialog()
    await this.switchToTimedBlocksTab()
    await userEvent.click(this.common.getDialogButton(blockType))

    // Wait for configure dialog
    await expect.element(page.getByText('Configure')).toBeVisible()

    // Add exercise - Tabata uses "Select Exercise", others use "Add Exercise"
    const exerciseButtonText = blockType === 'Tabata' ? 'Select Exercise' : 'Add Exercise'
    await userEvent.click(this.common.getDialogButton(exerciseButtonText))
    await this.common.selectExercise(exerciseName)

    // Confirm block
    await userEvent.click(this.common.getDialogButton('Add Block'))
    await this.common.waitForDialogClose()
  }
}
