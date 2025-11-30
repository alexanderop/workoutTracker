import type { WeightUnit, HeightUnit } from '@/stores/settings'

const KG_TO_LBS = 2.20462
const CM_TO_INCHES = 0.393701
const INCHES_PER_FOOT = 12

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

/**
 * Convert a display value back to kilograms for storage.
 * @param value - Weight value in the user's display unit
 * @param unit - The unit of the input value
 */
export function toKg(value: number, unit: WeightUnit): number {
  return unit === 'lbs' ? lbsToKg(value) : value
}

// ============================================
// Height Conversions (internal: cm)
// ============================================

type FeetInches = {
  feet: number
  inches: number
}

/**
 * Convert centimeters to feet and inches.
 */
export function cmToFtIn(cm: number): FeetInches {
  const totalInches = cm * CM_TO_INCHES
  const feet = Math.floor(totalInches / INCHES_PER_FOOT)
  const inches = Math.round(totalInches % INCHES_PER_FOOT)
  return { feet, inches }
}

/**
 * Convert feet and inches to centimeters.
 */
export function ftInToCm(feet: number, inches: number): number {
  const totalInches = feet * INCHES_PER_FOOT + inches
  return totalInches / CM_TO_INCHES
}

/**
 * Format a height value for display in the user's preferred unit.
 * @param cm - Height in centimeters (internal storage unit)
 * @param unit - User's preferred display unit
 */
export function formatHeight(cm: number, unit: HeightUnit): string {
  if (unit === 'ft-in') {
    const { feet, inches } = cmToFtIn(cm)
    return `${feet}'${inches}"`
  }
  return `${Math.round(cm)} cm`
}

/**
 * Convert a display value back to centimeters for storage.
 * @param value - Height value (cm or feet)
 * @param unit - The unit of the input value
 * @param inches - Additional inches (only used when unit is 'ft-in')
 */
export function toCm(value: number, unit: HeightUnit, inches = 0): number {
  return unit === 'ft-in' ? ftInToCm(value, inches) : value
}

// ============================================
// Unit Labels
// ============================================

export const WEIGHT_UNIT_LABELS = {
  kg: 'kg',
  lbs: 'lbs',
} as const

export const HEIGHT_UNIT_LABELS = {
  cm: 'cm',
  'ft-in': 'ft/in',
} as const
