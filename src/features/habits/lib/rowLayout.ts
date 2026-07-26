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
 * The heatmap column is 7rem, not the 5.5rem it was while the cells were
 * unlabelled. Seven columns and six 4px gaps inside 5.5rem leave 9.14px per
 * day, which is narrower than any weekday label and a digit pair -- the header
 * text overflowed and painted over its neighbours, so the week read as one
 * smeared word. 7rem gives 12.5px, which fits a narrow weekday over a
 * two-digit date.
 */
export const HABIT_ROW_GRID_COLUMNS = 'grid-cols-[auto_minmax(0,1fr)_7rem_auto]'

/** Cells in a compact row's heatmap -- one calendar week, Monday to Sunday. */
export const HABIT_ROW_DAYS = 7
