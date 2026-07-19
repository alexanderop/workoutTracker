#!/usr/bin/env node
/**
 * Design-token guardrail.
 *
 * Fails when app code uses raw Tailwind palette-scale classes (bg-emerald-500,
 * text-gray-200, ...) or `dark:` variants instead of the semantic tokens defined
 * in src/style.css (bg-success, text-block-cardio, text-highlight, ...).
 *
 * Rules:
 * - Components consume semantic tokens only; raw palette scales are reserved
 *   for the token definitions themselves.
 * - Theming is token-based: `.dark` swaps CSS variables, so app components
 *   never need `dark:` variants (shadcn scaffolds under src/components/ui/
 *   are the exception).
 *
 * Allowlist a file only for real-world color conventions (e.g. Olympic plate
 * colors) that must not follow the theme.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = path.join(ROOT, 'src')

/** Scaffolded shadcn-vue components manage their own classes. */
const EXCLUDED_DIRS = new Set([path.join(SRC, 'components', 'ui')])

/**
 * Files allowed to use raw palette classes, with the reason.
 * (None currently -- BarbellPlateHint's Olympic plate colors live under
 * src/components/ui/ and are covered by the scaffold exclusion.)
 * @type {Map<string, string>}
 */
const PALETTE_ALLOWLIST = new Map()

const PALETTE_FAMILIES =
  'red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|slate|gray|zinc|neutral|stone'
const PALETTE_RE = new RegExp(
  `(?:^|[\\s"'\`:\\[{(])((?:[a-z-]+:)*(?:bg|text|border(?:-[lrtbsexy])?|ring(?:-offset)?|inset-ring|fill|stroke|from|via|to|divide(?:-[xy])?|outline|accent|caret|decoration|shadow)-(?:${PALETTE_FAMILIES})-\\d{2,3}(?:/\\d{1,3})?)`,
  'g',
)
const DARK_VARIANT_RE = /(?:^|[\s"'`:{([])((?:[a-z-]+:)*dark:[a-z0-9-/[\]().%]+)/g

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const entryPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entryPath)) continue
      yield* walk(entryPath)
    } else if (/\.(vue|ts)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
      yield entryPath
    }
  }
}

const violations = []

for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file)
  const lines = readFileSync(file, 'utf8').split('\n')
  for (const [i, line] of lines.entries()) {
    if (line.includes('design-tokens-ignore')) continue
    if (!PALETTE_ALLOWLIST.has(rel)) {
      for (const match of line.matchAll(PALETTE_RE)) {
        violations.push({ rel, line: i + 1, cls: match[1], kind: 'raw palette class' })
      }
    }
    for (const match of line.matchAll(DARK_VARIANT_RE)) {
      violations.push({ rel, line: i + 1, cls: match[1], kind: 'dark: variant' })
    }
  }
}

if (violations.length > 0) {
  console.error('Design-token violations found:\n')
  for (const v of violations) {
    console.error(`  ${v.rel}:${v.line}  ${v.kind}: ${v.cls}`)
  }
  console.error(
    `\n${violations.length} violation(s). Use semantic tokens from src/style.css instead` +
      ' (bg-success, text-warning, text-highlight, bg-block-<kind>, bg-muted, ...).' +
      ' For intentional real-world colors, add a design-tokens-ignore comment on' +
      ' the line or allowlist the file in' +
      ' scripts/check-design-tokens.mjs with a reason.',
  )
  process.exit(1)
}

console.info('Design tokens OK: no raw palette classes or dark: variants in app code.')
