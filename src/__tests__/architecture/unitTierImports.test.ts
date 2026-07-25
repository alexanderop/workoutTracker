/**
 * Architecture rule (ADR 003, brain/decisions/003-effect-style-di.md): the Node `unit` tier must
 * never transitively reach `@/db`.
 *
 * D1's structural constraint: `import … from '@/db'` runs
 * `new WorkoutTrackerDb()` at import time (`provider.ts` -> `dexie/index.ts`
 * -> `dexie/database.ts`), which needs an `indexedDB` global the Node `unit`
 * tier does not have. Anything reachable from a unit spec's import graph
 * must therefore stay clear of the `@/db` barrel and
 * `src/db/implementations/**`.
 *
 * Implementation choice, decided empirically rather than assumed.
 * `projectFiles().inFolder(...).dependOnFiles()` (the idiom `architecture.test.ts`
 * already uses, and what C2 names) was tried first. Reading its
 * implementation (`archunit/dist/src/files/assertion/depend-on-files.js` and
 * `.../common/projection/edge-projections.js`) and confirming empirically
 * against this tree showed it is unsuitable for this specific rule on two
 * counts:
 *
 *   1. Not transitive. `perEdge()` projects the raw import graph one hop at
 *      a time, and `gatherDependOnFileViolations` filters that flat edge
 *      list directly — there is no BFS/closure step over it. A spec that
 *      reaches `@/db` through a helper (the offending import is not in the
 *      spec file itself, e.g. `habitGrid.spec.ts` -> `resetDatabase.ts` ->
 *      `@/db`) would pass undetected, which is exactly the gap C2 exists to
 *      close.
 *   2. Blind to import kind. The edge projection carries only
 *      `sourceLabel`/`targetLabel`; `edge.importKinds` (which does record
 *      `import type` vs. a value import, per `import-kinds-helper.js`) is
 *      never consulted by `gatherDependOnFileViolations`. It would flag
 *      `habitStats.spec.ts`'s legitimate
 *      `import type { DbHabit, DbHabitEntry } from '@/db/schema'`, which the
 *      contract explicitly requires to pass.
 *
 * So this file walks the import graph itself with ts-morph (already a
 * devDependency), starting at every unit-tier spec and the tier's setup
 * file, following both import declarations *and* re-export declarations
 * (`export … from '…'`) that have a runtime effect (skipping declarations
 * and named specifiers written as `import type` / `export type` / `{ type X
 * }`, which are erased at compile time and produce no `import`/`export`
 * statement in the emitted JS), and resolving `@/*` through
 * `tsconfig.vitest.json`'s path mapping — the same tsconfig the `unit` and
 * `default` projects type-check against. Verified empirically: ts-morph's
 * `ImportDeclaration.getModuleSpecifierSourceFile()` correctly resolves the
 * `@/db/schema` type-only import to `src/db/schema.ts` and the
 * `@/db` value import (via `resetDatabase.ts`) to `src/db/index.ts`,
 * without needing the whole project preloaded.
 *
 * Re-export edges matter just as much as import edges: a barrel module that
 * only re-exports (`export { x } from 'y'`, no `import` statements at all —
 * `src/__tests__/factories/index.ts` is exactly this shape) is invisible to
 * a walk that only calls `getImportDeclarations()`, so a unit spec could
 * import such a barrel and reach `@/db` through it undetected. This file
 * therefore walks `getExportDeclarations()` alongside `getImportDeclarations()`,
 * with the same runtime-effect filtering. `export = …` (`ExportAssignment`)
 * and `import x = require('…')` are not covered: this is an ESM-only
 * codebase (`package.json`'s `"type": "module"`) and neither CommonJS-style
 * syntax form occurs anywhere in `src/`, so building traversal for them
 * would be machinery for a case that cannot arise here.
 */
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Project } from 'ts-morph'
import type { ExportDeclaration, ImportDeclaration, SourceFile } from 'ts-morph'
import { describe, expect, it } from 'vitest'

