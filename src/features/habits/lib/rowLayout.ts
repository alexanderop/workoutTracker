/**
 * The column geometry shared by a compact habit row and the date header above
 * it.
 *
 * Exported as one constant rather than repeated in both components because the
 * header is only useful if it lines up cell-for-cell with the heatmap beneath
 * it -- two copies of a Tailwind template drift, and a header that is one
 * column out is worse than no header at all.
 *
 * Columns: icon | name (flexible) | 7-day heatmap | check control.
 *
 * Two variants, because only one of the two surfaces has a header to align to:
 *
 * - `comfortable` (the `/habits` rows layout) uses a 7rem heatmap track. Seven
 *   columns and six 4px gaps inside the old 5.5rem left 9.14px per day, which is
 *   narrower than any weekday label plus a digit pair -- the header text
 *   overflowed and painted over its neighbours, so the week read as one smeared
 *   word. 7rem gives 12.5px, enough for a narrow weekday over a two-digit date.
 * - `compact` (the home card) keeps 5.5rem. It renders no header, so it needs no
 *   room for labels, and widening the track there would narrow its name column
 *   and change a screen this work deliberately left alone.
 */
export const HABIT_ROW_GRID_COLUMNS = {
  comfortable: 'grid-cols-[auto_minmax(0,1fr)_7rem_auto]',
  compact: 'grid-cols-[auto_minmax(0,1fr)_5.5rem_auto]',
} as const

export type HabitRowDensity = keyof typeof HABIT_ROW_GRID_COLUMNS

/** Cells in a compact row's heatmap -- one calendar week, Monday to Sunday. */
export const HABIT_ROW_DAYS = 7
