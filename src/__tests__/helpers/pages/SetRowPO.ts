import { page, userEvent } from 'vitest/browser'
import { flushPromises } from '@vue/test-utils'
import type { SetValues } from '../types'
import { ensureHTMLElement } from '../domHelpers'

/**
 * Page Object for a single set row in the workout table.
 * Encapsulates DOM elements and provides an application-specific API.
 */
export class SetRowPO {
  constructor(
    private rowLocator: ReturnType<typeof page.getByRole>,
    private setIndex: number,
  ) {}

  /**
   * Gets the weight input element from the row.
   */
  private async getWeightInput(): Promise<HTMLInputElement> {
    const input = await this.rowLocator.getByRole('spinbutton', { name: /weight for set/i }).element()
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Weight input is not an HTMLInputElement')
    }
    return input
  }

  /**
   * Gets the reps input element from the row.
   */
  private async getRepsInput(): Promise<HTMLInputElement> {
    const input = await this.rowLocator.getByRole('spinbutton', { name: /^reps for set/i }).element()
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('Reps input is not an HTMLInputElement')
    }
    return input
  }

  /**
   * Gets the RIR input element from the row.
   */
  private async getRirInput(): Promise<HTMLInputElement> {
    const input = await this.rowLocator.getByRole('spinbutton', { name: /reps in reserve for set/i }).element()
    if (!(input instanceof HTMLInputElement)) {
      throw new Error('RIR input is not an HTMLInputElement')
    }
    return input
  }

  /**
   * Gets the complete button from the row.
   */
  private async getCompleteButton(): Promise<HTMLElement> {
    return ensureHTMLElement(
      await this.rowLocator.getByRole('button', { name: /mark set.*(complete|done)/i }).element(),
    )
  }

  /**
   * Gets the current values from the set row inputs.
   * @returns Object with weight, reps, and rir as strings
   */
  async getValues(): Promise<{ weight: string; reps: string; rir: string }> {
    const [weight, reps, rir] = await Promise.all([
      this.getWeightInput(),
      this.getRepsInput(),
      this.getRirInput(),
    ])
    return {
      weight: weight.value,
      reps: reps.value,
      rir: rir.value,
    }
  }

  /**
   * Fills in the values for this set row.
   * Only fills values that are provided (undefined values are skipped).
   * @param values - Object containing optional kg, reps, and rir values
   */
  async fill(values: SetValues): Promise<void> {
    const fillValue = async (
      getInput: () => Promise<HTMLInputElement>,
      val?: number,
    ): Promise<void> => {
      if (val !== undefined) {
        const el = await getInput()
        await userEvent.fill(el, String(val))
      }
    }

    await fillValue(() => this.getWeightInput(), values.kg)
    await fillValue(() => this.getRepsInput(), values.reps)
    await fillValue(() => this.getRirInput(), values.rir)
    await flushPromises()
  }

  /**
   * Clicks the complete button for this set.
   */
  async complete(): Promise<void> {
    const button = await this.getCompleteButton()
    await userEvent.click(button)
  }

  /**
   * Fills values and clicks complete in one operation.
   * @param values - Object with weight, reps, rir as strings
   */
  async fillAndComplete(values: { weight: string; reps: string; rir: string }): Promise<void> {
    await this.fill({
      kg: Number(values.weight),
      reps: Number(values.reps),
      rir: Number(values.rir),
    })
    await this.complete()
  }

  /**
   * Checks if this set row shows completed state.
   * @returns true if the row shows a completion indicator
   */
  async isCompleted(): Promise<boolean> {
    const cells = await this.rowLocator.getByRole('cell').all()
    const firstCell = cells[0]
    if (!firstCell) return false
    const firstCellElement = ensureHTMLElement(await firstCell.element())
    const completedIndicator = firstCellElement.querySelector('[data-set-state="completed"], .bg-success\\/20')
    return completedIndicator !== null
  }

  /**
   * Checks if this set row is the active (current) row.
   * @returns true if the row shows an active indicator
   */
  async isActive(): Promise<boolean> {
    const cells = await this.rowLocator.getByRole('cell').all()
    const firstCell = cells[0]
    if (!firstCell) return false
    const firstCellElement = ensureHTMLElement(await firstCell.element())
    const activeIndicator = firstCellElement.querySelector('[data-set-state="active"], .bg-primary')
    return activeIndicator !== null
  }

  /**
   * Gets the set index (0-based).
   */
  getIndex(): number {
    return this.setIndex
  }
}
