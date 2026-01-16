/**
 * Main Sequence Analyzer
 *
 * Orchestrates the calculation of Main Sequence fitness metrics:
 * - Abstractness (A): From abstractnessAnalyzer
 * - Instability (I): From instabilityAnalyzer
 * - Distance (D): |A + I - 1|
 *
 * The Main Sequence is the ideal line where A + I = 1.
 * Modules should aim to be as close to this line as possible.
 *
 * Zones:
 * - Zone of Pain (top-right): High A, High I - rigid yet unstable
 * - Zone of Uselessness (bottom-left): Low A, Low I - concrete and unused
 * - Main Sequence (diagonal): Balanced abstraction and stability
 */

import { Project } from 'ts-morph'
import { addModuleToProject, analyzeAbstractness } from './abstractnessAnalyzer'
import { analyzeInstability } from './instabilityAnalyzer'
import { MODULE_DEFINITIONS, ZONE_THRESHOLDS } from './moduleDefinitions'
import type { MetricsReport, MetricsSummary, MetricViolation, ModuleMetrics } from './types'

/**
 * Diagnose which zone a module is in based on its metrics
 */
function diagnoseZone(
  abstractness: number,
  instability: number,
  distance: number,
): { zone: string; suggestion: string } {
  // Check if in danger zone (far from main sequence)
  if (distance >= ZONE_THRESHOLDS.danger) {
    // High abstraction + High instability = Zone of Pain
    if (abstractness > 0.5 && instability > 0.5) {
      return {
        zone: 'Zone of Pain',
        suggestion:
          'This module is highly abstract but also unstable. ' +
          'Consider making it more stable by reducing outgoing dependencies, ' +
          'or make it more concrete if the abstractions are not providing value.',
      }
    }

    // Low abstraction + Low instability = Zone of Uselessness
    if (abstractness < 0.5 && instability < 0.5) {
      return {
        zone: 'Zone of Uselessness',
        suggestion:
          'This module is concrete and stable but may be unused or over-engineered. ' +
          'Consider adding more consumers (increase fan-in) or ' +
          'extracting interfaces if this is meant to be a foundational module.',
      }
    }
  }

  // On or near the main sequence
  if (distance < ZONE_THRESHOLDS.ideal) {
    return {
      zone: 'Main Sequence (Ideal)',
      suggestion: 'This module has a good balance of abstraction and stability.',
    }
  }

  if (distance < ZONE_THRESHOLDS.acceptable) {
    return {
      zone: 'Near Main Sequence',
      suggestion: 'This module is within acceptable range but could be improved.',
    }
  }

  // Warning zone
  return {
    zone: 'Warning Zone',
    suggestion:
      'This module is drifting from the ideal balance. ' +
      'Review its dependencies and abstraction level.',
  }
}

/**
 * Calculate Main Sequence metrics for all defined modules
 */
export function calculateMainSequenceMetrics(projectRoot: string): MetricsReport {
  const timestamp = Date.now()

  // Create ts-morph project
  const project = new Project({
    tsConfigFilePath: `${projectRoot}/tsconfig.app.json`,
    skipAddingFilesFromTsConfig: true,
  })

  // Add all module source files
  for (const mod of MODULE_DEFINITIONS) {
    addModuleToProject(project, mod.path, projectRoot)
  }

  // Calculate instability for all modules
  const instabilityResults = analyzeInstability(project, MODULE_DEFINITIONS, projectRoot)

  // Build module metrics
  const modules: Array<ModuleMetrics> = []
  const violations: Array<MetricViolation> = []

  for (const mod of MODULE_DEFINITIONS) {
    // Calculate abstractness
    const abstractnessMetrics = analyzeAbstractness(project, mod.path, projectRoot)

    // Get instability metrics
    const instabilityMetrics = instabilityResults.get(mod.name)

    if (!instabilityMetrics) {
      throw new Error(`Missing instability metrics for module: ${mod.name}`)
    }

    // Calculate distance from Main Sequence
    const A = abstractnessMetrics.abstractness
    const I = instabilityMetrics.instability
    const D = Math.abs(A + I - 1)

    const passes = D <= mod.maxDistance

    const moduleMetrics: ModuleMetrics = {
      module: mod,
      abstractness: abstractnessMetrics,
      instability: instabilityMetrics,
      distance: D,
      passes,
    }

    modules.push(moduleMetrics)

    // Record violations
    if (!passes) {
      const { zone, suggestion } = diagnoseZone(A, I, D)

      violations.push({
        module: mod.name,
        metric: 'distance',
        actual: D,
        threshold: mod.maxDistance,
        message: `Module '${mod.name}' is ${D.toFixed(3)} from Main Sequence (threshold: ${mod.maxDistance}). Zone: ${zone}`,
        suggestion,
      })
    }
  }

  // Calculate summary
  const distances = modules.map((m) => m.distance)
  const maxDistance = Math.max(...distances)
  const worstModule = modules.find((m) => m.distance === maxDistance)?.module.name ?? 'unknown'

  const summary: MetricsSummary = {
    totalModules: modules.length,
    passingModules: modules.filter((m) => m.passes).length,
    failingModules: modules.filter((m) => !m.passes).length,
    averageDistance: distances.reduce((a, b) => a + b, 0) / distances.length,
    maxDistance,
    worstModule,
  }

  return {
    modules,
    violations,
    summary,
    timestamp,
  }
}

/**
 * Get metrics for a specific module by name
 */
export function getModuleMetrics(
  report: MetricsReport,
  moduleName: string,
): ModuleMetrics | undefined {
  return report.modules.find((m) => m.module.name === moduleName)
}
