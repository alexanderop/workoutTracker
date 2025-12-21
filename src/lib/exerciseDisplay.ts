/**
 * Generate 2-letter initials from an exercise name.
 * - Multi-word: first letter of each word ("Bench Press" → "BP")
 * - Single word: first two letters ("Deadlift" → "DE")
 */
export function getExerciseInitials(name: string): string {
  const trimmed = name.trim()
  if (!trimmed) return ''

  const words = trimmed.split(/\s+/)
  const firstWord = words[0]
  const secondWord = words[1]
  if (words.length >= 2 && firstWord && secondWord && firstWord[0] && secondWord[0]) {
    return (firstWord[0] + secondWord[0]).toUpperCase()
  }
  return trimmed.slice(0, 2).toUpperCase()
}

