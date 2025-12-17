/**
 * Comparison data added to each benchmark attempt.
 */
export type AttemptComparison = {
  delta: number | null // seconds diff from PB (null if this IS the PB)
  isFaster: boolean
}

/**
 * Raw attempt data from the database.
 */
export type RawAttempt = {
  id: string
  completedAt: number
  completionTime: number
  isPersonalBest: boolean
}

/**
 * Attempt with comparison data for display.
 */
export type AttemptWithComparison = RawAttempt & {
  comparison: AttemptComparison
}

/**
 * Calculate the personal best time from a list of attempts.
 * Pure function - no state dependencies.
 */
export function calculatePbTime(attempts: ReadonlyArray<RawAttempt>): number {
  if (attempts.length === 0) {
    return Infinity
  }
  return Math.min(...attempts.map((a) => a.completionTime))
}

/**
 * Create comparison data for a single attempt.
 * Pure function - no state dependencies.
 *
 * @param attempt - Raw attempt data
 * @param pbTime - Personal best time for comparison
 * @returns Attempt with comparison data
 */
export function createAttemptComparison(attempt: RawAttempt, pbTime: number): AttemptWithComparison {
  return {
    ...attempt,
    comparison: {
      delta: attempt.isPersonalBest ? null : attempt.completionTime - pbTime,
      isFaster: attempt.completionTime < pbTime,
    },
  }
}

/**
 * Transform raw attempts to include comparison data.
 * Pure function - no state dependencies.
 */
export function transformAttempts(attempts: ReadonlyArray<RawAttempt>): Array<AttemptWithComparison> {
  if (attempts.length === 0) {
    return []
  }

  const pbTime = calculatePbTime(attempts)
  return attempts.map((attempt) => createAttemptComparison(attempt, pbTime))
}
