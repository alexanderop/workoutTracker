import { screen } from '@testing-library/vue'
import type { TestContext } from '../types'
import type { CommonPO } from './CommonPO'

export class QueuePO {
  constructor(
    private ctx: TestContext,
    private common: CommonPO,
  ) {}

  async open(): Promise<void> {
    await this.ctx.user.click(screen.getByRole('button', { name: /open workout queue/i }))
    await this.common.waitForDialog()
  }

  getItems(): ReadonlyArray<HTMLElement> {
    const dialog = screen.getByRole('dialog')
    const items = dialog.querySelectorAll('[data-queue-item]')
    return Array.from(items).filter((item): item is HTMLElement => item instanceof HTMLElement)
  }

  getActiveItem(): HTMLElement | null {
    const items = this.getItems()
    return items.find((item) => item.textContent?.includes('(Active)')) ?? null
  }
}
