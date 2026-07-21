// Deterministic gate: does a PR body follow .github/pull_request_template.md?
//
// Two things are checked, both derived from the template file itself so this
// stays correct when the template changes:
//   1. Every `## Section` heading in the template is present in the body.
//   2. Every author-owned section has been filled in — i.e. its content is no
//      longer byte-identical to the template's placeholder stub.
//
// Section 2 is why we do NOT reuse qa-workflow-policy's
// hasMeaningfulTemplateContent here: that heuristic reports a pristine
// template's Summary / Acceptance Criteria / QA Scope / Risk Areas as
// "meaningful" (checkbox prefixes and boilerplate like "Forms / validation"
// slip past its filter), so an untouched template would pass. Comparing each
// section against the template's own stub has near-zero false positives.

import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

import { extractMarkdownSection } from './qa-workflow-policy.mjs'

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
export const TEMPLATE_PATH = path.join(REPO_ROOT, '.github', 'pull_request_template.md')

// Sections whose content the author must supply. Everything else (e.g. the
// `CI Checks` checklist) only has to be present, since the template's own
// wording is the intended content.
export const MUST_FILL_SECTIONS = [
  'Summary',
  'User Impact',
  'Acceptance Criteria',
  'QA Scope',
  'Risk Areas',
  'Manual Test Scenarios',
]

export function listHeadings(markdown) {
  return [...(markdown ?? '').matchAll(/^[ \t]*##[ \t]+(.+?)[ \t]*$/gm)].map((match) =>
    match[1].trim(),
  )
}

function normalizeSection(text) {
  return (text ?? '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .join('\n')
}

export function findTemplateViolations(body, template) {
  if (!body?.trim()) {
    return ['PR body is empty — it must follow .github/pull_request_template.md.']
  }

  const violations = []
  const requiredHeadings = listHeadings(template)
  const bodyHeadings = new Set(listHeadings(body))

  for (const heading of requiredHeadings) {
    if (!bodyHeadings.has(heading)) {
      violations.push(`Missing required section: "## ${heading}".`)
    }
  }

  for (const heading of MUST_FILL_SECTIONS) {
    if (!bodyHeadings.has(heading)) continue // already reported as missing above

    const bodySection = normalizeSection(extractMarkdownSection(body, heading))
    const templateSection = normalizeSection(extractMarkdownSection(template, heading))

    if (!bodySection) {
      violations.push(`Section "## ${heading}" is empty — fill it in.`)
    } else if (bodySection === templateSection) {
      violations.push(`Section "## ${heading}" is unchanged from the template — fill it in.`)
    }
  }

  return violations
}

function readStdin() {
  return new Promise((resolve, reject) => {
    let data = ''
    process.stdin.setEncoding('utf8')
    process.stdin.on('data', (chunk) => (data += chunk))
    process.stdin.on('end', () => resolve(data))
    process.stdin.on('error', reject)
  })
}

// Body source precedence: explicit --file, then the PR_BODY env var (how CI
// passes github.event.pull_request.body), then stdin (for `... | node ...`).
async function readBody() {
  const fileFlag = process.argv.indexOf('--file')
  if (fileFlag !== -1) return readFile(process.argv[fileFlag + 1], 'utf8')
  if (process.env.PR_BODY !== undefined) return process.env.PR_BODY
  return readStdin()
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [body, template] = await Promise.all([readBody(), readFile(TEMPLATE_PATH, 'utf8')])
  const violations = findTemplateViolations(body, template)
  const inActions = process.env.GITHUB_ACTIONS === 'true'

  if (violations.length > 0) {
    for (const violation of violations) {
      console.error(inActions ? `::error::${violation}` : `✖ ${violation}`)
    }
    console.error(
      `\nPR body does not match ${path.relative(REPO_ROOT, TEMPLATE_PATH)}. ` +
        'Fill in every section before opening the PR.',
    )
    process.exit(1)
  }

  console.info('✓ PR body matches the required template.')
}
