import { i18n } from '@/i18n'

/**
 * Format a timestamp to a human-readable date string.
 */
export function formatDate(timestamp: number): string {
  const locale = i18n.global.locale.value || 'en'
  return new Date(timestamp).toLocaleDateString(locale, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

/**
 * Format seconds into a duration string (HH:MM:SS or MM:SS).
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Format weight with k suffix for thousands.
 */
export function formatWeight(weight: number): string {
  if (weight >= 1000) {
    return `${(weight / 1000).toFixed(1)}k`
  }
  return weight.toLocaleString()
}
