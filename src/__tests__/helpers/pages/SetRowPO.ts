import { page, userEvent } from 'vitest/browser'
import { flushPromises } from '@vue/test-utils'
import type { SetValues } from '../types'
import { ensureHTMLElement } from '../domHelpers'
import { NumericInputModalPO } from './NumericInputModalPO'

async function fillInput(getInput: () => Promise<HTMLInputElement>, value?: number): Promise<void> {
  if (value === undefined) return
  await userEvent.fill(await getInput(), String(value))
}

/**
 * Parses button text content to extract the display value.
 * Used in modal mode to read values from trigger buttons.
 */
function parseButtonText(text: string | null): string {
  if (!text || text === '—') return ''
  return text.trim()
}

/**
 * Page Object for a single set row in the workout table.
 * Encapsulates DOM elements and provides an application-specific API.
 * Supports both inline input (desktop) and modal input (touch devices).
 */
export class SetRowPO {
  private modalPO = new NumericInputModalPO()

  constructor(
    private rowLocator: ReturnType<typeof page.getByRole>,
    private setIndex: number,
  ) {}

  /**
   * Gets the weight input element from the row.
   */
  private async getWeightInput(): Promise<HTMLInputElement> {
    const input = await this.rowLocator
      .getByRole('spinbutton', { name: /weight for set/i })
      .element()
    if (!(input instanceof HTMLInputElement)) {
      throw new TypeError('Weight input is not an HTMLInputElement')
    }
    return input
  }

  /**
   * Gets the reps input element from the row.
   */
  private async getRepsInput(): Promise<HTMLInputElement> {
    const input = await this.rowLocator
      .getByRole('spinbutton', { name: /^reps for set/i })
      .element()
    if (!(input instanceof HTMLInputElement)) {
      throw new TypeError('Reps input is not an HTMLInputElement')
    }
    return input
  }

  /**
   * Gets the RIR input element from the row (desktop mode only).
   */
  private async getRirInput(): Promise<HTMLInputElement> {
    const input = await this.rowLocator
      .getByRole('spinbutton', { name: /reps in reserve for set/i })
      .element()
    if (!(input instanceof HTMLInputElement)) {
      throw new TypeError('RIR input is not an HTMLInputElement')
    }
    return input
  }

  /**
   * Checks if the row is in modal mode (touch device) or inline mode (desktop).
   * Modal mode uses button triggers instead of spinbutton inputs.
   */
  async isModalMode(): Promise<boolean> {
    // Check if weight trigger button exists (modal mode)
    const weightTrigger = this.rowLocator.getByRole('button', { name: /weight for set/i })
    const element = weightTrigger.query()
    return element !== null
  }

  /**
   * Gets the weight trigger button (modal mode only).
   */
  private getWeightTrigger() {
    return this.rowLocator.getByRole('button', { name: /weight for set/i })
  }

  /**
   * Gets the reps trigger button (modal mode only).
   */
  private getRepsTrigger() {
    return this.rowLocator.getByRole('button', { name: /^reps for set/i })
  }

  /**
   * Gets the RIR trigger button (modal mode only).
   */
  private getRirTrigger() {
    return this.rowLocator.getByRole('button', { name: /reps in reserve for set/i })
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
   * Gets the current values from the set row.
   * Works in both modal mode (reads button text) and inline mode (reads input values).
   * @returns Object with weight, reps, and rir as strings
   */
  async getValues(): Promise<{ weight: string; reps: string; rir: string }> {
    const isModal = await this.isModalMode()

    if (isModal) {
      const [weightElement, repsElement, rirElement] = await Promise.all([
        this.getWeightTrigger().element(),
        this.getRepsTrigger().element(),
        this.getRirTrigger().element(),
      ])

      return {
        weight: parseButtonText(weightElement.textContent),
        reps: parseButtonText(repsElement.textContent),
        rir: parseButtonText(rirElement.textContent),
      }
    }

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
   * Automatically detects modal mode vs inline mode.
   * @param values - Object containing optional kg, reps, and rir values
   */
  async fill(values: SetValues): Promise<void> {
    const isModal = await this.isModalMode()

    if (isModal) {
      await this.fillViaModal(values)
      return
    }

    await this.fillInline(values)
  }

  /** Fills set values; named to distinguish this page-object action from Array.fill. */
  async enterValues(values: SetValues): Promise<void> {
    await this.fill(values)
  }

  /**
   * Fills values using inline NumberField inputs (desktop mode).
   */
  private async fillInline(values: SetValues): Promise<void> {
    await fillInput(() => this.getWeightInput(), values.kg)
    await fillInput(() => this.getRepsInput(), values.reps)
    await fillInput(() => this.getRirInput(), values.rir)
    await flushPromises()
  }

  /**
   * Fills values using the NumericInputModal (touch/modal mode).
   */
  private async fillViaModal(values: SetValues): Promise<void> {
    // Fill weight
    if (values.kg !== undefined) {
      await userEvent.click(this.getWeightTrigger())
      await this.modalPO.waitForOpen()
      await this.modalPO.enterValueAndConfirm(values.kg)
      await this.modalPO.waitForClose()
    }

    // Fill reps
    if (values.reps !== undefined) {
      await userEvent.click(this.getRepsTrigger())
      await this.modalPO.waitForOpen()
      await this.modalPO.enterValueAndConfirm(values.reps)
      await this.modalPO.waitForClose()
    }

    // Fill RIR
    if (values.rir !== undefined) {
      await userEvent.click(this.getRirTrigger())
      await this.modalPO.waitForOpen()
      await this.modalPO.enterValueAndConfirm(values.rir)
      await this.modalPO.waitForClose()
    }

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
   * Checks whether the row's complete (checkmark) button is disabled.
   * Used to verify the checkmark mirrors the footer CTA's readiness state --
   * see Finding "Row checkmarks look enabled on empty sets but do nothing",
   * July 2026 UX review.
   */
  async isCompleteButtonDisabled(): Promise<boolean> {
    const button = await this.getCompleteButton()
    return button instanceof HTMLButtonElement ? button.disabled : false
  }

  /**
   * Fills values and clicks complete in one operation.
   * @param values - Object with weight, reps, rir as strings
   */
  async fillAndComplete(values: { weight: string; reps: string; rir: string }): Promise<void> {
    await this.enterValues({
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
    // eslint-disable-next-line no-restricted-syntax -- Testing data attribute + CSS class, no accessible equivalent
    const completedIndicator = firstCellElement.querySelector(
      String.raw`[data-set-state="completed"], .bg-success\/20`,
    )
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
    // eslint-disable-next-line no-restricted-syntax -- Testing data attribute + CSS class, no accessible equivalent
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
