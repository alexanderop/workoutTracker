import type { Component } from 'vue'

import type { Equipment, ExerciseType, Metrics, Muscle } from '@/types/exercises'

import MdiArmFlex from '~icons/mdi/arm-flex'
import MdiArmFlexOutline from '~icons/mdi/arm-flex-outline'
import MdiBarbell from '~icons/mdi/barbell'
import MdiCableData from '~icons/mdi/cable-data'
import MdiCog from '~icons/mdi/cog'
import MdiDumbbell from '~icons/mdi/dumbbell'
import MdiHexagonOutline from '~icons/mdi/hexagon-outline'
import MdiHuman from '~icons/mdi/human'
import MdiHumanHandsup from '~icons/mdi/human-handsup'
import MdiKeyboardBackspace from '~icons/mdi/keyboard-backspace'
import MdiKettlebell from '~icons/mdi/kettlebell'
import MdiResistor from '~icons/mdi/resistor'
import MdiStar from '~icons/mdi/star'
import MdiWalk from '~icons/mdi/walk'
import MdiWeightLifter from '~icons/mdi/weight-lifter'

export type SelectorOption<T extends string = string> = {
  value: T
  label: string
  icon?: Component
  description?: string
}

export const EQUIPMENT_OPTIONS: ReadonlyArray<SelectorOption<Equipment>> = [
  { value: 'barbell', label: 'Barbell', icon: MdiWeightLifter },
  { value: 'dumbbell', label: 'Dumbbell', icon: MdiDumbbell },
  { value: 'machine', label: 'Machine', icon: MdiCog },
  { value: 'cable', label: 'Cable', icon: MdiCableData },
  { value: 'bodyweight', label: 'Bodyweight', icon: MdiHumanHandsup },
  { value: 'kettlebell', label: 'Kettlebell', icon: MdiKettlebell },
  { value: 'band', label: 'Band', icon: MdiResistor },
  { value: 'ez-bar', label: 'EZ Bar', icon: MdiBarbell },
  { value: 'hex-bar', label: 'Hex Bar', icon: MdiHexagonOutline },
]

export const MUSCLE_OPTIONS: ReadonlyArray<SelectorOption<Muscle>> = [
  { value: 'chest', label: 'Chest', icon: MdiHuman },
  { value: 'back', label: 'Back', icon: MdiKeyboardBackspace },
  { value: 'legs', label: 'Legs', icon: MdiWalk },
  { value: 'shoulders', label: 'Shoulders', icon: MdiArmFlex },
  { value: 'arms', label: 'Arms', icon: MdiArmFlexOutline },
  { value: 'core', label: 'Core', icon: MdiStar },
]

export const TYPE_OPTIONS: ReadonlyArray<SelectorOption<ExerciseType>> = [
  {
    value: 'compound',
    label: 'Compound Movement',
    description: 'Complex, multi-joint lifts like Squats/Bench',
  },
  {
    value: 'isolation',
    label: 'Isolation Movement',
    description: 'Single-joint lifts like Curls/Extensions',
  },
  { value: 'stability', label: 'Stability/Core', description: 'Planks, static holds' },
  { value: 'cardio', label: 'Cardio', description: 'Running, Jumping Jacks' },
]

export const METRICS_OPTIONS: ReadonlyArray<SelectorOption<Metrics>> = [
  {
    value: 'weight-reps',
    label: 'Weight + Reps',
    description: 'Standard lifting (e.g., 5kg x 10 reps)',
  },
  { value: 'reps-only', label: 'Reps Only', description: 'Bodyweight volume (e.g., 10 reps)' },
  { value: 'duration', label: 'Duration', description: 'Time-based (e.g., Planks for 60 seconds)' },
  {
    value: 'distance-duration',
    label: 'Distance + Duration',
    description: 'Cardio (e.g., 5km in 30 mins)',
  },
  {
    value: 'weight-distance',
    label: 'Weight + Distance',
    description: 'Combined (e.g., Sled Push 100m)',
  },
]
