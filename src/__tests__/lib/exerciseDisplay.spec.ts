import { describe, expect, it } from 'vitest'
import { getExerciseInitials } from '@/lib/exerciseDisplay'

describe('getExerciseInitials', () => {
  it('uses the first letter of the first two words', () => {
    expect(getExerciseInitials('Bench Press')).toBe('BP')
    expect(getExerciseInitials('Barbell Back Squat')).toBe('BB')
  })

  it('uses the first two letters of a single word', () => {
    expect(getExerciseInitials('Deadlift')).toBe('DE')
  })

  it('uppercases lowercase input', () => {
    expect(getExerciseInitials('bench press')).toBe('BP')
    expect(getExerciseInitials('deadlift')).toBe('DE')
  })

  it('ignores surrounding and repeated whitespace', () => {
    expect(getExerciseInitials('  Bench   Press  ')).toBe('BP')
  })

  it('falls back to a muscle emoji for empty names', () => {
    expect(getExerciseInitials('')).toBe('💪')
    expect(getExerciseInitials(' '.repeat(3))).toBe('💪')
  })

  it('handles a single character name', () => {
    expect(getExerciseInitials('x')).toBe('X')
  })
})
