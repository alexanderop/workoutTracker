import { screen } from '@testing-library/vue'
import type { TestContext } from '../types'
import type { CommonPO } from './CommonPO'

export class BuilderPO {
  constructor(
    private ctx: TestContext,
    private common: CommonPO,
  ) {}

  async navigateTo(): Promise<void> {
    await this.ctx.user.click(screen.getByRole('button', { name: /get started/i }))
  }

  async openAddBlockDialog(): Promise<void> {
    const addBlockBtn =
      screen.queryByRole('button', { name: /add first block/i }) ??
      screen.getByRole('button', { name: /add block/i })
    await this.ctx.user.click(addBlockBtn)
    await this.common.waitForDialog()
  }

  async addStrengthBlock(exerciseName: string): Promise<void> {
    await this.navigateTo()
    await this.openAddBlockDialog()
    await this.ctx.user.click(this.common.getDialogButton(exerciseName))
    this.common.assertDialogClosed()
  }

  async startWorkout(): Promise<void> {
    await this.ctx.user.click(screen.getByRole('button', { name: /start workout/i }))
  }

  async switchToTimedBlocksTab(): Promise<void> {
    await this.ctx.user.click(screen.getByRole('tab', { name: /timed blocks/i }))
  }

  getCarouselExerciseButtons(): ReadonlyArray<HTMLElement> {
    const allButtons = screen.getAllByRole('button')
    return allButtons.filter(
      (btn) =>
        btn.getAttribute('aria-pressed') !== null &&
        btn.getAttribute('aria-label') !== 'Add exercise',
    )
  }

  getPlaylistBlockButtons(): ReadonlyArray<HTMLElement> {
    const allButtons = screen.getAllByRole('button')
    return allButtons.filter((btn) => btn.getAttribute('aria-pressed') !== null)
  }
}
