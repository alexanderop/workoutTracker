/**
 * Domain types for kettlebell swing progression feature.
 * These types are used in the application logic and UI.
 * For database types, see src/db/schema.ts (DbProgression, DbProgressionSession).
 */

/**
 * Current level in a progression (for display purposes).
 */
export type ProgressionLevel = {
  weight: number // kg
  reps: number // reps per minute
  minutes: number // total EMOM minutes
}

/**
 * Phase of the progression algorithm.
 */
export type ProgressionPhase = 'reps' | 'time' | 'complete'
