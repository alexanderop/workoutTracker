import type { WeightUnit } from '@/types/settings'

type PlateResult = {
  plates: Array<number>
  isAchievable: boolean
}

export const PLATE_CONFIG = {
  kg: {
    barWeight: 20,
    // 20kg prioritized over 25kg (25kg plates less common at gyms)
    availablePlates: [20, 25, 15, 10, 5, 2.5, 1.25],
  },
  lbs: {
    barWeight: 45,
    availablePlates: [45, 35, 25, 10, 5, 2.5],
  },
} as const

export function calculatePlates(targetWeight: number, unit: WeightUnit): PlateResult {
  const config = PLATE_CONFIG[unit]

  // Edge case: weight less than or equal to bar weight
  if (targetWeight <= config.barWeight) {
    return {
      plates: [],
      isAchievable: targetWeight === config.barWeight,
    }
  }

  // Calculate weight per side
  let sideWeight = (targetWeight - config.barWeight) / 2
  const plates: Array<number> = []

  // Greedy algorithm: take largest plates first
  for (const plateWeight of config.availablePlates) {
    while (sideWeight >= plateWeight) {
      plates.push(plateWeight)
      sideWeight -= plateWeight
      // Handle floating point precision (round to 2 decimal places)
      sideWeight = Math.round(sideWeight * 100) / 100
    }
  }

  return {
    plates,
    isAchievable: sideWeight === 0,
  }
}

export function getBarWeight(unit: WeightUnit): number {
  return PLATE_CONFIG[unit].barWeight
}
