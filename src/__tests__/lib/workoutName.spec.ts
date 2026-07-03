import { describe, expect, it } from 'vitest'
import { getDefaultWorkoutName } from '@/lib/workoutName'

function dateAtHour(hour: number, minute = 0): Date {
  return new Date(2026, 5, 15, hour, minute)
}

describe('getDefaultWorkoutName', () => {
  it.each([
    [5, 'Morning Workout'],
    [8, 'Morning Workout'],
    [11, 'Morning Workout'],
    [12, 'Afternoon Workout'],
    [14, 'Afternoon Workout'],
    [16, 'Afternoon Workout'],
    [17, 'Evening Workout'],
    [19, 'Evening Workout'],
    [20, 'Evening Workout'],
    [21, 'Night Workout'],
    [23, 'Night Workout'],
    [0, 'Night Workout'],
    [4, 'Night Workout'],
  ])('returns "%s" workout name for hour %i', (hour, expected) => {
    expect(getDefaultWorkoutName(dateAtHour(hour))).toBe(expected)
  })

  it('treats the last minute of a period as still in that period', () => {
    expect(getDefaultWorkoutName(dateAtHour(11, 59))).toBe('Morning Workout')
    expect(getDefaultWorkoutName(dateAtHour(16, 59))).toBe('Afternoon Workout')
    expect(getDefaultWorkoutName(dateAtHour(20, 59))).toBe('Evening Workout')
    expect(getDefaultWorkoutName(dateAtHour(4, 59))).toBe('Night Workout')
  })

  it('defaults to the current time when no date is given', () => {
    const expected = getDefaultWorkoutName(new Date())
    expect(getDefaultWorkoutName()).toBe(expected)
  })
})
