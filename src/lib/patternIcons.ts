import type { Component } from 'vue'

import type { MovementPattern, PatternColor } from '@/types/exercises'

import MdiAngleAcute from '~icons/mdi/angle-acute'
import MdiArrowDownBold from '~icons/mdi/arrow-down-bold'
import MdiArrowLeftBold from '~icons/mdi/arrow-left-bold'
import MdiArrowRightBold from '~icons/mdi/arrow-right-bold'
import MdiArrowUpBold from '~icons/mdi/arrow-up-bold'
import MdiBagCarryOn from '~icons/mdi/bag-carry-on'
import MdiChevronDoubleDown from '~icons/mdi/chevron-double-down'
import MdiDumbbell from '~icons/mdi/dumbbell'
import MdiRotateRight from '~icons/mdi/rotate-right'
import MdiTarget from '~icons/mdi/target'
import MdiYoga from '~icons/mdi/yoga'

export const PATTERN_ICONS: Record<MovementPattern, Component> = {
  'push-horizontal': MdiArrowRightBold,
  'push-vertical': MdiArrowUpBold,
  'pull-horizontal': MdiArrowLeftBold,
  'pull-vertical': MdiArrowDownBold,
  squat: MdiChevronDoubleDown,
  hinge: MdiAngleAcute,
  carry: MdiBagCarryOn,
  rotation: MdiRotateRight,
  stability: MdiYoga,
  isolation: MdiTarget,
}

export const DEFAULT_PATTERN_COLORS: Record<MovementPattern, PatternColor> = {
  'push-horizontal': 'red',
  'push-vertical': 'orange',
  'pull-horizontal': 'blue',
  'pull-vertical': 'cyan',
  squat: 'green',
  hinge: 'emerald',
  carry: 'amber',
  rotation: 'purple',
  stability: 'slate',
  isolation: 'pink',
}

export const PATTERN_COLOR_CLASSES: Record<
  PatternColor,
  { bg: string; text: string; ring: string }
> = {
  red: { bg: 'bg-red-500', text: 'text-red-500', ring: 'ring-red-500' },
  orange: { bg: 'bg-orange-500', text: 'text-orange-500', ring: 'ring-orange-500' },
  amber: { bg: 'bg-amber-500', text: 'text-amber-500', ring: 'ring-amber-500' },
  green: { bg: 'bg-green-500', text: 'text-green-500', ring: 'ring-green-500' },
  emerald: { bg: 'bg-emerald-500', text: 'text-emerald-500', ring: 'ring-emerald-500' },
  cyan: { bg: 'bg-cyan-500', text: 'text-cyan-500', ring: 'ring-cyan-500' },
  blue: { bg: 'bg-blue-500', text: 'text-blue-500', ring: 'ring-blue-500' },
  indigo: { bg: 'bg-indigo-500', text: 'text-indigo-500', ring: 'ring-indigo-500' },
  purple: { bg: 'bg-purple-500', text: 'text-purple-500', ring: 'ring-purple-500' },
  pink: { bg: 'bg-pink-500', text: 'text-pink-500', ring: 'ring-pink-500' },
  rose: { bg: 'bg-rose-500', text: 'text-rose-500', ring: 'ring-rose-500' },
  slate: { bg: 'bg-slate-500', text: 'text-slate-500', ring: 'ring-slate-500' },
}

export function getPatternIcon(pattern?: MovementPattern | null): Component {
  return pattern ? PATTERN_ICONS[pattern] : MdiDumbbell
}

export function getPatternColor(
  pattern?: MovementPattern | null,
  customColor?: PatternColor | null,
): PatternColor {
  if (customColor) return customColor
  if (pattern) return DEFAULT_PATTERN_COLORS[pattern]
  return 'slate'
}

export function getPatternColorClasses(
  pattern?: MovementPattern | null,
  customColor?: PatternColor | null,
): { bg: string; text: string; ring: string } {
  const color = getPatternColor(pattern, customColor)
  return PATTERN_COLOR_CLASSES[color]
}
