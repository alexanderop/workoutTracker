/**
 * Type definitions for Main Sequence fitness function metrics
 *
 * Based on Robert C. Martin's "Clean Architecture" principles:
 * - Abstractness (A): Ratio of abstract to total elements
 * - Instability (I): Ratio of outgoing to total dependencies
 * - Distance (D): |A + I - 1| - distance from ideal Main Sequence
 */

export type ModuleCategory = 'core' | 'shared' | 'feature' | 'ui'

export type ModuleDefinition = {
  /** Unique module name for identification */
  name: string
  /** Relative path from project root */
  path: string
  /** Module category for grouped thresholds */
  category: ModuleCategory
  /** Maximum allowed distance from Main Sequence */
  maxDistance: number
}

export type AbstractnessMetrics = {
  /** Count of abstract elements (interfaces, type aliases, type guards) */
  abstractElements: number
  /** Count of concrete elements (functions, const exports, components) */
  concreteElements: number
  /** Abstractness ratio: A = abstract / (abstract + concrete) */
  abstractness: number
}

export type InstabilityMetrics = {
  /** Afferent coupling: modules that depend on this module */
  fanIn: number
  /** Efferent coupling: modules this module depends on */
  fanOut: number
  /** Instability ratio: I = fanOut / (fanIn + fanOut) */
  instability: number
  /** List of module names this module depends on */
  dependsOn: ReadonlyArray<string>
  /** List of module names that depend on this module */
  dependedOnBy: ReadonlyArray<string>
}

export type ModuleMetrics = {
  /** Module definition with path and thresholds */
  module: ModuleDefinition
  /** Abstractness metrics */
  abstractness: AbstractnessMetrics
  /** Instability metrics */
  instability: InstabilityMetrics
  /** Distance from Main Sequence: D = |A + I - 1| */
  distance: number
  /** Whether this module passes the threshold */
  passes: boolean
}

export type MetricViolation = {
  /** Module name */
  module: string
  /** Type of violation */
  metric: 'abstractness' | 'instability' | 'distance'
  /** Actual value */
  actual: number
  /** Threshold that was exceeded */
  threshold: number
  /** Human-readable message */
  message: string
  /** Suggested remediation */
  suggestion: string
}

export type MetricsSummary = {
  /** Total number of modules analyzed */
  totalModules: number
  /** Number of modules within threshold */
  passingModules: number
  /** Number of modules exceeding threshold */
  failingModules: number
  /** Average distance across all modules */
  averageDistance: number
  /** Maximum distance found */
  maxDistance: number
  /** Module with maximum distance */
  worstModule: string
}

export type MetricsReport = {
  /** Individual module metrics */
  modules: ReadonlyArray<ModuleMetrics>
  /** Threshold violations */
  violations: ReadonlyArray<MetricViolation>
  /** Summary statistics */
  summary: MetricsSummary
  /** Timestamp of analysis */
  timestamp: number
}
