/* eslint-disable vitest/no-conditional-in-test -- Logs diagnostics only when this architecture assertion fails. */
/**
 * Main Sequence Fitness Function Tests
 *
 * These tests enforce Robert C. Martin's Stable Dependencies Principle (SDP) and
 * Stable Abstractions Principle (SAP) by measuring each module's distance from
 * the "Main Sequence" (A + I = 1).
 *
 * Metrics:
 * - Abstractness (A): Ratio of abstract to total elements (interfaces, types vs implementations)
 * - Instability (I): Ratio of outgoing to total dependencies
 * - Distance (D): |A + I - 1| - how far the module is from the ideal balance
 *
 * Zones:
 * - Main Sequence (D < 0.3): Ideal balance of abstraction and stability
 * - Zone of Pain (high A, high I): Rigid yet unstable - avoid
 * - Zone of Uselessness (low A, low I): Concrete and unused - avoid
 *
 * Run with: pnpm test:arch
 */
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { calculateMainSequenceMetrics, getModuleMetrics } from './metrics/mainSequenceAnalyzer'
import { getModulesByCategory } from './metrics/moduleDefinitions'
import {
  formatMetricsTable,
  formatSummary,
  formatViolations,
  generateAsciiPlot,
} from './metrics/reporter'
import type { MetricsReport } from './metrics/types'

const PROJECT_ROOT = path.resolve(__dirname, '../../..')

/**
 * Cached report to avoid recalculating for each test
 */
let cachedReport: MetricsReport | null = null

function getReport(): MetricsReport {
  if (!cachedReport) {
    cachedReport = calculateMainSequenceMetrics(PROJECT_ROOT)

    // Log metrics for visibility (using warn to comply with no-console rule)
    console.warn('\n' + formatSummary(cachedReport))
    console.warn('\n' + formatMetricsTable(cachedReport))
    console.warn('\n' + generateAsciiPlot(cachedReport))
  }
  return cachedReport
}

