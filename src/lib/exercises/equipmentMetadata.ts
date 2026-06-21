import type { Equipment } from '@/types/exercises'
import type { Component } from 'vue'
import {
  Cable,
  CircleDot,
  Cog,
  Dumbbell,
  Hexagon,
  LayoutGrid,
  Link,
  PersonStanding,
  Waves,
  Weight,
} from '@lucide/vue'

/**
 * Icon components for each equipment type, used in filter pills and selection UI.
 * The 'all' key uses LayoutGrid as a generic "show all" icon.
 */
export const EQUIPMENT_ICONS: Record<Equipment | 'all', Component> = {
  all: LayoutGrid,
  barbell: Dumbbell,
  dumbbell: Dumbbell,
  machine: Cog,
  cable: Cable,
  bodyweight: PersonStanding,
  kettlebell: Weight,
  band: Link,
  'ez-bar': Dumbbell,
  'hex-bar': Hexagon,
  club: CircleDot,
  'battle-rope': Waves,
}
