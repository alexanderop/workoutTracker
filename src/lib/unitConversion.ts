import type { WeightUnit } from '@/types/settings'

const KG_TO_LBS = 2.204_62

// ============================================
// Weight Conversions (internal: kg)
// ============================================

/**
 * Convert kilograms to pounds.
 */
export function kgToLbs(kg: number): number {
  return kg * KG_TO_LBS
}

/**
 * Convert pounds to kilograms.
 */
export function lbsToKg(lbs: number): number {
  return lbs / KG_TO_LBS
}

/**
 * Format a weight value for display in the user's preferred unit.
 * @param kg - Weight in kilograms (internal storage unit)
 * @param unit - User's preferred display unit
 * @param decimals - Number of decimal places (default: 1)
 */
export function formatWeight(kg: number, unit: WeightUnit, decimals = 1): string {
  const value = unit === 'lbs' ? kgToLbs(kg) : kg
  return value.toFixed(decimals)
}

// ============================================
// Unit Labels
// ============================================

export const WEIGHT_UNIT_LABELS = {
  kg: 'kg',
  lbs: 'lbs',
} as const
