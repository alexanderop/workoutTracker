import { screen, waitFor } from '@testing-library/vue'
import { expect } from 'vitest'
import type { TestContext } from '../types'
import type { CommonPO } from './CommonPO'

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
    await this.ctx.user.click(screen.getByRole('button', { name: /start new workout/i }))
  }

  /**
   * Opens the add block dialog by clicking the appropriate button.
   * Handles both empty state ("Add first block") and populated state ("Add block").
   */
  async openAddBlockDialog(): Promise<void> {
    const addBlockBtn =
      screen.queryByRole('button', { name: /add first block/i }) ??
      screen.getByRole('button', { name: /add block/i })
    await this.ctx.user.click(addBlockBtn)
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
    await this.ctx.user.click(this.common.getDialogButton(exerciseName))
    this.common.assertDialogClosed()
  }

  /**
   * Starts the workout by clicking the "Start Workout" button.
   */
  async startWorkout(): Promise<void> {
    await this.ctx.user.click(screen.getByRole('button', { name: /start workout/i }))
  }

  /**
   * Switches to the timed blocks tab in the add block dialog.
   */
  async switchToTimedBlocksTab(): Promise<void> {
    await this.ctx.user.click(screen.getByRole('tab', { name: /timed blocks/i }))
  }

  /**
   * Retrieves all exercise buttons in the carousel, excluding the "Add exercise" button.
   * @returns Array of toggle button elements representing exercises
   */
  getCarouselExerciseButtons(): ReadonlyArray<HTMLElement> {
    const allButtons = screen.getAllByRole('button')
    return allButtons.filter(
      (btn) =>
        btn.getAttribute('aria-pressed') !== null &&
        btn.getAttribute('aria-label') !== 'Add exercise',
    )
  }

  /**
   * Retrieves all block buttons in the workout playlist.
   * @returns Array of toggle button elements representing workout blocks
   */
  getPlaylistBlockButtons(): ReadonlyArray<HTMLElement> {
    const allButtons = screen.getAllByRole('button')
    return allButtons.filter((btn) => btn.getAttribute('aria-pressed') !== null)
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
    await this.ctx.user.click(this.common.getDialogButton(blockType))

    // Wait for configure dialog
    await waitFor(() => {
      const dialog = screen.getByRole('dialog')
      expect(dialog.textContent).toContain('Configure')
    })

    // Add exercise - Tabata uses "Select Exercise", others use "Add Exercise"
    const exerciseButtonText = blockType === 'Tabata' ? 'Select Exercise' : 'Add Exercise'
    await this.ctx.user.click(this.common.getDialogButton(exerciseButtonText))
    await this.common.selectExercise(exerciseName)

    // Confirm block
    await this.ctx.user.click(this.common.getDialogButton('Add Block'))
    await this.common.waitForDialogClose()
  }
}