const ROOT = fileURLToPath(new URL('../../../', import.meta.url))
const TSCONFIG_PATH = path.join(ROOT, 'tsconfig.vitest.json')
const SRC_ROOT = path.join(ROOT, 'src') + path.sep

type ForbiddenTarget = {
  readonly label: string
  readonly matches: (relativePath: string) => boolean
}

const FORBIDDEN_TARGETS: ReadonlyArray<ForbiddenTarget> = [
  { label: 'the @/db barrel (src/db/index.ts)', matches: (p) => p === 'src/db/index.ts' },
  { label: 'src/db/implementations/**', matches: (p) => p.startsWith('src/db/implementations/') },
]

type ImportChain = ReadonlyArray<string>

type Violation = {
  readonly spec: string
  readonly forbidden: string
  readonly chain: ImportChain
}

function toRelativePath(sourceFile: SourceFile): string {
  return path.relative(ROOT, sourceFile.getFilePath()).split(path.sep).join('/')
}

function isProjectFile(sourceFile: SourceFile): boolean {
  const filePath = sourceFile.getFilePath()
  return filePath.startsWith(SRC_ROOT) && !filePath.includes('/node_modules/')
}

/**
 * True when this import declaration produces an actual `import` statement in
 * the emitted JS -- i.e. it is not fully erased as `import type`. A
 * declaration mixing type and value named specifiers (e.g.
 * `import { type A, b } from 'x'`) still runs `x`'s module body at runtime,
 * so it counts as a runtime edge; only a declaration that is entirely
 * type-level (`import type ...`, or every named specifier individually
 * marked `type`) does not.
 */
function hasRuntimeEffect(importDeclaration: ImportDeclaration): boolean {
  if (importDeclaration.isTypeOnly()) return false

  const hasDefaultImport = importDeclaration.getDefaultImport() !== undefined
  const hasNamespaceImport = importDeclaration.getNamespaceImport() !== undefined
  const namedImports = importDeclaration.getNamedImports()
  const hasValueNamedImport = namedImports.some((named) => !named.isTypeOnly())
  // A side-effect-only import (`import '@/db'`) has no specifiers at all,
  // and always runs the target module.
  const isSideEffectImport = !hasDefaultImport && !hasNamespaceImport && namedImports.length === 0

  return hasDefaultImport || hasNamespaceImport || hasValueNamedImport || isSideEffectImport
}

/**
 * True when this re-export declaration (`export … from '…'`) produces an
 * actual re-export at runtime -- mirrors `hasRuntimeEffect` above for the
 * export side. `export * from 'y'` and `export * as ns from 'y'` have no
 * named exports and are always a runtime edge. A declaration with named
 * exports is a runtime edge unless every named export is individually
 * `type`. Declarations with no module specifier (`export { local }`) are
 * excluded upstream, since `getModuleSpecifierSourceFile()` returns
 * `undefined` for them anyway.
 */
function hasRuntimeExportEffect(exportDeclaration: ExportDeclaration): boolean {
  if (exportDeclaration.isTypeOnly()) return false

  const namedExports = exportDeclaration.getNamedExports()
  const hasValueNamedExport = namedExports.some((named) => !named.isTypeOnly())
  const isNamespaceExport = namedExports.length === 0

  return isNamespaceExport || hasValueNamedExport
}

function runtimeImportTargets(sourceFile: SourceFile): ReadonlyArray<SourceFile> {
  const importTargets = sourceFile
    .getImportDeclarations()
    .filter(hasRuntimeEffect)
    .map((declaration) => declaration.getModuleSpecifierSourceFile())

  const exportTargets = sourceFile
    .getExportDeclarations()
    .filter((declaration) => declaration.getModuleSpecifier() !== undefined)
    .filter(hasRuntimeExportEffect)
    .map((declaration) => declaration.getModuleSpecifierSourceFile())

  return [...importTargets, ...exportTargets]
    .filter((target): target is SourceFile => target !== undefined)
    .filter(isProjectFile)
}

/**
 * Breadth-first search over `entry`'s runtime import graph. Returns the
 * shortest chain from `entry` to the first forbidden file found, or
 * `undefined` if none is reachable.
 */
