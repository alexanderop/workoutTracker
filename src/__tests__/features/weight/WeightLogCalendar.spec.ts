import { render } from 'vitest-browser-vue'
import { page, userEvent } from 'vitest/browser'
import { describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import WeightLogCalendar from '@/features/weight/components/WeightLogCalendar.vue'
import { getStartOfDay } from '@/lib/date'
import { i18n } from '@/i18n'
import en from '@/i18n/messages/en'

describe('WeightLogCalendar', () => {
  // Setup i18n for all tests
  i18n.global.setLocaleMessage('en', en)
  i18n.global.locale.value = 'en'

  // Pinned July 2026 fixture — never derived from Date.now().
  const visibleMonth = new Date(2026, 6, 1).getTime()
  const selectedDay = getStartOfDay(new Date(2026, 6, 15))
  const maxDay = getStartOfDay(new Date(2026, 6, 20))

  function renderCalendar() {
    return render(WeightLogCalendar, {
      props: { selectedDay, visibleMonth, maxDay },
      global: { plugins: [i18n] },
    })
  }

  it('renders the month heading for the visible month', async () => {
    renderCalendar()

    await expect
      .element(page.getByRole('heading', { name: 'July 2026', exact: true }))
      .toBeVisible()
  })

  it('renders a Monday-first weekday header row', () => {
    const { container } = renderCalendar()

    // eslint-disable-next-line no-restricted-syntax -- weekday header cells have no distinguishing accessible role/name; the head-cell slot is the calendar's public rendered contract
    const headCells = container.querySelectorAll('[data-slot="calendar-head-cell"]')
    const labels = [...headCells].map((cell) => cell.textContent?.trim())

    expect(labels).toEqual(['M', 'T', 'W', 'T', 'F', 'S', 'S'])
  })

  it('marks the day matching selectedDay as selected', () => {
    const { container } = renderCalendar()

    // eslint-disable-next-line no-restricted-syntax -- data-selected is the calendar's frozen rendered contract (CalendarCellTrigger.vue); no accessible-role locator exposes selection state
    const cell = container.querySelector('[data-value="2026-07-15"]')

    expect(cell).not.toBeNull()
    expect(cell?.hasAttribute('data-selected')).toBe(true)
  })

  it('renders a day after maxDay as disabled and emits no select when clicked', async () => {
    const { container, emitted } = renderCalendar()

    // eslint-disable-next-line no-restricted-syntax -- data-disabled is the calendar's frozen rendered contract (CalendarCellTrigger.vue); no accessible-role locator exposes disabled state
    const futureDay = container.querySelector<HTMLElement>('[data-value="2026-07-21"]')

    expect(futureDay).not.toBeNull()
    expect(futureDay?.hasAttribute('data-disabled')).toBe(true)

    futureDay?.click()
    await nextTick()

    expect(emitted('select')).toBeUndefined()
  })

  it('emits select with the clicked day start-of-day timestamp', async () => {
    const { container, emitted } = renderCalendar()

    // eslint-disable-next-line no-restricted-syntax -- data-value is the calendar's frozen rendered contract (CalendarCellTrigger.vue); it targets a specific day deterministically without reconstructing its full accessible name
    const selectableDay = container.querySelector<HTMLElement>('[data-value="2026-07-10"]')

    expect(selectableDay).not.toBeNull()

    selectableDay?.click()
    await nextTick()

    const events = emitted<[number]>('select')
    expect(events?.[0]).toEqual([getStartOfDay(new Date(2026, 6, 10))])
  })

  it('renders adjacent-month days marked as outside-view', () => {
    const { container } = renderCalendar()

    // eslint-disable-next-line no-restricted-syntax -- data-outside-view is the calendar's frozen rendered contract (CalendarCellTrigger.vue); no accessible-role locator exposes adjacent-month state
    const leadingDay = container.querySelector('[data-value="2026-06-29"]')

    expect(leadingDay).not.toBeNull()
    expect(leadingDay?.hasAttribute('data-outside-view')).toBe(true)
  })

  it('emits previous-month and next-month when the chevron buttons are clicked', async () => {
    const { emitted } = renderCalendar()

    await userEvent.click(page.getByRole('button', { name: 'Previous month' }))
    await userEvent.click(page.getByRole('button', { name: 'Next month' }))

    expect(emitted('previous-month')).toHaveLength(1)
    expect(emitted('next-month')).toHaveLength(1)
  })

  it('emits go-back when "Go Back" is clicked', async () => {
    const { emitted } = renderCalendar()

    await userEvent.click(page.getByRole('button', { name: 'Go Back' }))

    expect(emitted('go-back')).toHaveLength(1)
  })

  it('emits go-to-today when "Go to Today" is clicked', async () => {
    const { emitted } = renderCalendar()

    await userEvent.click(page.getByRole('button', { name: 'Go to Today' }))

    expect(emitted('go-to-today')).toHaveLength(1)
  })
})
