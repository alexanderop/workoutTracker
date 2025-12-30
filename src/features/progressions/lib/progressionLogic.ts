import type { DbProgression } from '@/db/schema'
import type { ProgressionLevel, ProgressionPhase } from '../types'

/**
 * Get the current level for display.
 */
export function getCurrentLevel(progression: DbProgression): ProgressionLevel {
  return {
    weight: progression.availableWeights[progression.currentWeightIndex] ?? 0,
    reps: progression.currentReps,
    minutes: progression.currentMinutes,
  }
}

/**
 * Determine which phase of progression we're in.
 */
export function getProgressionPhase(progression: DbProgression): ProgressionPhase {
  if (progression.isComplete) {
    return 'complete'
  }
  if (progression.currentReps < progression.maxReps) {
    return 'reps'
  }
  return 'time'
}

/**
 * Calculate total sessions needed to complete all kettlebells.
 * Each KB requires:
 * - (maxReps - startReps) / repIncrement + 1 rep phases
 * - (maxMinutes - startMinutes) / minuteIncrement time phases
 */
function calculateTotalSessions(progression: DbProgression): number {
  const repSessions = (progression.maxReps - progression.startReps) / progression.repIncrement + 1
  const timeSessions = (progression.maxMinutes - progression.startMinutes) / progression.minuteIncrement
  const sessionsPerKB = repSessions + timeSessions
  return sessionsPerKB * progression.availableWeights.length
}

/**
 * Estimate current progress as a percentage.
 */
export function calculateProgress(progression: DbProgression): number {
  if (progression.isComplete) return 100

  const total = calculateTotalSessions(progression)
  if (total === 0) return 0

  return Math.round((progression.sessionsCompleted / total) * 100)
}

/**
 * Format level for compact display.
 * @example "16kg • 12 reps • 10 min"
 */
export function formatLevelCompact(level: ProgressionLevel): string {
  return `${level.weight}kg • ${level.reps} reps • ${level.minutes} min`
}
