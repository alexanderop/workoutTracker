/**
 * Calculate estimated 1-rep max using the Epley formula
 * 1RM = weight × (1 + (reps / 30))
 */
export function calculate10RM(kg: number, reps: number): number {
  if (kg === 0 || reps === 0) return 0
  return Math.round(kg * (1 + reps / 30) * 10) / 10
}

/**
 * Format seconds into MM:SS format
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format seconds into workout duration string.
 * Under 1 hour: m:ss (e.g., "5:30", "45:30")
 * 1 hour+: h:mm:ss (e.g., "1:23:45")
 */
export function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}
