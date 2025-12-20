import type {
  Equipment,
  ExerciseType,
  Metrics,
  MovementPattern,
  Muscle,
  PatternColor,
} from '@/types/exercises'
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

function getPatternLabel(pattern: MovementPattern): string {
  return i18n.global.t(`exercises.pattern.${pattern}`)
}

function getColorLabel(color: PatternColor): string {
  return i18n.global.t(`exercises.color.${color}`)
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

export const PATTERN_LABELS: Readonly<Record<MovementPattern, string>> = {
  get 'push-horizontal'() {
    return getPatternLabel('push-horizontal')
  },
  get 'push-vertical'() {
    return getPatternLabel('push-vertical')
  },
  get 'pull-horizontal'() {
    return getPatternLabel('pull-horizontal')
  },
  get 'pull-vertical'() {
    return getPatternLabel('pull-vertical')
  },
  get squat() {
    return getPatternLabel('squat')
  },
  get hinge() {
    return getPatternLabel('hinge')
  },
  get carry() {
    return getPatternLabel('carry')
  },
  get rotation() {
    return getPatternLabel('rotation')
  },
  get stability() {
    return getPatternLabel('stability')
  },
  get isolation() {
    return getPatternLabel('isolation')
  },
} as const

export const COLOR_LABELS: Readonly<Record<PatternColor, string>> = {
  get red() {
    return getColorLabel('red')
  },
  get orange() {
    return getColorLabel('orange')
  },
  get amber() {
    return getColorLabel('amber')
  },
  get green() {
    return getColorLabel('green')
  },
  get emerald() {
    return getColorLabel('emerald')
  },
  get cyan() {
    return getColorLabel('cyan')
  },
  get blue() {
    return getColorLabel('blue')
  },
  get indigo() {
    return getColorLabel('indigo')
  },
  get purple() {
    return getColorLabel('purple')
  },
  get pink() {
    return getColorLabel('pink')
  },
  get rose() {
    return getColorLabel('rose')
  },
  get slate() {
    return getColorLabel('slate')
  },
} as const
