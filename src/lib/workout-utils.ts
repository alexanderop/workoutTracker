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
