import { screen, waitFor } from '@testing-library/vue'
import type { TestContext } from '../types'

export class CommonPO {
  constructor(protected ctx: TestContext) {}

  async waitForDialog(): Promise<HTMLElement> {
    return await waitFor(() => screen.getByRole('dialog'))
  }

  getDialogButton(text: string): HTMLElement {
    const dialog = screen.getByRole('dialog')
    const buttons = dialog.querySelectorAll('button')
    const btn = Array.from(buttons).find((b) => b.textContent?.includes(text))

    if (!btn) {
      throw new Error(`Dialog button with text "${text}" not found`)
    }
    return btn
  }

  assertDialogClosed(): void {
    const dialog = screen.queryByRole('dialog')
    if (dialog) {
      throw new Error('Expected dialog to be closed but it is still open')
    }
  }

  async selectExercise(exerciseName: string): Promise<void> {
    const searchInput = screen.getByRole('textbox')
    await this.ctx.user.type(searchInput, exerciseName)
    await waitFor(() => {
      this.getDialogButton(exerciseName)
    })
    await this.ctx.user.click(this.getDialogButton(exerciseName))
  }

  async waitForRoute(pathPattern: RegExp): Promise<void> {
    await waitFor(() => {
      const currentPath = this.ctx.router.currentRoute.value.path
      if (!pathPattern.test(currentPath)) {
        throw new Error(`Expected route to match ${pathPattern}, got ${currentPath}`)
      }
    })
  }
}
