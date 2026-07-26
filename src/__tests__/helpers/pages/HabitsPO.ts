import { page, userEvent } from 'vitest/browser'
import { expect } from 'vitest'
import type { CommonPO } from './CommonPO'

type HabitScheduleInput = { type: 'daily' } | { type: 'weekly'; targetDaysPerWeek: string }
type HabitKindInput = { type: 'binary' } | { type: 'quantity'; target: string; unit: string }

export type CreateHabitOptions = {
  name: string
  schedule?: HabitScheduleInput
  kind?: HabitKindInput
  autoLink?: boolean
}

/**
 * Page Object for the Habits feature: the /habits view, the habit form
 * dialog (create/edit), and the compact "Today's Habits" home card.
 */
export class HabitsPO {
  constructor(private common: CommonPO) {}

  // ============================================
  // Navigation
  // ============================================

  async navigateTo(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: /^habits$/i }))
    await this.common.waitForRoute(/^\/habits$/)
  }

  getHomeCard() {
    return page.getByTestId('habits-home-card')
  }

  async navigateToHabitsFromHomeCard(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: /view all habits/i }))
    await this.common.waitForRoute(/^\/habits$/)
  }

  // ============================================
  // Form (create/edit)
  // ============================================

  async openCreateForm(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: /add habit/i }))
    await this.common.waitForDialog()
  }

  async openEditForm(name: string): Promise<void> {
    await this.expandDetails(name)
    const row = this.getManageRow(name)
    const editButtonName = new RegExp(`^Edit ${escapeRegExp(name)}$`, 'i')
    const editButton = row.getByRole('button', { name: editButtonName })
    await userEvent.click(editButton)
    await this.common.waitForDialog()
  }

  async fillName(name: string): Promise<void> {
    const input = page.getByRole('dialog').getByRole('textbox', { name: /^name$/i })
    await userEvent.clear(input)
    await userEvent.fill(input, name)
  }

  /** `label` is the accessible name of an icon button, e.g. 'Reading' or 'No icon'. */
  async clickIconPreset(label: string): Promise<void> {
    await userEvent.click(
      page.getByRole('dialog').getByRole('button', { name: label, exact: true }),
    )
  }

  async selectSchedule(type: 'daily' | 'weekly'): Promise<void> {
    const label = type === 'daily' ? 'Daily' : 'Weekly'
    await userEvent.click(
      page.getByRole('dialog').getByRole('button', { name: label, exact: true }),
    )
  }

  async setTargetDaysPerWeek(value: string): Promise<void> {
    const input = page
      .getByRole('dialog')
      .getByRole('spinbutton', { name: /target days per week/i })
    await userEvent.clear(input)
    await userEvent.fill(input, value)
  }

  async selectKind(type: 'binary' | 'quantity'): Promise<void> {
    const label = type === 'binary' ? 'Check-off' : 'Quantity'
    await userEvent.click(
      page.getByRole('dialog').getByRole('button', { name: label, exact: true }),
    )
  }

  async setQuantityTarget(value: string): Promise<void> {
    const input = page.getByRole('dialog').getByRole('spinbutton', { name: /^target$/i })
    await userEvent.clear(input)
    await userEvent.fill(input, value)
  }

  async setUnit(unit: string): Promise<void> {
    const input = page.getByRole('dialog').getByRole('textbox', { name: /^unit$/i })
    await userEvent.clear(input)
    await userEvent.fill(input, unit)
  }

  async toggleAutoLink(): Promise<void> {
    await userEvent.click(page.getByRole('dialog').getByRole('switch', { name: /auto-complete/i }))
  }

  async clickSave(): Promise<void> {
    await userEvent.click(page.getByRole('dialog').getByRole('button', { name: /^save$/i }))
    await this.common.waitForDialogClose()
  }

  async clickCancel(): Promise<void> {
    await userEvent.click(page.getByRole('dialog').getByRole('button', { name: /^cancel$/i }))
    await this.common.waitForDialogClose()
  }

  isSaveDisabled(): boolean {
    const button = page
      .getByRole('dialog')
      .getByRole('button', { name: /^save$/i })
      .element()
    return button.hasAttribute('disabled')
  }

  /**
   * Convenience: fill out and submit the create-habit form in one call.
   * Only sets the fields options explicitly provide -- leaves everything
   * else at the form's own defaults.
   */
  async createHabit(options: CreateHabitOptions): Promise<void> {
    await this.openCreateForm()
    await this.fillName(options.name)

    if (options.schedule?.type === 'weekly') {
      await this.selectSchedule('weekly')
      await this.setTargetDaysPerWeek(options.schedule.targetDaysPerWeek)
    }

    if (options.kind?.type === 'quantity') {
      await this.selectKind('quantity')
      await this.setQuantityTarget(options.kind.target)
      await this.setUnit(options.kind.unit)
    }

    if (options.autoLink) await this.toggleAutoLink()

    await this.clickSave()
  }

  // ============================================
  // Today list
  // ============================================

  getTodayRow(name: string) {
    return page.getByTestId(`habit-today-${name}`)
  }

  async toggleBinaryHabit(name: string): Promise<void> {
    const buttonName = new RegExp(`^Mark ${escapeRegExp(name)}`, 'i')
    const toggleButton = page.getByRole('button', { name: buttonName })
    await userEvent.click(toggleButton)
  }

  async expectComplete(name: string): Promise<void> {
    // Exact match matters: aria-label is "Mark X incomplete" when currently
    // complete (tapping it marks incomplete) -- an unanchored /complete/ would
    // also match that same label, since "incomplete" ends in "complete".
    const buttonName = new RegExp(`^Mark ${escapeRegExp(name)} incomplete$`, 'i')
    await expect.element(page.getByRole('button', { name: buttonName })).toBeVisible()
  }

  async expectIncomplete(name: string): Promise<void> {
    const buttonName = new RegExp(`^Mark ${escapeRegExp(name)} complete$`, 'i')
    await expect.element(page.getByRole('button', { name: buttonName })).toBeVisible()
  }

  getTodayCompactGridColor(name: string): string {
    const row = this.getTodayRow(name).element()
    // eslint-disable-next-line no-restricted-syntax -- Scoped lookup within the named habit row
    const todayCell = row.querySelector('.habit-today-ring')
    if (!todayCell) throw new Error(`Today's compact grid cell for "${name}" not found`)
    return globalThis.getComputedStyle(todayCell).backgroundColor
  }

  getQuantityInput(name: string) {
    return page.getByRole('spinbutton', { name: new RegExp(`^Log ${escapeRegExp(name)}$`) })
  }

  async clickIncrementQuantity(name: string, times = 1): Promise<void> {
    const input = this.getQuantityInput(name).element()
    // NumberFieldContent (the "relative" wrapper) is where Decrement/Input/Increment
    // live as siblings; the Increment button has no habit-specific accessible name
    // (see NumberFieldIncrement.vue's built-in "Increase" aria-label), so it has to
    // be found by DOM structure relative to the input we *can* address by name.

    const wrapper = input.closest('[class*="relative"]')
    // eslint-disable-next-line no-restricted-syntax -- Scoped query within the resolved wrapper
    const incrementButton = wrapper?.querySelector<HTMLButtonElement>('[data-slot="increment"]')
    if (!incrementButton) throw new Error(`Increment button for "${name}" not found`)
    for (let i = 0; i < times; i++) {
      await userEvent.click(incrementButton)
    }
  }

  async expectStreakBadge(name: string, count: number): Promise<void> {
    await expect.element(this.getTodayRow(name).getByText(`${count} day streak`)).toBeVisible()
  }

  async expectNoStreakBadge(name: string): Promise<void> {
    await expect.element(this.getTodayRow(name).getByText(/day streak/)).not.toBeInTheDocument()
  }

  async expectWeekProgress(name: string, completed: number, target: number): Promise<void> {
    await expect
      .element(this.getTodayRow(name).getByText(`${completed}/${target} this week`))
      .toBeVisible()
  }

  getEmptyState() {
    return page.getByText(/no habits yet/i)
  }

  // ============================================
  // Manage section (edit / archive / expand)
  // ============================================

  getManageRow(name: string) {
    return this.getTodayRow(name)
  }

  async expandDetails(name: string): Promise<void> {
    await userEvent.click(this.getManageRow(name).getByRole('button', { name: /show details/i }))
  }

  async requestArchive(name: string): Promise<void> {
    await this.expandDetails(name)
    const buttonName = new RegExp(`^Archive ${escapeRegExp(name)}$`, 'i')
    const archiveButton = this.getManageRow(name).getByRole('button', { name: buttonName })
    await userEvent.click(archiveButton)
    await this.common.waitForDialog()
  }

  async confirmArchive(): Promise<void> {
    await userEvent.click(this.common.getDialogButton('Archive'))
    await this.common.waitForDialogClose()
  }

  // ============================================
  // Archived section
  // ============================================

  async openArchivedSection(): Promise<void> {
    await userEvent.click(page.getByRole('button', { name: /^archived/i }))
  }

  getArchivedRow(name: string) {
    return page.getByTestId(`habit-archived-${name}`)
  }

  async unarchiveHabit(name: string): Promise<void> {
    await userEvent.click(this.getArchivedRow(name).getByRole('button', { name: /restore/i }))
  }

  // ============================================
  // History grid
  // ============================================

  getHistoryDayCell(name: string, date: number) {
    return this.getManageRow(name).getByTestId(`habit-day-${date}`)
  }

  async toggleHistoryDay(name: string, date: number): Promise<void> {
    await userEvent.click(this.getHistoryDayCell(name, date))
  }

  async countCompleteHistoryDays(name: string): Promise<number> {
    return (await this.getManageRow(name).getByRole('button', { pressed: true }).all()).length
  }
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}
