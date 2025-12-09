/**
 * Pure business logic for split time tracking
 */
export function createSplitTracker() {
  const splits: Array<number> = []

  function recordSplit(elapsedSeconds: number): void {
    splits.push(elapsedSeconds)
  }

  function getSplits(): ReadonlyArray<number> {
    return Object.freeze([...splits])
  }

  function reset(): void {
    splits.length = 0
  }

  return { recordSplit, getSplits, reset }
}

/**
 * Check if benchmark has no previous attempts
 */
export function isFirstBenchmarkAttempt(
  attemptHistory: ReadonlyArray<unknown>,
): boolean {
  return attemptHistory.length === 0
}
