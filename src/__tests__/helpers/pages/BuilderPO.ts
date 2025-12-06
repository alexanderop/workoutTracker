import { screen } from '@testing-library/vue'
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
   * Navigates to the workout builder by clicking the "Get Started" button.
   */
  async navigateTo(): Promise<void> {
    await this.ctx.user.click(screen.getByRole('button', { name: /get started/i }))
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
}
