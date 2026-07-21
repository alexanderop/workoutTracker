import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

import {
  MUST_FILL_SECTIONS,
  TEMPLATE_PATH,
  findTemplateViolations,
  listHeadings,
} from './check-pr-template.mjs'

const SCRIPT = fileURLToPath(new URL('./check-pr-template.mjs', import.meta.url))
const TEMPLATE = readFileSync(TEMPLATE_PATH, 'utf8')

// A body every check should accept: every section present and filled.
const FILLED_BODY = `## Summary

- Add a rest timer to the workout logger.

## User Impact

- Affected users: anyone logging a strength session.
- Behavior change: a countdown starts automatically after a set is saved.

## Acceptance Criteria

- [x] User can start a rest timer after completing a set.
- [x] User can skip the timer with the Skip button.
- [x] Existing flow still saves sets without a timer running.

## QA Scope

- Changed flow to verify: log a set and watch the timer count down.
- One adjacent regression path to verify: editing a saved set.

## Risk Areas

- Forms / validation — set-save form is touched.
- Offline / PWA lifecycle — timer must survive backgrounding.

## Manual Test Scenarios

1. **Scenario:** Rest timer starts
   - Given: an active strength block
   - When: I save a set
   - Then: a 90s countdown appears

## CI Checks

- [ ] \`pnpm type-check\`
- [ ] \`pnpm lint\`
- [ ] \`pnpm test\`
`

test('a fully filled body has no violations', () => {
  assert.deepEqual(findTemplateViolations(FILLED_BODY, TEMPLATE), [])
})

test('the pristine template is rejected as unfilled', () => {
  const violations = findTemplateViolations(TEMPLATE, TEMPLATE)
  // Every author-owned section is still the stub, so each must be flagged.
  for (const heading of MUST_FILL_SECTIONS) {
    assert.ok(
      violations.some((v) => v.includes(`"## ${heading}"`)),
      `expected an unfilled violation for "${heading}"`,
    )
  }
})

test('an empty body is rejected', () => {
  assert.equal(findTemplateViolations('', TEMPLATE).length, 1)
  assert.match(findTemplateViolations('', TEMPLATE)[0], /empty/i)
})

test('a missing section is reported', () => {
  const withoutRisk = FILLED_BODY.replace(/## Risk Areas[\s\S]*?(?=\n## Manual Test Scenarios)/, '')
  const violations = findTemplateViolations(withoutRisk, TEMPLATE)
  assert.ok(violations.some((v) => v === 'Missing required section: "## Risk Areas".'))
})

test('a present-but-untouched section is reported as unchanged', () => {
  // Take the filled body but reset QA Scope back to the template stub.
  const templateQaScope = TEMPLATE.match(/## QA Scope\n([\s\S]*?)\n## Risk Areas/)[1]
  const body = FILLED_BODY.replace(
    /## QA Scope\n[\s\S]*?\n## Risk Areas/,
    `## QA Scope\n${templateQaScope}\n## Risk Areas`,
  )
  const violations = findTemplateViolations(body, TEMPLATE)
  assert.ok(violations.some((v) => v.includes('"## QA Scope"') && /unchanged/.test(v)))
})

test('listHeadings extracts H2 headings only', () => {
  const md = '# Title\n## One\ntext\n### Sub\n##   Two  \n'
  assert.deepEqual(listHeadings(md), ['One', 'Two'])
})

test('CLI exits 0 on a valid body via PR_BODY env', () => {
  const result = spawnSync(process.execPath, [SCRIPT], {
    env: { ...process.env, PR_BODY: FILLED_BODY, GITHUB_ACTIONS: '' },
    encoding: 'utf8',
  })
  assert.equal(result.status, 0, result.stderr)
})

test('CLI exits 1 and annotates on an invalid body under Actions', () => {
  const result = spawnSync(process.execPath, [SCRIPT], {
    env: { ...process.env, PR_BODY: '## Summary\n\n- only this', GITHUB_ACTIONS: 'true' },
    encoding: 'utf8',
  })
  assert.equal(result.status, 1)
  assert.match(result.stderr, /::error::/)
})

test('CLI reads a body file passed with --file', () => {
  const bodyFile = path.join(path.dirname(SCRIPT), '..', '.github', 'pull_request_template.md')
  const result = spawnSync(process.execPath, [SCRIPT, '--file', bodyFile], {
    env: { ...process.env, PR_BODY: undefined, GITHUB_ACTIONS: '' },
    encoding: 'utf8',
  })
  // The template file itself is all stubs, so it must fail.
  assert.equal(result.status, 1)
})
