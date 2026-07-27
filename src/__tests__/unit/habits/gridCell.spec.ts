import { describe, expect, it } from 'vitest'
import { habitDayCellClass } from '@/features/habits/lib/gridCell'

/**
 * Every habit heatmap paints through this one function, so what it guarantees
 * is that a day reading as "done" on the card reads as "done" on the tile too.
 * The states map to accent-derived CSS classes rather than to Tailwind colours,
 * which is what lets one habit's grid look different from another's.
 */
describe('habitDayCellClass', () => {
  it('gives each state its own accent-derived class', () => {
    expect(habitDayCellClass({ state: 'empty', isToday: false })).toEqual(['habit-grid-empty'])
    expect(habitDayCellClass({ state: 'partial', isToday: false })).toEqual(['habit-grid-partial'])
    expect(habitDayCellClass({ state: 'complete', isToday: false })).toEqual([
      'habit-grid-complete',
    ])
  })

  it('marks today so the cell can be ringed, whatever its state', () => {
    expect(habitDayCellClass({ state: 'empty', isToday: true })).toContain('habit-today-ring')
    expect(habitDayCellClass({ state: 'complete', isToday: true })).toContain('habit-today-ring')
  })

  it('dims a day that has not happened yet rather than blanking it', () => {
    const classes = habitDayCellClass({ state: 'future', isToday: false })

    expect(classes).toContain('habit-grid-empty')
    expect(classes.some((cellClass) => cellClass.startsWith('opacity-'))).toBe(true)
  })

  it("dims a month grid's padding days, and only those", () => {
    expect(habitDayCellClass({ state: 'complete', isToday: false, inMonth: true })).toEqual([
      'habit-grid-complete',
    ])

    // A padding day keeps its state -- it is real history, not a blank -- and
    // gains dimming on top. Asserting only that the two differ would pass for
    // any unrelated extra class, including one that dropped the state.
    const padding = habitDayCellClass({ state: 'complete', isToday: false, inMonth: false })
    expect(padding).toContain('habit-grid-complete')
    expect(padding.filter((cellClass) => cellClass.includes('opacity-'))).toHaveLength(1)
  })

  /**
   * A day can be both out-of-month and in the future -- the padding row at the
   * end of the current month is exactly that. Two opacity utilities on one cell
   * is a contradiction resolved by whichever Tailwind happened to emit last.
   */
  it('never stacks two dimming classes on one cell', () => {
    const classes = habitDayCellClass({ state: 'future', isToday: false, inMonth: false })
    const dimming = classes.filter((cellClass) => cellClass.includes('opacity-'))

    expect(dimming).toHaveLength(1)
  })
})
