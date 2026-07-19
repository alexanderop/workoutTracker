/**
 * Abstractness Analyzer
 *
 * Calculates the Abstractness (A) metric for a module using ts-morph.
 *
 * Abstract elements (contribute to numerator):
 * - Interface declarations
 * - Type alias declarations (complex types: objects, unions, intersections)
 * - Type guard functions (functions returning `x is Type`)
 * - Factory functions (functions named `create*` returning interface types)
 *
 * Concrete elements (contribute to denominator only):
 * - Function implementations (not type guards or factories)
 * - Const/let variable exports
 * - Vue component files (.vue)
 * - Class implementations
 *
 * Formula: A = Abstract / (Abstract + Concrete)
 */

import fs from 'node:fs'
import path from 'node:path'
import {
  type FunctionDeclaration,
  Project,
  type SourceFile,
  SyntaxKind,
  type TypeNode,
} from 'ts-morph'
import type { AbstractnessMetrics } from './types'

/**
 * Check if a type node represents a complex type (object, union, intersection, etc.)
 * Simple types (primitives, string literals) are not considered abstract.
 */
function isComplexType(typeNode: TypeNode | undefined): boolean {
  if (!typeNode) return false

  const kind = typeNode.getKind()

  // Complex types that indicate abstraction
  const complexKinds = [
    SyntaxKind.TypeLiteral, // { foo: string }
    SyntaxKind.UnionType, // A | B
    SyntaxKind.IntersectionType, // A & B
    SyntaxKind.MappedType, // { [K in keyof T]: T[K] }
    SyntaxKind.ConditionalType, // T extends U ? X : Y
    SyntaxKind.TupleType, // [A, B]
    SyntaxKind.FunctionType, // (x: T) => U
    SyntaxKind.TypeQuery, // typeof X
    SyntaxKind.IndexedAccessType, // T[K]
  ]

  return complexKinds.includes(kind)
}

/**
 * Check if a function is a type guard (returns `x is Type`)
 */
function isTypeGuard(functionDeclaration: FunctionDeclaration): boolean {
  const returnType = functionDeclaration.getReturnTypeNode()
  return returnType?.getKind() === SyntaxKind.TypePredicate
}

/**
 * Check if a function is a factory function (named create* and returns an interface/type)
 */
function isFactoryFunction(functionDeclaration: FunctionDeclaration): boolean {
  const name = functionDeclaration.getName()
  if (!name?.startsWith('create')) return false

  // Check if return type is a type reference (likely an interface)
  const returnType = functionDeclaration.getReturnTypeNode()
  return returnType?.getKind() === SyntaxKind.TypeReference
}

/**
 * Count type aliases in a source file
 */
function countTypeAliases(sourceFile: SourceFile): { abstract: number; concrete: number } {
  let abstract = 0
  let concrete = 0

  for (const typeAlias of sourceFile.getTypeAliases()) {
    const typeNode = typeAlias.getTypeNode()
    const isComplex = isComplexType(typeNode)
    abstract += isComplex ? 1 : 0
    concrete += isComplex ? 0 : 1
  }

  return { abstract, concrete }
}

/**
 * Count exported functions in a source file
 */
function countExportedFunctions(sourceFile: SourceFile): { abstract: number; concrete: number } {
  let abstract = 0
  let concrete = 0

  for (const functionDeclaration of sourceFile.getFunctions()) {
    if (!functionDeclaration.isExported()) continue

    const isAbstract = isTypeGuard(functionDeclaration) || isFactoryFunction(functionDeclaration)
    abstract += isAbstract ? 1 : 0
    concrete += isAbstract ? 0 : 1
  }

  return { abstract, concrete }
}

/**
 * Count exported variable declarations
 */
function countExportedVariables(sourceFile: SourceFile): number {
  let count = 0

  for (const statement of sourceFile.getVariableStatements()) {
    if (!statement.isExported()) continue

    for (const declaration of statement.getDeclarations()) {
      if (declaration.getInitializer()) {
        count++
      }
    }
  }

  return count
}

/**
 * Analyze abstractness for a single TypeScript source file
 */
function analyzeSourceFile(sourceFile: SourceFile): { abstract: number; concrete: number } {
  // Count interfaces (always abstract)
  const interfaceCount = sourceFile.getInterfaces().length

  // Count type aliases
  const typeAliases = countTypeAliases(sourceFile)

  // Count functions
  const functions = countExportedFunctions(sourceFile)

  // Count exported variables (concrete)
  const variableCount = countExportedVariables(sourceFile)

  // Count classes (concrete implementations)
  const classCount = sourceFile.getClasses().filter((c) => c.isExported()).length

  return {
    abstract: interfaceCount + typeAliases.abstract + functions.abstract,
    concrete: typeAliases.concrete + functions.concrete + variableCount + classCount,
  }
}

/**
 * Analyze abstractness for a module (directory)
 */
export function analyzeAbstractness(
  project: Project,
  modulePath: string,
  projectRoot: string,
): AbstractnessMetrics {
  const fullPath = `${projectRoot}/${modulePath}`

  // Get TypeScript files in this module
  const tsFiles = project.getSourceFiles(`${fullPath}/**/*.ts`)

  let totalAbstract = 0
  let totalConcrete = 0

  for (const file of tsFiles) {
    // Skip test files and declaration files
    const filePath = file.getFilePath()
    const isTestOrDeclaration =
      filePath.includes('.test.') || filePath.includes('.spec.') || filePath.endsWith('.d.ts')

    if (isTestOrDeclaration) continue

    const { abstract, concrete } = analyzeSourceFile(file)
    totalAbstract += abstract
    totalConcrete += concrete
  }

  // Count Vue components as concrete elements
  // ts-morph doesn't parse .vue files, so we count them separately
  const vueFileCount = countVueFiles(fullPath)
  totalConcrete += vueFileCount

  const total = totalAbstract + totalConcrete
  const abstractness = total > 0 ? totalAbstract / total : 0

  return {
    abstractElements: totalAbstract,
    concreteElements: totalConcrete,
    abstractness,
  }
}

/**
 * Count .vue files in a directory (they're all concrete components)
 */
function countVueFiles(dirPath: string): number {
  let count = 0

  function walkDir(dir: string): void {
    if (!fs.existsSync(dir)) return

    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walkDir(fullPath)
        continue
      }

      if (entry.name.endsWith('.vue')) {
        count++
      }
    }
  }

  walkDir(dirPath)
  return count
}

/**
 * Add source files from a module path to the project
 */
export function addModuleToProject(
  project: Project,
  modulePath: string,
  projectRoot: string,
): void {
  const fullPath = `${projectRoot}/${modulePath}`
  project.addSourceFilesAtPaths([`${fullPath}/**/*.ts`])
}