function findForbiddenChain(entry: SourceFile): Violation | undefined {
  const entryLabel = toRelativePath(entry)
  const visited = new Set<string>([entry.getFilePath()])
  const queue: Array<{ file: SourceFile; chain: ImportChain }> = [
    { file: entry, chain: [entryLabel] },
  ]

  while (queue.length > 0) {
    const current = queue.shift()
    if (current === undefined) continue

    for (const next of runtimeImportTargets(current.file)) {
      if (visited.has(next.getFilePath())) continue
      visited.add(next.getFilePath())

      const nextLabel = toRelativePath(next)
      const chain = [...current.chain, nextLabel]
      const forbidden = FORBIDDEN_TARGETS.find((target) => target.matches(nextLabel))
      if (forbidden !== undefined) {
        return { spec: entryLabel, forbidden: forbidden.label, chain }
      }

      queue.push({ file: next, chain })
    }
  }

  return undefined
}

function formatViolations(violations: ReadonlyArray<Violation>): string {
  return violations
    .map(
      (violation) =>
        `${violation.spec} transitively reaches ${violation.forbidden}:\n  ${violation.chain.join('\n  -> ')}`,
    )
    .join('\n\n')
}

describe('unit tier import hygiene (C2)', () => {
  it('no unit spec or the tier setup file transitively reaches @/db', () => {
    const project = new Project({
      tsConfigFilePath: TSCONFIG_PATH,
      skipAddingFilesFromTsConfig: true,
    })
    const entryFiles = project.addSourceFilesAtPaths([
      path.join(ROOT, 'src/__tests__/unit/**/*.spec.ts'),
      path.join(ROOT, 'src/__tests__/unit/setup.ts'),
    ])

    expect(entryFiles.length).toBeGreaterThan(0)

    const violations = entryFiles
      .map(findForbiddenChain)
      .filter((violation): violation is Violation => violation !== undefined)

    expect(violations, formatViolations(violations)).toEqual([])
  })
})

describe('unit tier import hygiene (C2) — re-export edges', () => {
  function fixtureProject(): Project {
    return new Project({ tsConfigFilePath: TSCONFIG_PATH, skipAddingFilesFromTsConfig: true })
  }

  it('reports a two-hop re-export chain that reaches @/db', () => {
    const project = fixtureProject()
    project.createSourceFile(
      path.join(ROOT, 'src/__tests__/architecture/fixtures/reexportHop.virtual.ts'),
      `export { getHabitsRepository } from '@/db'\n`,
      { overwrite: true },
    )
    const entry = project.createSourceFile(
      path.join(ROOT, 'src/__tests__/architecture/fixtures/reexportEntry.virtual.ts'),
      `export { getHabitsRepository } from './reexportHop.virtual'\n`,
      { overwrite: true },
    )

    const violation = findForbiddenChain(entry)

    expect(violation?.chain).toEqual([
      'src/__tests__/architecture/fixtures/reexportEntry.virtual.ts',
      'src/__tests__/architecture/fixtures/reexportHop.virtual.ts',
      'src/db/index.ts',
    ])
  })

  it('does not report a re-export chain that is fully type-only', () => {
    const project = fixtureProject()

    const declarationLevelTypeOnly = project.createSourceFile(
      path.join(ROOT, 'src/__tests__/architecture/fixtures/reexportTypeOnlyDeclaration.virtual.ts'),
      `export type { HabitRepository } from '@/db'\n`,
      { overwrite: true },
    )
    const specifierLevelTypeOnly = project.createSourceFile(
      path.join(ROOT, 'src/__tests__/architecture/fixtures/reexportTypeOnlySpecifier.virtual.ts'),
      `export { type HabitRepository } from '@/db'\n`,
      { overwrite: true },
    )

    expect(findForbiddenChain(declarationLevelTypeOnly)).toBeUndefined()
    expect(findForbiddenChain(specifierLevelTypeOnly)).toBeUndefined()
  })
})
