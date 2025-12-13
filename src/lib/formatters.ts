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

/**
 * Format benchmark type for display.
 * Returns "For Time" for fortime type, or "X Rounds" for rounds type.
 */
export function formatBenchmarkType(type: 'fortime' | 'rounds', rounds: number): string {
  if (type === 'fortime') {
    return 'For Time'
  }
  return `${rounds} Rounds`
}

/**
 * Check if two dates are on the same calendar day.
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  )
}

/**
 * Format a timestamp to a relative date string.
 * Returns: "Today", "Yesterday", weekday name, or formatted date.
 */
export function formatRelativeDate(timestamp: number, locale?: string): string {
  const effectiveLocale = locale ?? i18n.global.locale.value ?? 'en'
  const t = i18n.global.t
  const date = new Date(timestamp)
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  // Today
  if (isSameDay(date, now)) {
    return t('common.dates.today')
  }

  // Yesterday
  if (isSameDay(date, yesterday)) {
    return t('common.dates.yesterday')
  }

  // Within last 7 days - show day name
  const daysDiff = Math.floor((now.getTime() - timestamp) / (1000 * 60 * 60 * 24))
  if (daysDiff < 7) {
    return date.toLocaleDateString(effectiveLocale, { weekday: 'long' })
  }

  // Older - show date without year if same year
  if (date.getFullYear() === now.getFullYear()) {
    return date.toLocaleDateString(effectiveLocale, { day: 'numeric', month: 'long' })
  }

  // Different year - include year
  return date.toLocaleDateString(effectiveLocale, { day: 'numeric', month: 'long', year: 'numeric' })
}

/**
 * Format seconds to minutes string (e.g., "45 min").
 */
export function formatDurationMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`
}
