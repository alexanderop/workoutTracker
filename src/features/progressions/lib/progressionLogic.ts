import type { DbProgression } from '@/db/schema'
import type { NextLevelResult, ProgressionLevel, ProgressionPhase } from '../types'

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
 * Calculate the next level after a successful session.
 * Progression order: reps → time → weight
 */
export function calculateNextLevel(current: DbProgression): NextLevelResult {
  // Phase 1: Increasing reps (10→12→14→16→18→20)
  if (current.currentReps < current.maxReps) {
    return {
      reps: current.currentReps + current.repIncrement,
      minutes: current.currentMinutes,
      weightIndex: current.currentWeightIndex,
      isComplete: false,
    }
  }

  // Phase 2: At max reps, increase time (10→12→...→20 min)
  if (current.currentMinutes < current.maxMinutes) {
    return {
      reps: current.maxReps, // Stay at max reps
      minutes: current.currentMinutes + current.minuteIncrement,
      weightIndex: current.currentWeightIndex,
      isComplete: false,
    }
  }

  // Phase 3: Both maxed → next kettlebell
  const nextWeightIndex = current.currentWeightIndex + 1
  if (nextWeightIndex >= current.availableWeights.length) {
    // All kettlebells completed!
    return {
      reps: current.currentReps,
      minutes: current.currentMinutes,
      weightIndex: current.currentWeightIndex,
      isComplete: true,
    }
  }

  // Reset to starting values with new weight
  return {
    reps: current.startReps,
    minutes: current.startMinutes,
    weightIndex: nextWeightIndex,
    isComplete: false,
  }
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
