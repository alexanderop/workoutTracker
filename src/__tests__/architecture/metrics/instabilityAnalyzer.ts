/**
 * Instability Analyzer
 *
 * Calculates the Instability (I) metric for modules by analyzing import dependencies.
 *
 * Instability measures how much a module depends on other modules vs. is depended upon:
 * - Fan-out (Ce - Efferent Coupling): Number of modules this module imports from
 * - Fan-in (Ca - Afferent Coupling): Number of modules that import from this module
 *
 * Formula: I = Ce / (Ca + Ce)
 * - I = 0: Maximally stable (nothing depends on this, everything depends on it)
 * - I = 1: Maximally unstable (everything depends on this, nothing it depends on)
 *
 * Note: External dependencies (vue, date-fns, etc.) are ignored - only internal module
 * dependencies are counted.
 */

import fs from 'node:fs'
import path from 'node:path'
import type { Project, SourceFile } from 'ts-morph'
import { MODULE_DEFINITIONS } from './moduleDefinitions'
import type { InstabilityMetrics, ModuleDefinition } from './types'

/**
 * Map of module paths to their canonical names for resolution
 */
const PATH_TO_MODULE = new Map<string, string>()

// Build path mapping on module load
for (const mod of MODULE_DEFINITIONS) {
  PATH_TO_MODULE.set(mod.path, mod.name)
}

/**
 * Resolve an import specifier to a module name
 * Returns undefined if the import is external or unresolvable
 */
function resolveImportToModule(
  importSpecifier: string,
  currentModuleName: string,
): string | undefined {
  // Skip external dependencies (not starting with @ alias or relative path)
  if (!importSpecifier.startsWith('@/') && !importSpecifier.startsWith('.')) {
    return undefined
  }

  // Handle @ alias imports
  if (importSpecifier.startsWith('@/')) {
    const path = importSpecifier.slice(2) // Remove '@/'

    // Try to match against module paths
    for (const [modulePath, moduleName] of PATH_TO_MODULE) {
      const moduleDir = modulePath.replace('src/', '')

      // Check if import path starts with this module's directory
      if (path.startsWith(moduleDir + '/') || path === moduleDir) {
        // Don't count self-references
        if (moduleName === currentModuleName) return undefined
        return moduleName
      }
    }
  }

  // Relative imports within the same module don't count
  return undefined
}

/**
 * Extract all module dependencies from a source file
 */
function extractDependencies(
  sourceFile: SourceFile,
  currentModuleName: string,
): ReadonlyArray<string> {
  const dependencies = new Set<string>()

  const imports = sourceFile.getImportDeclarations()

  for (const imp of imports) {
    const specifier = imp.getModuleSpecifierValue()
    const targetModule = resolveImportToModule(specifier, currentModuleName)

    if (targetModule) {
      dependencies.add(targetModule)
    }
  }

  return [...dependencies]
}

/**
 * Build a dependency graph for all modules
 * Returns a map of module name -> set of modules it depends on
 */
function buildDependencyGraph(
  project: Project,
  modules: ReadonlyArray<ModuleDefinition>,
  projectRoot: string,
): Map<string, Set<string>> {
  const graph = new Map<string, Set<string>>()

  // Initialize all modules with empty dependency sets
  for (const mod of modules) {
    graph.set(mod.name, new Set())
  }

  // Analyze each module's files
  for (const mod of modules) {
    const fullPath = `${projectRoot}/${mod.path}`
    const sourceFiles = project.getSourceFiles(`${fullPath}/**/*.ts`)

    for (const file of sourceFiles) {
      const filePath = file.getFilePath()

      // Skip test files
      if (filePath.includes('.test.') || filePath.includes('.spec.')) continue

      const deps = extractDependencies(file, mod.name)
      const modDeps = graph.get(mod.name)

      for (const dep of deps) {
        modDeps?.add(dep)
      }
    }

    // Also check Vue files for imports (via simple regex - ts-morph can't parse .vue)
    const vueDeps = extractVueDependencies(fullPath, mod.name)
    const modDeps = graph.get(mod.name)

    for (const dep of vueDeps) {
      modDeps?.add(dep)
    }
  }

  return graph
}

/**
 * Extract dependencies from Vue files using simple regex
 * (ts-morph doesn't parse Vue SFCs)
 */
function extractVueDependencies(modulePath: string, moduleName: string): ReadonlyArray<string> {
  const dependencies = new Set<string>()

  function walkDir(dir: string): void {
    if (!fs.existsSync(dir)) return

    const entries = fs.readdirSync(dir, { withFileTypes: true })

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walkDir(fullPath)
        continue
      }

      if (!entry.name.endsWith('.vue')) continue

      const content = fs.readFileSync(fullPath, 'utf8')

      // Match import statements: import X from '@/...' or import X from '...'
      const importRegex = /import\s+[\s\w*,{}]+\s+from\s+["'](@\/[^"']+|\.\.?\/[^"']+)["']/g
      let match: RegExpExecArray | null

       
      while ((match = importRegex.exec(content)) !== null) {
        const specifier = match[1]

        if (!specifier) continue

        const targetModule = resolveImportToModule(specifier, moduleName)

        if (targetModule) {
          dependencies.add(targetModule)
        }
      }
    }
  }

  walkDir(modulePath)
  return [...dependencies]
}

/**
 * Calculate instability metrics for all modules
 */
export function analyzeInstability(
  project: Project,
  modules: ReadonlyArray<ModuleDefinition>,
  projectRoot: string,
): Map<string, InstabilityMetrics> {
  const dependencyGraph = buildDependencyGraph(project, modules, projectRoot)
  const results = new Map<string, InstabilityMetrics>()

  // Calculate fan-in for each module (who depends on this module)
  const fanInMap = new Map<string, Array<string>>()

  for (const mod of modules) {
    fanInMap.set(mod.name, [])
  }

  for (const [moduleName, dependencies] of dependencyGraph) {
    for (const dep of dependencies) {
      fanInMap.get(dep)?.push(moduleName)
    }
  }

  // Build results for each module
  for (const mod of modules) {
    const dependsOn = [...(dependencyGraph.get(mod.name) ?? [])]
    const dependedOnBy = fanInMap.get(mod.name) ?? []

    const fanOut = dependsOn.length
    const fanIn = dependedOnBy.length

    const total = fanIn + fanOut
    const instability = total > 0 ? fanOut / total : 0

    results.set(mod.name, {
      fanIn,
      fanOut,
      instability,
      dependsOn,
      dependedOnBy,
    })
  }

  return results
}
