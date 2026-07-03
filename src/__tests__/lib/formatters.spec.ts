import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatBenchmarkType,
  formatDate,
  formatDuration,
  formatDurationHoursMinutes,
  formatDurationMinutes,
  formatRelativeDate,
  formatWeight,
} from '@/lib/formatters'

// Monday, June 15 2026, 12:00 local time — fixed so relative-date branches are deterministic
const NOW = new Date(2026, 5, 15, 12, 0, 0)

const DAY_MS = 24 * 60 * 60 * 1000

describe('formatters', () => {
  beforeEach(() => {
    vi.useFakeTimers({ now: NOW })
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('formatDate', () => {
    it('formats a timestamp as "MMM d, yyyy"', () => {
      expect(formatDate(NOW.getTime())).toBe('Jun 15, 2026')
    })
  })

  describe('formatDuration', () => {
    it('formats durations under an hour as m:ss', () => {
      expect(formatDuration(0)).toBe('0:00')
      expect(formatDuration(90)).toBe('1:30')
      expect(formatDuration(2730)).toBe('45:30')
    })

    it('formats durations of an hour or more as h:mm:ss', () => {
      expect(formatDuration(3600)).toBe('1:00:00')
      expect(formatDuration(5025)).toBe('1:23:45')
    })
  })

  describe('formatWeight', () => {
    it('shows plain numbers below 1000', () => {
      expect(formatWeight(0)).toBe('0')
      expect(formatWeight(45)).toBe('45')
      expect(formatWeight(999)).toBe('999')
    })

    it('abbreviates thousands with a k suffix', () => {
      expect(formatWeight(1000)).toBe('1.0k')
      expect(formatWeight(12_500)).toBe('12.5k')
    })
  })

  describe('formatBenchmarkType', () => {
    it('pluralizes rounds', () => {
      expect(formatBenchmarkType('fortime', 1)).toBe('For Time (1 round)')
      expect(formatBenchmarkType('fortime', 5)).toBe('For Time (5 rounds)')
    })
  })

  describe('formatRelativeDate', () => {
    it('returns "Today" for the current day', () => {
      expect(formatRelativeDate(NOW.getTime())).toBe('Today')
    })

    it('returns "Yesterday" for the previous day', () => {
      expect(formatRelativeDate(NOW.getTime() - DAY_MS)).toBe('Yesterday')
    })

    it('returns the weekday name within the last 7 days', () => {
      // June 12 2026 is a Friday
      expect(formatRelativeDate(NOW.getTime() - 3 * DAY_MS)).toBe('Friday')
    })

    it('omits the year for dates in the current year', () => {
      const january5 = new Date(2026, 0, 5).getTime()
      expect(formatRelativeDate(january5)).toBe('5 January')
    })

    it('includes the year for dates in previous years', () => {
      const lastYear = new Date(2025, 5, 15).getTime()
      expect(formatRelativeDate(lastYear)).toBe('15 June 2025')
    })
  })

  describe('formatDurationMinutes', () => {
    it('rounds seconds to whole minutes', () => {
      expect(formatDurationMinutes(2700)).toBe('45 min')
      expect(formatDurationMinutes(89)).toBe('1 min')
      expect(formatDurationMinutes(91)).toBe('2 min')
    })
  })

  describe('formatDurationHoursMinutes', () => {
    it('shows seconds for durations under a minute', () => {
      expect(formatDurationHoursMinutes(30)).toBe('30s')
      expect(formatDurationHoursMinutes(59)).toBe('59s')
    })

    it('shows minutes for durations under an hour', () => {
      expect(formatDurationHoursMinutes(0)).toBe('0m')
      expect(formatDurationHoursMinutes(2700)).toBe('45m')
    })

    it('shows hours and minutes when both are present', () => {
      expect(formatDurationHoursMinutes(9900)).toBe('2h 45m')
    })

    it('shows only hours when minutes are zero', () => {
      expect(formatDurationHoursMinutes(7200)).toBe('2h')
    })
  })
})
