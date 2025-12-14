import { format, isToday, isYesterday, differenceInDays, isSameYear } from 'date-fns'
import { i18n } from '@/i18n'
import { getCurrentLocale, getDateLocale } from './dateLocale'

/**
 * Format a timestamp to a human-readable date string.
 */
export function formatDate(timestamp: number): string {
  const locale = getCurrentLocale()
  return format(new Date(timestamp), 'MMM d, yyyy', { locale: getDateLocale(locale) })
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
 * Format a timestamp to a relative date string.
 * Returns: "Today", "Yesterday", weekday name, or formatted date.
 */
export function formatRelativeDate(timestamp: number): string {
  const locale = getCurrentLocale()
  const dateLocale = getDateLocale(locale)
  const t = i18n.global.t
  const date = new Date(timestamp)
  const now = new Date()

  if (isToday(date)) {
    return t('common.dates.today')
  }

  if (isYesterday(date)) {
    return t('common.dates.yesterday')
  }

  // Within last 7 days - show day name
  if (differenceInDays(now, date) < 7) {
    return format(date, 'EEEE', { locale: dateLocale })
  }

  // Same year - show date without year
  if (isSameYear(date, now)) {
    return format(date, 'd MMMM', { locale: dateLocale })
  }

  // Different year - include year
  return format(date, 'd MMMM yyyy', { locale: dateLocale })
}

/**
 * Format seconds to minutes string (e.g., "45 min").
 */
export function formatDurationMinutes(seconds: number): string {
  return `${Math.round(seconds / 60)} min`
}

/**
 * Format seconds to hours, minutes, and seconds string (e.g., "2h 45m", "45m", or "30s").
 */
export function formatDurationHoursMinutes(seconds: number): string {
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  // Less than 1 minute - show seconds
  if (seconds > 0 && seconds < 60) {
    return `${seconds}s`
  }

  if (hours > 0 && minutes > 0) {
    return `${hours}h ${minutes}m`
  }
  if (hours > 0) {
    return `${hours}h`
  }
  return `${minutes}m`
}
