/**
 * Generate a default workout name based on the current time of day.
 * Returns names like "Morning Workout", "Afternoon Workout", "Evening Workout"
 */
export function getDefaultWorkoutName(date: Date = new Date()): string {
  const hour = date.getHours()

  if (hour >= 5 && hour < 12) {
    return 'Morning Workout'
  }
  if (hour >= 12 && hour < 17) {
    return 'Afternoon Workout'
  }
  if (hour >= 17 && hour < 21) {
    return 'Evening Workout'
  }
  return 'Night Workout'
}