describe('main sequence fitness functions', () => {
  // =============================================================================
  // CORE MODULES - Foundational, should be stable and abstract
  // =============================================================================

  describe('core modules', () => {
    it('db layer should be close to Main Sequence (D < 0.25)', () => {
      const databaseMetrics = getModuleMetrics(getReport(), 'db')
      expect(databaseMetrics).toBeDefined()
      expect(databaseMetrics?.distance).toBeLessThan(0.25)
    })

    it('types should be highly abstract and stable', () => {
      const typesMetrics = getModuleMetrics(getReport(), 'types')
      expect(typesMetrics).toBeDefined()

      // Types module should be mostly abstract
      expect(typesMetrics?.abstractness.abstractness).toBeGreaterThan(0.5)

      // Should be stable (few outgoing dependencies)
      expect(typesMetrics?.instability.instability).toBeLessThan(0.3)

      // Should be on or near Main Sequence. Since ADR 002 the block types
      // live in src/blocks and src/types partly re-exports them; re-export
      // statements count as neither abstract nor concrete, so the threshold
      // carries a small buffer over the 0.25 core default (current: 0.271).
      expect(typesMetrics?.distance).toBeLessThan(0.3)
    })

    it('blocks should be close to Main Sequence (D < 0.3)', () => {
      const blocksMetrics = getModuleMetrics(getReport(), 'blocks')
      expect(blocksMetrics).toBeDefined()
      // Retiring the ADR 002 compat barrels pointed every consumer straight
      // at @/blocks; the added afferent coupling lowers instability while the
      // concrete codecs keep abstractness fixed, so D sits at ~0.286 (still
      // inside the ideal Main Sequence zone reported by the analyzer).
      expect(blocksMetrics?.distance).toBeLessThan(0.3)
    })
  })

  // =============================================================================
  // SHARED MODULES - Utilities, should be balanced
  // =============================================================================

  describe('shared modules', () => {
    const sharedModules = getModulesByCategory('shared')

    for (const moduleDefinition of sharedModules) {
      it(`${moduleDefinition.name} should be within acceptable distance (D < ${moduleDefinition.maxDistance})`, () => {
        const metrics = getModuleMetrics(getReport(), moduleDefinition.name)
        expect(metrics).toBeDefined()
        expect(metrics?.distance).toBeLessThan(moduleDefinition.maxDistance)
      })
    }
  })

  // =============================================================================
  // FEATURE MODULES - Domain implementations, allowed to be concrete and unstable
  // =============================================================================

  describe('feature modules', () => {
    const featureModules = getModulesByCategory('feature')

    for (const moduleDefinition of featureModules) {
      it(`${moduleDefinition.name} should be within acceptable distance (D < ${moduleDefinition.maxDistance})`, () => {
        const metrics = getModuleMetrics(getReport(), moduleDefinition.name)
        expect(metrics).toBeDefined()
        expect(metrics?.distance).toBeLessThan(moduleDefinition.maxDistance)
      })
    }

    it('features should have moderate abstractness (mostly concrete)', () => {
      for (const moduleDefinition of featureModules) {
        const metrics = getModuleMetrics(getReport(), moduleDefinition.name)
        // Features can have some types/interfaces but should be mostly concrete
        // templates has higher abstractness due to type definitions
        expect(metrics?.abstractness.abstractness).toBeLessThan(0.7)
      }
    })

    it('features should have high instability (dependent on stable modules)', () => {
      for (const moduleDefinition of featureModules) {
        const metrics = getModuleMetrics(getReport(), moduleDefinition.name)
        // Features are expected to depend on core modules
        expect(metrics?.instability.instability).toBeGreaterThan(0.4)
      }
    })
  })

  // =============================================================================
  // UI MODULES - Presentation layer, expected to be most unstable
  // =============================================================================

  describe('ui modules', () => {
    const uiModules = getModulesByCategory('ui')

    for (const moduleDefinition of uiModules) {
      it(`${moduleDefinition.name} should be within acceptable distance (D < ${moduleDefinition.maxDistance})`, () => {
        const metrics = getModuleMetrics(getReport(), moduleDefinition.name)
        expect(metrics).toBeDefined()
        expect(metrics?.distance).toBeLessThan(moduleDefinition.maxDistance)
      })
    }

    it('views should be maximally unstable (I > 0.7)', () => {
      const viewsMetrics = getModuleMetrics(getReport(), 'views')
      expect(viewsMetrics).toBeDefined()
      // Views depend on everything, nothing depends on them
      expect(viewsMetrics?.instability.instability).toBeGreaterThan(0.7)
    })
  })

  // =============================================================================
  // DEPENDENCY DIRECTION - Stable modules should not depend on unstable ones
  // =============================================================================

  describe('dependency direction', () => {
    it('blocks module should not depend on any other internal modules except types', () => {
      const blocksMetrics = getModuleMetrics(getReport(), 'blocks')
      expect(blocksMetrics).toBeDefined()
      // Blocks is the foundational block model (ADR 002) - it may reach the
      // kind-neutral leaf types (Equipment) but nothing else
      const allowedDependencies = ['types']
      for (const dependency of blocksMetrics?.instability.dependsOn ?? []) {
        expect(allowedDependencies).toContain(dependency)
      }
    })

    it('types module should only depend on blocks', () => {
      const typesMetrics = getModuleMetrics(getReport(), 'types')
      expect(typesMetrics).toBeDefined()
      // Types re-exports the per-kind block types from src/blocks (ADR 002)
      // but must not depend on anything else
      const allowedDependencies = ['blocks']
      for (const dependency of typesMetrics?.instability.dependsOn ?? []) {
        expect(allowedDependencies).toContain(dependency)
      }
    })

    it('db module should only depend on types, blocks, and lib', () => {
      const databaseMetrics = getModuleMetrics(getReport(), 'db')
      expect(databaseMetrics).toBeDefined()
      // DB dispatches block conversion through the Codec Registry (ADR 002)
      // and can use lib utilities, but nothing else
      const allowedDependencies = ['types', 'blocks', 'lib']
      for (const dependency of databaseMetrics?.instability.dependsOn ?? []) {
        expect(allowedDependencies).toContain(dependency)
      }
    })
  })

  // =============================================================================
  // SUMMARY ASSERTIONS
  // =============================================================================

  describe('summary assertions', () => {
    it('average distance should be below 0.4', () => {
      // Current: 0.279 - good overall health
      expect(getReport().summary.averageDistance).toBeLessThan(0.4)
    })

    it('no module should be in extreme Zone of Pain/Uselessness (D > 0.8)', () => {
      // Allow some modules in warning zone, but none in extreme danger
      expect(getReport().summary.maxDistance).toBeLessThan(0.8)
    })

    it('should have no threshold violations', () => {
      const report = getReport()
      if (report.violations.length > 0) {
        console.error('\n' + formatViolations(report))
      }
      expect(report.violations).toHaveLength(0)
    })

    it('majority of modules should pass (> 75%)', () => {
      // Allow some margin for modules needing attention
      const report = getReport()
      const passRate = report.summary.passingModules / report.summary.totalModules
      expect(passRate).toBeGreaterThan(0.75)
    })
  })
})
