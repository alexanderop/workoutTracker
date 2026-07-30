import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import { beforeEach, describe, expect, it } from 'vitest'
import WeightLogSheet from '@/features/weight/components/WeightLogSheet.vue'
import { getWeightRepository } from '@/db'
import { getStartOfDay } from '@/lib/date'
import { resetDatabase } from '@/__tests__/setup'
import { createDbWeightEntryForDate } from '@/__tests__/factories/dbWeightEntry.factory'
import { i18n } from '@/i18n'

/**
 * Browser-tier spec for the Scale Weight bottom sheet: real repository via
 * `getWeightRepository()`, real i18n plugin, no internal-composable mocking.
 * Assertions read database state through the repository and rendered
 * text/values through the public template -- never through composable call
 * counts. Only one sheet instance is ever mounted at a time (`unmount()`
 * before re-rendering) so accessible-name queries stay unambiguous.
 */
describe('WeightLogSheet', () => {
  beforeEach(async () => {
    await resetDatabase()
    i18n.global.locale.value = 'en'
  })

  // Pinned fixture days so date math in the sheet is deterministic.
  const today = getStartOfDay(new Date(2026, 6, 30))
  const yesterday = getStartOfDay(new Date(2026, 6, 29))

  function renderSheet(initialDay?: number) {
    const modelState = { open: true }
    const view = render(WeightLogSheet, {
      props: {
        open: true,
        initialDay,
        'onUpdate:open': (value: boolean) => {
          modelState.open = value
        },
      },
      global: { plugins: [i18n] },
    })
    return { ...view, modelState }
  }

  it('saves a weight for today, writing one entry with the right kg value and closing the sheet', async () => {
    const { modelState } = renderSheet(today)

    await userEvent.fill(page.getByLabelText('Weight', { exact: true }), '82.4')
    await userEvent.click(page.getByRole('button', { name: 'Save', exact: true }))

    await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)

    const [savedEntry] = await getWeightRepository().getAll()
    expect(savedEntry?.weight).toBe(82.4)
    expect(savedEntry?.date).toBe(today)
    expect(modelState.open).toBe(false)
  })

  it('persists bodyFatPct when provided, and omits it when the field is left empty', async () => {
    const first = renderSheet(today)
    await userEvent.fill(page.getByLabelText('Weight', { exact: true }), '80')
    await userEvent.fill(page.getByLabelText('Body Fat', { exact: true }), '18.5')
    await userEvent.click(page.getByRole('button', { name: 'Save', exact: true }))
    await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)
    first.unmount()

    const [withBodyFat] = await getWeightRepository().getAll()
    expect(withBodyFat?.bodyFatPct).toBe(18.5)

    // A second sheet, on a different day, with body fat left blank.
    const second = renderSheet(yesterday)
    await userEvent.fill(page.getByLabelText('Weight', { exact: true }), '79')
    await userEvent.click(page.getByRole('button', { name: 'Save', exact: true }))
    await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(2)
    second.unmount()

    const entryWithoutBodyFat = (await getWeightRepository().getAll()).find(
      (entry) => entry.date === yesterday,
    )
    expect(entryWithoutBodyFat?.bodyFatPct).toBeUndefined()
  })

  it('pre-fills both inputs when opened on a date that already has an entry', async () => {
    await getWeightRepository().upsertForDate(
      createDbWeightEntryForDate(new Date(2026, 6, 30), 91, { bodyFatPct: 22 }),
    )

    renderSheet(today)

    await expect.element(page.getByLabelText('Weight', { exact: true })).toHaveValue('91')
    await expect.element(page.getByLabelText('Body Fat', { exact: true })).toHaveValue('22')
  })

  it('leaves exactly one entry, with the new values, when saving over an existing entry for the same date', async () => {
    await getWeightRepository().upsertForDate(createDbWeightEntryForDate(new Date(2026, 6, 30), 80))

    renderSheet(today)

    await userEvent.fill(page.getByLabelText('Weight', { exact: true }), '81')
    await userEvent.click(page.getByRole('button', { name: 'Save', exact: true }))

    await expect
      .poll(async () => {
        const all = await getWeightRepository().getAll()
        return all.find((entry) => entry.date === today)?.weight
      })
      .toBe(81)
    const allEntries = await getWeightRepository().getAll()
    expect(allEntries).toHaveLength(1)
  })

  it('disables the trash button with no entry for the selected date, and deletes the entry when one exists', async () => {
    const first = renderSheet(today)

    await expect.element(page.getByRole('button', { name: 'Delete entry' })).toBeDisabled()

    await userEvent.fill(page.getByLabelText('Weight', { exact: true }), '80')
    await userEvent.click(page.getByRole('button', { name: 'Save', exact: true }))
    await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)
    first.unmount()

    // Re-render fresh so the sheet re-reads the now-existing entry on open.
    renderSheet(today)
    const deleteButton = page.getByRole('button', { name: 'Delete entry' })
    await expect.element(deleteButton).toBeEnabled()

    await userEvent.click(deleteButton)

    await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(0)
  })

  it('shows the calendar when the date label is tapped, and re-fills the form from the picked day', async () => {
    await getWeightRepository().upsertForDate(createDbWeightEntryForDate(new Date(2026, 6, 30), 90))
    await getWeightRepository().upsertForDate(createDbWeightEntryForDate(new Date(2026, 6, 29), 88))

    renderSheet(today)
    await expect.element(page.getByLabelText('Weight', { exact: true })).toHaveValue('90')

    await userEvent.click(page.getByRole('button', { name: 'Change date' }))
    await expect.element(page.getByRole('group', { name: 'Select a date' })).toBeVisible()

    // The dialog content is teleported (DialogPortal) outside the render
    // container, so the calendar cell has to be located from `document`.
    // eslint-disable-next-line no-restricted-syntax -- data-value is the calendar's frozen rendered contract (CalendarCellTrigger.vue); it targets a specific day deterministically without reconstructing its full accessible name
    const earlierDay = document.querySelector<HTMLElement>('[data-value="2026-07-29"]')
    expect(earlierDay).not.toBeNull()
    earlierDay?.click()

    await expect.element(page.getByLabelText('Weight', { exact: true })).toHaveValue('88')
    await expect.element(page.getByRole('group', { name: 'Select a date' })).not.toBeInTheDocument()
  })

  it('returns to the form with the selection unchanged when "Go Back" is tapped', async () => {
    await getWeightRepository().upsertForDate(createDbWeightEntryForDate(new Date(2026, 6, 30), 90))

    renderSheet(today)

    await userEvent.click(page.getByRole('button', { name: 'Change date' }))
    await expect.element(page.getByRole('group', { name: 'Select a date' })).toBeVisible()

    await userEvent.click(page.getByRole('button', { name: 'Go Back' }))

    await expect.element(page.getByRole('group', { name: 'Select a date' })).not.toBeInTheDocument()
    await expect.element(page.getByLabelText('Weight', { exact: true })).toHaveValue('90')
  })

  it('disables Save while body fat is outside 0-100, so a saved entry always re-imports', async () => {
    renderSheet(today)

    await userEvent.fill(page.getByLabelText('Weight', { exact: true }), '80')
    await userEvent.fill(page.getByLabelText('Body Fat', { exact: true }), '150')
    await expect.element(page.getByRole('button', { name: 'Save', exact: true })).toBeDisabled()

    await userEvent.fill(page.getByLabelText('Body Fat', { exact: true }), '18.5')
    await expect.element(page.getByRole('button', { name: 'Save', exact: true })).toBeEnabled()
  })

  it('round-trips a decimal weight value entered in either locale to the same stored kg value', async () => {
    const first = renderSheet(today)
    await userEvent.fill(page.getByLabelText('Weight', { exact: true }), '82.4')
    await userEvent.click(page.getByRole('button', { name: 'Save', exact: true }))
    await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(1)
    first.unmount()

    const [enEntry] = await getWeightRepository().getAll()
    expect(enEntry?.weight).toBe(82.4)

    i18n.global.locale.value = 'de'
    const second = renderSheet(yesterday)
    await userEvent.fill(page.getByLabelText('Weight', { exact: true }), '82,4')
    await userEvent.click(page.getByRole('button', { name: 'Save', exact: true }))

    await expect.poll(async () => (await getWeightRepository().getAll()).length).toBe(2)
    second.unmount()

    const deEntry = (await getWeightRepository().getAll()).find((entry) => entry.date === yesterday)
    expect(deEntry?.weight).toBe(82.4)
  })
})
