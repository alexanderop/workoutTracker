import { screen } from '@testing-library/vue'
import type { SetInputs, SetValues, TestContext } from '../types'

export class ActiveWorkoutPO {
  constructor(private ctx: TestContext) {}

  getSetRow(setIndex: number): SetInputs {
    const rows = document.querySelectorAll('tbody tr')
    const row = rows[setIndex]
    if (!row) {
      throw new Error(`Set row at index ${setIndex} not found`)
    }

    const getInput = (label: string): HTMLInputElement => {
      const el = row.querySelector(`[aria-label="${label}"]`)
      if (!(el instanceof HTMLInputElement)) {
        throw new Error(`${label} input not found or not an HTMLInputElement`)
      }
      return el
    }

    const completeButton = row.querySelector('[aria-label="Mark set complete"]')
    if (!(completeButton instanceof HTMLElement)) {
      throw new Error('Complete button not found in set row')
    }

    return {
      kg: getInput('Weight'),
      reps: getInput('Reps'),
      rir: getInput('Reps in reserve'),
      complete: completeButton,
    }
  }

  async fillSet(setIndex: number, values: SetValues): Promise<void> {
    const inputs = this.getSetRow(setIndex)

    const typeValue = async (el: HTMLInputElement, val?: number): Promise<void> => {
      if (val !== undefined) {
        await this.ctx.user.clear(el)
        await this.ctx.user.type(el, String(val))
      }
    }

    await typeValue(inputs.kg, values.kg)
    await typeValue(inputs.reps, values.reps)
    await typeValue(inputs.rir, values.rir)
  }

  async openMenu(): Promise<void> {
    await this.ctx.user.click(screen.getByRole('button', { name: /workout options|more options/i }))
  }

  getFooterButton(direction: 'prev' | 'next'): HTMLElement {
    const label = direction === 'prev' ? /previous block/i : /next block/i
    return screen.getByRole('button', { name: label })
  }

  getMenuTrigger(): HTMLElement {
    return screen.getByRole('button', { name: /workout options|more options/i })
  }

  getTimerControlButton(action: 'exit' | 'reset'): HTMLElement {
    const labels: Record<typeof action, RegExp> = {
      exit: /exit timer/i,
      reset: /reset timer/i,
    }
    return screen.getByRole('button', { name: labels[action] })
  }
}
