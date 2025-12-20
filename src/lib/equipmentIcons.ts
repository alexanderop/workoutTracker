import type { Component } from 'vue'

import type { CardioActivity, WorkoutBlock } from '@/types/blocks'
import type { Equipment } from '@/types/exercises'

import MdiBicycle from '~icons/mdi/bicycle'
import MdiBarbell from '~icons/mdi/barbell'
import MdiCableData from '~icons/mdi/cable-data'
import MdiCog from '~icons/mdi/cog'
import MdiDumbbell from '~icons/mdi/dumbbell'
import MdiGolf from '~icons/mdi/golf'
import MdiHexagonOutline from '~icons/mdi/hexagon-outline'
import MdiHumanHandsup from '~icons/mdi/human-handsup'
import MdiKettlebell from '~icons/mdi/kettlebell'
import MdiResistor from '~icons/mdi/resistor'
import MdiRowing from '~icons/mdi/rowing'
import MdiRun from '~icons/mdi/run'
import MdiStairsUp from '~icons/mdi/stairs-up'
import MdiSwim from '~icons/mdi/swim'
import MdiTimer from '~icons/mdi/timer'
import MdiWalk from '~icons/mdi/walk'
import MdiWeightLifter from '~icons/mdi/weight-lifter'

const EQUIPMENT_ICONS: Record<Equipment, Component> = {
  barbell: MdiWeightLifter,
  dumbbell: MdiDumbbell,
  machine: MdiCog,
  cable: MdiCableData,
  bodyweight: MdiHumanHandsup,
  kettlebell: MdiKettlebell,
  band: MdiResistor,
  'ez-bar': MdiBarbell,
  'hex-bar': MdiHexagonOutline,
  club: MdiGolf,
}

const CARDIO_ACTIVITY_ICONS: Record<CardioActivity, Component> = {
  running: MdiRun,
  cycling: MdiBicycle,
  rowing: MdiRowing,
  elliptical: MdiWeightLifter,
  swimming: MdiSwim,
  stairclimber: MdiStairsUp,
  walking: MdiWalk,
}

function isEquipment(value: string | undefined): value is Equipment {
  return value !== undefined && value in EQUIPMENT_ICONS
}

export function getEquipmentIcon(equipment: string | undefined): Component {
  return isEquipment(equipment) ? EQUIPMENT_ICONS[equipment] : MdiDumbbell
}

export function getCardioActivityIcon(activity: CardioActivity): Component {
  return CARDIO_ACTIVITY_ICONS[activity] ?? MdiRun
}

export function getBlockIcon(block: WorkoutBlock): Component {
  if (block.kind === 'strength') {
    return getEquipmentIcon(block.equipment)
  }
  if (block.kind === 'cardio') {
    return getCardioActivityIcon(block.config.activity)
  }
  // For timed blocks (amrap, emom, tabata, fortime), use timer icon
  return MdiTimer
}
