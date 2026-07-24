import { describe, expect, it } from 'vitest'
import { isSetReady, isSetReadyForDuration } from '@/features/workout/lib/workoutSetValidation'
import type { Set } from '@/types/workout'

function createSet(values: Partial<Set> = {}): Set {
  return {
    id: 1,
    kg: '40',
    reps: '8',
    duration: '',
    rir: '2',
    status: 'active',
    ...values,
  }
}

describe('workout set validation', () => {
  it('accepts completed strength input including zero weight and zero RIR', () => {
    expect(isSetReady(createSet({ kg: '0', rir: '0' }))).toBe(true)
  })

  it.each([
    ['blank weight', { kg: '' }],
    ['negative weight', { kg: '-1' }],
    ['zero reps', { reps: '0' }],
    ['blank RIR', { rir: '' }],
    ['negative RIR', { rir: '-1' }],
  ])('rejects %s', (_label, values) => {
    expect(isSetReady(createSet(values))).toBe(false)
  })

  it('accepts positive durations without requiring strength metrics', () => {
    expect(isSetReadyForDuration(createSet({ kg: '', reps: '', rir: '', duration: '30' }))).toBe(
      true,
    )
  })

  it.each(['', '0', '-1'])('rejects duration %s', (duration) => {
    expect(isSetReadyForDuration(createSet({ duration }))).toBe(false)
  })
})
