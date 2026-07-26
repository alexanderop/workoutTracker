/**
 * Paint for a single day cell, shared by every habit heatmap.
 *
 * Exported as one function rather than repeated per grid component because the
 * three surfaces (16-week card, this-week row, tile month) differ only in
 * *layout* -- a day that reads as "done" on one of them and as "nothing logged"
 * on another is a bug, and three copies of a class ternary is how that happens.
 *
 * Every class here resolves against `--habit-accent`, so a grid only paints
 * inside a subtree carrying `data-habit-accent`.
 */
import type { HabitGridDay } from './habitGrid'

const CELL_STATE_CLASS = {
  empty: 'habit-grid-empty',
  partial: 'habit-grid-partial',
  complete: 'habit-grid-complete',
  /**
   * Days that haven't happened yet still occupy the grid, at a fraction of the
   * empty tint. Rendering them transparent instead leaves the current week (and
   * the tail of the current month) visibly ragged, which reads as missing data
   * rather than as time that hasn't passed.
   */
  future: 'habit-grid-empty opacity-40',
} as const

/** Extra dimming for a day outside the month a month-grid is captioned with. */
const OUT_OF_MONTH_CLASS = 'opacity-40'

export function habitDayCellClass(
  day: Pick<HabitGridDay, 'state' | 'isToday'> & { inMonth?: boolean },
): Array<string> {
  const classes: Array<string> = [CELL_STATE_CLASS[day.state]]
  if (day.inMonth === false) classes.push(OUT_OF_MONTH_CLASS)
  if (day.isToday) classes.push('habit-today-ring')
  return classes
}
