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
    // Cross-domain types only: the workout model, settings units, benchmarks.
    maxDistance: 0.25, // Current: 0.131 - was 0.271 while it also held exercises
  },
  {
    name: 'blocks',
    path: 'src/blocks',
    category: 'core',
    // Home of the whole block vertical (ADR 002 + ADR 003). Taking the block
    // UI and timers in balanced the module: the concrete components lower
    // abstractness by as much as their outgoing dependencies raise
    // instability.
    maxDistance: 0.1, // Current: 0.021 - was 0.286 with codecs alone
  },
  {
    name: 'exercises',
    path: 'src/exercises',
    category: 'core',
    // Home of the exercise catalog domain (ADR 003): attribute types, bundled
    // catalog, metadata, labels, store, search, icons and exercise UI. The 173
    // generated icon components make it unavoidably concrete, so it sits on
    // the stable-and-concrete side rather than on the Main Sequence.
    maxDistance: 0.6, // Current: 0.578
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
    // Distance is not a meaningful signal for this module and the threshold is
    // deliberately loose. `lib` is a leaf utility kit: concrete by nature
    // (A near 0) and depended on by everything while depending on almost
    // nothing (I near 0), so A + I can never approach 1. Every correct change
    // pushes D *up* — moving `structureHash` next to its only consumer took it
    // from 0.718 to 0.766. The assertion that carries the real meaning is
    // `lib should stay a stable leaf` in mainSequence.test.ts.
    maxDistance: 0.8, // Current: 0.766
  },
  {
    name: 'composables',
    path: 'src/composables',
    category: 'shared',
    maxDistance: 0.3, // Current: 0.250 - good
  },
  {
    name: 'stores',
    path: 'src/stores',
    category: 'shared',
    maxDistance: 0.62, // Current: 0.584 - warning zone, needs attention
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
    maxDistance: 0.68, // Current: 0.641 - shadcn primitives are stable but concrete
  },
  {
    name: 'components',
    path: 'src/components',
    category: 'ui',
    // ADR 003 moved the domain UI (block config dialogs, runner views) out of
    // this module and into the domain modules that own it. What is left is a
    // leaf widget kit: concrete, and depended on far more than it depends on
    // anything. That is the same Zone-of-Uselessness shape `ui-primitives`
    // has, and it is the intended shape, so it carries the same threshold.
    maxDistance: 0.55, // Current: 0.497 - was 0.603 mid-refactor, 0.508 before it
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
