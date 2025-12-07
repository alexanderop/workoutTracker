import { computed, type MaybeRefOrGetter, toValue } from 'vue'
import { useAnimatedCounter } from '@/composables/useAnimatedCounter'
import { formatWeight as formatWeightUnit, WEIGHT_UNIT_LABELS } from '@/lib/unitConversion'
import type { WorkoutStats } from './useWorkoutDetail'
import type { WeightUnit } from '@/types/settings'

// ============================================
// Composable
// ============================================

/**
 * Provides animated stat counters and computed flags for the workout summary view.
 * Encapsulates animation timing coordination and weight unit conversion.
 */
export function useSummaryStats(
  stats: MaybeRefOrGetter<WorkoutStats>,
  weightUnit: MaybeRefOrGetter<WeightUnit>,
) {
  // Animated counters with staggered delays for visual effect
  const { displayValue: animatedExercises } = useAnimatedCounter(
    () => toValue(stats).exerciseCount,
    { delay: 600, duration: 1200 },
  )

  const { displayValue: animatedSets } = useAnimatedCounter(
    () => toValue(stats).setCount,
    { delay: 750, duration: 1200 },
  )

  const { displayValue: animatedWeight } = useAnimatedCounter(
    () => {
      const kg = toValue(stats).totalWeight
      const unit = toValue(weightUnit)
      const decimals = unit === 'lbs' ? 1 : 0
      return Number.parseFloat(formatWeightUnit(kg, unit, decimals))
    },
    { delay: 900, duration: 1500 },
  )

  const { displayValue: animatedRounds } = useAnimatedCounter(
    () => toValue(stats).totalRounds,
    { delay: 1050, duration: 1200 },
  )

  // Computed flags for conditional rendering
  const hasTimedBlocks = computed(() => toValue(stats).timedBlockCount > 0)
  const hasStrengthBlocks = computed(() => toValue(stats).exerciseCount > 0)

  // Weight label helper
  function weightLabel(): string {
    return `${WEIGHT_UNIT_LABELS[toValue(weightUnit)]} lifted`
  }

  return {
    // Animated values
    animatedExercises,
    animatedSets,
    animatedWeight,
    animatedRounds,
    // Computed flags
    hasTimedBlocks,
    hasStrengthBlocks,
    // Helpers
    weightLabel,
  }
}
