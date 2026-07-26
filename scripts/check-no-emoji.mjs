#!/usr/bin/env node
/**
 * Emoji guardrail.
 *
 * Fails when app code carries an emoji or pictographic character. Icons in this
 * app are drawn artwork -- `src/components/exercise-icons` for movements,
 * `src/components/app-icons` for equipment, muscles, habits, moods, and
 * achievements -- with lucide covering shell chrome. An inline emoji renders in
 * whatever the device's font vendor decided, which is exactly the visual
 * inconsistency the icon sets exist to remove.
 *
 * Tests are out of scope: they assert against legacy stored data on purpose.
 */
import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = fileURLToPath(new URL('..', import.meta.url))
const SRC = path.join(ROOT, 'src')

/** Specs assert on emoji that legacy databases still hold. */
const EXCLUDED_DIRS = new Set([path.join(SRC, '__tests__')])

/**
 * Files allowed to contain emoji, with the reason.
 * @type {Map<string, string>}
 */
const ALLOWLIST = new Map([
  [
    'src/db/converters.ts',
    'migration table mapping emoji written by the pre-icon habit form onto artwork keys',
  ],
])

/**
 * Pictographs plus the dingbats and symbols that render as emoji on phones.
 * Deliberately not matching arrows or box-drawing: those are typography in
 * comments and doc strings, not icon stand-ins.
 */
const EMOJI_RE = /\p{Extended_Pictographic}|[\u{1F000}-\u{1FAFF}]|[\u{2190}-\u{21FF}]\u{FE0F}/gu

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
  if (ALLOWLIST.has(rel)) continue

  const lines = readFileSync(file, 'utf8').split('\n')
  for (const [index, line] of lines.entries()) {
    const found = [...new Set(line.match(EMOJI_RE))]
    if (found.length > 0) violations.push(`${rel}:${index + 1}  ${found.join(' ')}`)
  }
}

if (violations.length > 0) {
  console.error(`Found ${violations.length} line(s) with emoji in app code:\n`)
  for (const violation of violations) console.error(`  ${violation}`)
  console.error('\nUse drawn artwork instead: <AppIcon> (src/components/app-icons) for equipment,')
  console.error('muscles, habits, moods, and achievements; <ExerciseIcon> for movements;')
  console.error('lucide (@lucide/vue) for shell chrome such as checks and chevrons.')
  process.exit(1)
}

console.info('Emoji OK: app code renders icons as drawn artwork.')
