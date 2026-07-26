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
 */
export const HABIT_ROW_GRID_COLUMNS = 'grid-cols-[auto_minmax(0,1fr)_5.5rem_auto]'

/** Cells in a compact row's heatmap -- one calendar week, Monday to Sunday. */
export const HABIT_ROW_DAYS = 7
