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

  // ============================================
  // View mode (grid / rows / cards)
  // ============================================

  getViewModeToggle() {
    return page.getByTestId('habit-view-mode-toggle')
  }

  /** Switch the habits page layout via the title-row toggle. */
  async switchViewMode(mode: 'grid' | 'rows' | 'cards'): Promise<void> {
    await userEvent.click(page.getByTestId(`habit-view-mode-${mode}`))
  }

  /**
   * Which mode the toggle currently reports. Reads `aria-pressed`/`data-state`
   * off the items rather than any app state, so it proves what a user sees.
   */
  async getActiveViewMode(): Promise<'grid' | 'rows' | 'cards' | undefined> {
    const modes = ['grid', 'rows', 'cards'] as const
    for (const mode of modes) {
      const element = page.getByTestId(`habit-view-mode-${mode}`).element()
      if (element.dataset.state === 'on') return mode
    }
    return undefined
  }

  getTileGrid() {
    return page.getByTestId('habit-tile-grid')
  }

  /**
   * Visible width of each tile's name, in pixels.
   *
   * Criterion 4 says truncated names must still tell habits apart. A name
   * column only a few characters wide collapses distinct habits to the same
   * string ("Meditate" and "Medication" both becoming "Medi…"), which no
   * existence assertion notices.
   */
  async getTileNameWidths(): Promise<Array<number>> {
    const names = await page.getByTestId('habit-tile-name').all()
    return names.map((name) => name.element().getBoundingClientRect().width)
  }

  getRowDateHeader() {
    return page.getByTestId('habit-row-date-header')
  }

  /** Check controls on screen, whichever layout is rendering them. */
  async countVisibleCheckControls(): Promise<number> {
    return (
      await page.getByRole('button', { name: /^(Mark .+ (in)?complete|Log .+:|Clear .+,)/i }).all()
    ).length
  }

  /** How many day columns the compact-rows header renders. */
  async countRowDateHeaderColumns(): Promise<number> {
    return this.rowDateHeaderColumns().length
  }

  /**
   * Header columns whose text is wider than the column itself.
   *
   * Asserting the header *exists* and shares the row grid passes even when
   * every label overflows and paints over its neighbours, which is exactly how
   * an unreadable week header reached QA. `scrollWidth > clientWidth` is the
   * measurement that catches it.
   */
  async findOverflowingRowDateHeaderColumns(): Promise<Array<string>> {
    return this.rowDateHeaderColumns()
      .filter((column) => column.scrollWidth > column.clientWidth)
      .map((column) => column.textContent?.trim() ?? '')
  }

  /**
   * Largest horizontal gap, in pixels, between a header column's centre and the
   * centre of the heatmap cell it labels.
   *
   * The header sharing `HABIT_ROW_GRID_COLUMNS` with the rows is necessary but
   * not sufficient: the header's leading and trailing spacers stand in for the
   * row's icon and check control, so resizing either control shifts the heatmap
   * column out from under the header while every other assertion stays green.
   * That regressed once, when the check button grew to the 44px touch target.
   */
  async getRowHeaderCellDrift(habitName: string): Promise<number> {
    const centres = (element: Element): Array<number> =>
      // eslint-disable-next-line no-restricted-syntax -- Geometry needs the raw nodes
      [...element.querySelectorAll(':scope .grid-cols-7 > *')].map((cell) => {
        const box = cell.getBoundingClientRect()
        return box.x + box.width / 2
      })

    const header = centres(this.getRowDateHeader().element())
    const row = centres(this.getTodayRow(habitName).element())
    if (header.length === 0 || row.length === 0) {
      throw new Error('Expected both the row header and the habit row to render day columns')
    }
    return Math.max(...row.map((cx, index) => Math.abs(cx - (header[index % header.length] ?? 0))))
  }

  /**
   * Text of the header columns marked as today -- an array so a test can prove
   * there is exactly one, not just at least one.
   */
  async getRowDateHeaderTodayColumns(): Promise<Array<string>> {
    return this.rowDateHeaderColumns()
      .filter((column) => column.dataset.today === 'true')
      .map((column) => column.textContent?.trim() ?? '')
  }

  private rowDateHeaderColumns(): Array<HTMLElement> {
    const header = this.getRowDateHeader().element()
    // eslint-disable-next-line no-restricted-syntax -- Scoped to the resolved header element
    return [...header.querySelectorAll<HTMLElement>(':scope .grid-cols-7 > *')]
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
    await this.openDetails(name)
    const editButtonName = new RegExp(`^Edit ${escapeRegExp(name)}$`, 'i')
    await userEvent.click(this.getDetailSheet().getByRole('button', { name: editButtonName }))
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

  /**
   * Tap a habit's check control. Quantity habits in the `rows` layout announce
   * "Log <name>: <target> <unit>" rather than "Mark <name> complete", because
   * the tap writes the whole target -- so this matches either wording.
   */
  async toggleBinaryHabit(name: string): Promise<void> {
    const buttonName = new RegExp(`^(Mark|Log|Clear) ${escapeRegExp(name)}`, 'i')
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
  // Detail sheet (stats / history / edit / archive)
  //
  // One surface for all three layouts: tapping a habit's body opens it in
  // every mode, which is what stops `grid` and `rows` from being dead ends.
  // ============================================

  getManageRow(name: string) {
    return this.getTodayRow(name)
  }

  getDetailSheet() {
    return page.getByTestId('habit-detail-sheet')
  }

  /** Open a habit's detail sheet from whichever layout is on screen. */
  async openDetails(name: string): Promise<void> {
    const bodyName = new RegExp(`^Show details for ${escapeRegExp(name)}$`, 'i')
    await userEvent.click(this.getManageRow(name).getByRole('button', { name: bodyName }))
    await expect.element(this.getDetailSheet()).toBeVisible()
  }

  async closeDetails(): Promise<void> {
    await userEvent.keyboard('{Escape}')
    await expect.element(this.getDetailSheet()).not.toBeInTheDocument()
  }

  async requestArchive(name: string): Promise<void> {
    await this.openDetails(name)
    const buttonName = new RegExp(`^Archive ${escapeRegExp(name)}$`, 'i')
    await userEvent.click(this.getDetailSheet().getByRole('button', { name: buttonName }))
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
  // History grid (lives inside the detail sheet)
  // ============================================

  /**
   * Fails unless the open sheet belongs to `name`.
   *
   * The history grid moved into the sheet, so these helpers read from whatever
   * sheet happens to be open rather than from a named row. Without this check
   * `name` would be decorative: a test that forgot `openDetails`, or opened a
   * different habit, would assert against the wrong habit and pass. The Edit
   * button's aria-label is the habit-specific marker inside the sheet.
   */
  private assertSheetShows(name: string): void {
    const editButtonName = new RegExp(`^Edit ${escapeRegExp(name)}$`, 'i')
    const editButton = this.getDetailSheet().getByRole('button', { name: editButtonName })
    if (editButton.query() === null) {
      throw new Error(`The open detail sheet is not "${name}" -- call openDetails('${name}') first`)
    }
  }

  getHistoryDayCell(name: string, date: number) {
    this.assertSheetShows(name)
    return this.getDetailSheet().getByTestId(`habit-day-${date}`)
  }

  async toggleHistoryDay(name: string, date: number): Promise<void> {
    await userEvent.click(this.getHistoryDayCell(name, date))
  }

  async countCompleteHistoryDays(name: string): Promise<number> {
    this.assertSheetShows(name)
    return (await this.getDetailSheet().getByRole('button', { pressed: true }).all()).length
  }
}

function escapeRegExp(value: string): string {
  return value.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`)
}
