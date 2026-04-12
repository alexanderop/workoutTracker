/**
 * Streak calculation result.
 */
export type StreakInfo = {
  current: number
  longest: number
  hasEverTrained: boolean
}

/**
 * Intensity levels for heatmap cells.
 * 0 = no workouts, 1 = 1 workout, 2 = 2, 3 = 3, 4 = 4+
 */
export type HeatmapIntensity = 0 | 1 | 2 | 3 | 4

/**
 * A single cell in the activity heatmap.
 */
export type HeatmapCell = {
  date: Date
  dateKey: string
  count: number
  intensity: HeatmapIntensity
  inRange: boolean
}

/**
 * 2D heatmap grid.
 * Outer array indexed by weekday (0=Mon..6=Sun). Inner indexed by week.
 */
export type HeatmapGrid = {
  weeks: ReadonlyArray<ReadonlyArray<HeatmapCell>>
  rangeStart: Date
  rangeEnd: Date
  totalWorkouts: number
}
