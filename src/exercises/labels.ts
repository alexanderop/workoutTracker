import type { Equipment, ExerciseType, Metrics, Muscle } from './types'
import { i18n } from '@/i18n'

function getEquipmentLabel(equipment: Equipment): string {
  return i18n.global.t(`exercises.equipment.${equipment}`)
}

function getMuscleLabel(muscle: Muscle): string {
  return i18n.global.t(`exercises.muscle.${muscle}`)
}

function getTypeLabel(type: ExerciseType): string {
  return i18n.global.t(`exercises.type.${type}`)
}

function getMetricsLabel(metrics: Metrics): string {
  return i18n.global.t(`exercises.metrics.${metrics}`)
}

// Legacy exports for backward compatibility - these now return translated values
export const EQUIPMENT_LABELS: Readonly<Record<Equipment, string>> = {
  get barbell() {
    return getEquipmentLabel('barbell')
  },
  get dumbbell() {
    return getEquipmentLabel('dumbbell')
  },
  get machine() {
    return getEquipmentLabel('machine')
  },
  get cable() {
    return getEquipmentLabel('cable')
  },
  get bodyweight() {
    return getEquipmentLabel('bodyweight')
  },
  get kettlebell() {
    return getEquipmentLabel('kettlebell')
  },
  get band() {
    return getEquipmentLabel('band')
  },
  get 'ez-bar'() {
    return getEquipmentLabel('ez-bar')
  },
  get 'hex-bar'() {
    return getEquipmentLabel('hex-bar')
  },
  get club() {
    return getEquipmentLabel('club')
  },
  get 'battle-rope'() {
    return getEquipmentLabel('battle-rope')
  },
  get egym() {
    return getEquipmentLabel('egym')
  },
} as const

export const MUSCLE_LABELS: Readonly<Record<Muscle, string>> = {
  get chest() {
    return getMuscleLabel('chest')
  },
  get back() {
    return getMuscleLabel('back')
  },
  get legs() {
    return getMuscleLabel('legs')
  },
  get shoulders() {
    return getMuscleLabel('shoulders')
  },
  get arms() {
    return getMuscleLabel('arms')
  },
  get core() {
    return getMuscleLabel('core')
  },
} as const

export const TYPE_LABELS: Readonly<Record<ExerciseType, string>> = {
  get compound() {
    return getTypeLabel('compound')
  },
  get isolation() {
    return getTypeLabel('isolation')
  },
  get stability() {
    return getTypeLabel('stability')
  },
  get isometric() {
    return getTypeLabel('isometric')
  },
  get cardio() {
    return getTypeLabel('cardio')
  },
} as const

export const METRICS_LABELS: Readonly<Record<Metrics, string>> = {
  get 'weight-reps'() {
    return getMetricsLabel('weight-reps')
  },
  get 'reps-only'() {
    return getMetricsLabel('reps-only')
  },
  get duration() {
    return getMetricsLabel('duration')
  },
  get 'distance-duration'() {
    return getMetricsLabel('distance-duration')
  },
  get 'weight-distance'() {
    return getMetricsLabel('weight-distance')
  },
} as const
