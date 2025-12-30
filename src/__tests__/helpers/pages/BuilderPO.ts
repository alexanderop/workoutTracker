import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'
import { ensureHTMLElement } from '../domHelpers'

/**
 * Page Object for the workout builder view.
 * Provides methods to navigate, add exercise blocks, and start workouts.
 */
export class BuilderPO {
  constructor(private common: CommonPO) {}

  /**
   * Clicks the "Start New Workout" button on the home page.
   * Alias for navigateTo() with clearer intent.
   */
  async clickStartNewWorkout(): Promise<void> {
    await page.getByRole('button', { name: /start new workout/i }).click()
  }

  /**
   * Navigates to the workout builder by clicking the "Start New Workout" card.
   */
  async navigateTo(): Promise<void> {
    await this.clickStartNewWorkout()
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
    await this.common.waitForDialogClose()
  }

  /**
   * Starts the workout by clicking the "Start Workout" button.
   */
  async startWorkout(): Promise<void> {
    await page.getByRole('button', { name: /start workout/i }).click()
  }

  /**
   * Verifies the expected number of blocks in the playlist and starts the workout.
   * Waits for the active mode indicator showing current block position.
   * @param expectedBlockCount - The number of blocks expected in the playlist
   */
  async startWorkoutAndVerifyBlocks(expectedBlockCount: number): Promise<void> {
    const playlistButtons = await this.getPlaylistBlockButtons()
    expect(playlistButtons.length).toBe(expectedBlockCount)
    await this.startWorkout()
    await expect
      .element(page.getByText(new RegExp(`block 1 of ${expectedBlockCount}`, 'i')))
      .toBeVisible()
  }

  /**
   * Sets up a workout with one or more strength exercises and starts it.
   * Combines navigation, adding blocks, and starting the workout in one call.
   * @param exercises - Array of exercise names to add as blocks
   */
  async setupStrengthWorkoutAndStart(exercises: Array<string>): Promise<void> {
    await this.navigateTo()
    for (const exercise of exercises) {
      await this.openAddBlockDialog()
      await userEvent.click(this.common.getDialogButton(exercise))
      await this.common.waitForDialogClose()
    }
    await this.startWorkout()
    await expect.element(page.getByRole('table')).toBeVisible()
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
      const element = ensureHTMLElement(await locator.element())
      if (
        element.getAttribute('aria-pressed') !== null &&
        element.getAttribute('aria-label') !== 'Add exercise'
      ) {
        htmlButtons.push(element)
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
      const element = ensureHTMLElement(await locator.element())
      if (element.getAttribute('aria-pressed') !== null) {
        htmlButtons.push(element)
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

  /**
   * Adds a cardio block to the workout.
   * Opens the add block dialog, switches to timed blocks tab, configures cardio,
   * and confirms.
   * @param activity - The cardio activity to select (defaults to 'Running')
   */
  async addCardioBlock(activity = 'Running'): Promise<void> {
    await this.openAddBlockDialog()
    await this.switchToTimedBlocksTab()
    await userEvent.click(this.common.getDialogButton('Cardio'))

    // Wait for configure dialog
    await expect.element(page.getByText('Configure')).toBeVisible()

    // Select activity by clicking the button with matching text
    await userEvent.click(page.getByRole('button', { name: new RegExp(activity, 'i') }))

    // Duration defaults to 30 minutes, just confirm
    await userEvent.click(this.common.getDialogButton('Add Block'))
    await this.common.waitForDialogClose()
  }
}
