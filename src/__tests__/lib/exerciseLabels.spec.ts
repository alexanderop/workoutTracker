import { afterEach, describe, expect, it } from 'vitest'
import { EQUIPMENT_LABELS, METRICS_LABELS, MUSCLE_LABELS, TYPE_LABELS } from '@/lib/exerciseLabels'
import { i18n } from '@/i18n'

describe('exerciseLabels', () => {
  afterEach(() => {
    i18n.global.locale.value = 'en'
  })

  it('translates all equipment labels', () => {
    expect({ ...EQUIPMENT_LABELS }).toEqual({
      barbell: 'Barbell',
      dumbbell: 'Dumbbell',
      machine: 'Machine',
      cable: 'Cable',
      bodyweight: 'Bodyweight',
      kettlebell: 'Kettlebell',
      band: 'Band',
      'ez-bar': 'EZ Bar',
      'hex-bar': 'Hex Bar',
      club: 'Club',
      'battle-rope': 'Battle Rope',
    })
  })

  it('translates all muscle labels', () => {
    expect({ ...MUSCLE_LABELS }).toEqual({
      chest: 'Chest',
      back: 'Back',
      legs: 'Legs',
      shoulders: 'Shoulders',
      arms: 'Arms',
      core: 'Core',
    })
  })

  it('translates all exercise type labels', () => {
    expect({ ...TYPE_LABELS }).toEqual({
      compound: 'Compound Movement',
      isolation: 'Isolation Movement',
      stability: 'Stability/Core',
      isometric: 'Isometric',
      cardio: 'Cardio',
    })
  })

  it('translates all metrics labels', () => {
    expect({ ...METRICS_LABELS }).toEqual({
      'weight-reps': 'Weight + Reps',
      'reps-only': 'Reps Only',
      duration: 'Duration',
      'distance-duration': 'Distance + Duration',
      'weight-distance': 'Weight + Distance',
    })
  })

  it('resolves labels lazily against the active locale', async () => {
    const { loadLocale } = await import('@/i18n')
    await loadLocale('de')

    expect(EQUIPMENT_LABELS.barbell).toBe(i18n.global.t('exercises.equipment.barbell'))
    expect(EQUIPMENT_LABELS.barbell).not.toBe('')
  })
})
