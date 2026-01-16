/**
 * Module definitions for Main Sequence analysis
 *
 * Defines all modules to be analyzed with their paths and distance thresholds.
 * Thresholds are based on module type:
 * - Core (db, types): Strict (0.25) - should be highly abstract and stable
 * - Shared (lib, composables, stores): Moderate (0.4) - balanced
 * - Features: Flexible (0.5) - concrete implementations with allowed instability
 * - UI (components, views): Relaxed (0.6) - top-level orchestrators
 */

import type { ModuleDefinition } from './types'

/**
 * Core modules - foundational abstractions that should be stable
 * Expected: High Abstractness, Low Instability, Low Distance
 *
 * Note: Thresholds are based on current baseline. Tighten over time.
 */
const CORE_MODULES: ReadonlyArray<ModuleDefinition> = [
  {
    name: 'db',
    path: 'src/db',
    category: 'core',
    maxDistance: 0.25, // Current: 0.124 - excellent
  },
  {
    name: 'types',
    path: 'src/types',
    category: 'core',
    maxDistance: 0.25, // Current: 0.204 - tight margin, allow some buffer
  },
]

/**
 * Shared modules - utilities and reusable logic
 * Expected: Medium Abstractness, Medium Instability, Moderate Distance
 *
 * Note: lib and stores have high distances (Zone of Uselessness pattern).
 * These are areas for potential improvement. Thresholds set to current baseline.
 */
const SHARED_MODULES: ReadonlyArray<ModuleDefinition> = [
  {
    name: 'lib',
    path: 'src/lib',
    category: 'shared',
    maxDistance: 0.75, // Current: 0.733 - in Zone of Uselessness, needs attention
  },
  {
    name: 'composables',
    path: 'src/composables',
    category: 'shared',
    maxDistance: 0.4, // Current: 0.344 - good
  },
  {
    name: 'stores',
    path: 'src/stores',
    category: 'shared',
    maxDistance: 0.7, // Current: 0.667 - warning zone, needs attention
  },
]

/**
 * Feature modules - domain-specific implementations
 * Expected: Low Abstractness, High Instability, Moderate Distance
 */
const FEATURE_MODULES: ReadonlyArray<ModuleDefinition> = [
  {
    name: 'workout',
    path: 'src/features/workout',
    category: 'feature',
    maxDistance: 0.5,
  },
  {
    name: 'benchmarks',
    path: 'src/features/benchmarks',
    category: 'feature',
    maxDistance: 0.5,
  },
  {
    name: 'templates',
    path: 'src/features/templates',
    category: 'feature',
    maxDistance: 0.5,
  },
  {
    name: 'exercises',
    path: 'src/features/exercises',
    category: 'feature',
    maxDistance: 0.5,
  },
  {
    name: 'settings',
    path: 'src/features/settings',
    category: 'feature',
    maxDistance: 0.5,
  },
  {
    name: 'timers',
    path: 'src/features/timers',
    category: 'feature',
    maxDistance: 0.5,
  },
  {
    name: 'weight',
    path: 'src/features/weight',
    category: 'feature',
    maxDistance: 0.5,
  },
  {
    name: 'progressions',
    path: 'src/features/progressions',
    category: 'feature',
    maxDistance: 0.5,
  },
  {
    name: 'onboarding',
    path: 'src/features/onboarding',
    category: 'feature',
    maxDistance: 0.5,
  },
  {
    name: 'log-past-workout',
    path: 'src/features/log-past-workout',
    category: 'feature',
    maxDistance: 0.5,
  },
]

/**
 * UI modules - presentation layer
 * Expected: Very Low Abstractness, Very High Instability, Moderate Distance
 *
 * Note: ui-primitives has higher distance due to being low abstraction + low instability.
 */
const UI_MODULES: ReadonlyArray<ModuleDefinition> = [
  {
    name: 'ui-primitives',
    path: 'src/components/ui',
    category: 'ui',
    maxDistance: 0.7, // Current: 0.669 - shadcn primitives are stable but concrete
  },
  {
    name: 'components',
    path: 'src/components',
    category: 'ui',
    maxDistance: 0.6, // Current: 0.508 - good
  },
  {
    name: 'views',
    path: 'src/views',
    category: 'ui',
    maxDistance: 0.6, // Current: 0.000 - excellent (high I, low A)
  },
]

/**
 * All modules to analyze
 */
export const MODULE_DEFINITIONS: ReadonlyArray<ModuleDefinition> = [
  ...CORE_MODULES,
  ...SHARED_MODULES,
  ...FEATURE_MODULES,
  ...UI_MODULES,
]

/**
 * Get all modules in a category
 */
export function getModulesByCategory(
  category: ModuleDefinition['category'],
): ReadonlyArray<ModuleDefinition> {
  return MODULE_DEFINITIONS.filter((m) => m.category === category)
}

/**
 * Zone thresholds for diagnostic messaging
 */
export const ZONE_THRESHOLDS = {
  /** Ideal zone: D < 0.3 */
  ideal: 0.3,
  /** Acceptable zone: D < 0.5 */
  acceptable: 0.5,
  /** Warning zone: D < 0.7 */
  warning: 0.7,
  /** Danger zone (Zone of Pain/Uselessness): D >= 0.7 */
  danger: 0.7,
} as const
