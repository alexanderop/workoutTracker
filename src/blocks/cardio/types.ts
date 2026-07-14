/**
 * Runtime single source of truth for cardio activities: the union types, the
 * codec's zod enum, and the display list in `src/blocks/display.ts` all
 * derive from this tuple, so adding an activity propagates at compile time.
 */
export const CARDIO_ACTIVITY_VALUES = [
  'running',
  'cycling',
  'rowing',
  'elliptical',
  'swimming',
  'stairclimber',
  'walking',
] as const

export type CardioActivity = (typeof CARDIO_ACTIVITY_VALUES)[number]

export type CardioConfig = {
  activity: CardioActivity
  targetDurationSeconds: number | null
  targetDistanceMeters: number | null
}

type DbCardioActivity = (typeof CARDIO_ACTIVITY_VALUES)[number]

export type DbCardioConfig = {
  activity: DbCardioActivity
  targetDurationSeconds: number | null
  targetDistanceMeters: number | null
}

export type CardioResult = {
  actualDurationSeconds: number
  distanceMeters: number | null
  avgPaceSecondsPerKm: number | null
  calories: number | null
  notes: string | null
}

export type DbCardioResult = {
  actualDurationSeconds: number
  distanceMeters: number | null
  avgPaceSecondsPerKm: number | null
  calories: number | null
  notes: string | null
}

/**
 * Cardio has a result but is not a timed block.
 */
export type CardioBlock = {
  kind: 'cardio'
  id: number
  config: CardioConfig
  result: CardioResult | null
}

export type DbCardioBlock = {
  kind: 'cardio'
  id: string
  config: DbCardioConfig
  result: DbCardioResult | null
  orderIndex: number
}

/** Template counterpart: cardio templates carry only the config. */
export type DbTemplateCardioBlock = {
  kind: 'cardio'
  config: DbCardioConfig
}

// ============================================
// Markdown Parsed Intermediate (spec v1)
// ============================================

export type ParsedCardioBlock = {
  kind: 'cardio'
  name: string
  activity: string
  result: {
    actualDurationSeconds: number
    distanceMeters: number | null
    avgPaceSecondsPerKm: number | null
    calories: number | null
    notes: string | null
  } | null
}
