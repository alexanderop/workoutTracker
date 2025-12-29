import type { DbProgression } from '@/db/schema'
import type { NextLevelResult, ProgressionLevel, ProgressionPhase } from '../types'

/**
 * Calculate the next level after a successful session.
 * Progression order: reps → time → weight
 *
 * @example
 * // At 10 reps, 10 min → next is 12 reps, 10 min
 * // At 20 reps, 10 min → next is 20 reps, 12 min
 * // At 20 reps, 20 min → next KB, reset to 10 reps, 10 min
 */
export function calculateNextLevel(progression: DbProgression): NextLevelResult {
  // Phase 1: Increasing reps (10→12→14→16→18→20)
  if (progression.currentReps < progression.maxReps) {
    return {
      reps: progression.currentReps + progression.repIncrement,
      minutes: progression.currentMinutes,
      weightIndex: progression.currentWeightIndex,
      isComplete: false,
    }
  }

  // Phase 2: At max reps, increase time (10→12→...→20 min)
  if (progression.currentMinutes < progression.maxMinutes) {
    return {
      reps: progression.maxReps, // Stay at max reps
      minutes: progression.currentMinutes + progression.minuteIncrement,
      weightIndex: progression.currentWeightIndex,
      isComplete: false,
    }
  }

  // Phase 3: Both maxed → next kettlebell
  const nextWeightIndex = progression.currentWeightIndex + 1
  if (nextWeightIndex >= progression.availableWeights.length) {
    // All kettlebells completed!
    return {
      reps: progression.currentReps,
      minutes: progression.currentMinutes,
      weightIndex: progression.currentWeightIndex,
      isComplete: true,
    }
  }

  // Reset to starting values with new weight
  return {
    reps: progression.startReps,
    minutes: progression.startMinutes,
    weightIndex: nextWeightIndex,
    isComplete: false,
  }
}

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
export function calculateTotalSessions(progression: DbProgression): number {
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
