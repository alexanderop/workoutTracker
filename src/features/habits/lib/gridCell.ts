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
  future: 'habit-grid-empty',
} as const

/**
 * Days that don't belong to the window being read: still to come, or a
 * neighbouring month's padding in a month grid. Dimmed rather than blanked --
 * rendering them transparent leaves the current week and the tail of the month
 * visibly ragged, which reads as missing data rather than as time that hasn't
 * passed.
 *
 * A single class covering both reasons, applied once: a day can be out-of-month
 * *and* in the future, and two dim classes on one cell is a contradiction
 * waiting to be resolved by whichever Tailwind emitted last. Below
 * `habit-grid-partial`'s 40% so a padded-in complete day stays distinguishable
 * from a partial one.
 */
const DIMMED_CLASS = 'opacity-30'

export function habitDayCellClass(
  day: Pick<HabitGridDay, 'state' | 'isToday'> & { inMonth?: boolean },
): Array<string> {
  const classes: Array<string> = [CELL_STATE_CLASS[day.state]]
  if (day.state === 'future' || day.inMonth === false) classes.push(DIMMED_CLASS)
  if (day.isToday) classes.push('habit-today-ring')
  return classes
}
