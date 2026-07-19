import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  extractMarkdownSection,
  hasMeaningfulTemplateContent,
  validateQaReport,
} from './qa-workflow-policy.mjs'

test('filled PR template fields are meaningful', () => {
  const body = `## QA Scope

- Changed flow to verify: nutrition dialogs with the keyboard open.

## Risk Areas

- Forms / validation — touched; validation logic is unchanged.`
  assert.equal(hasMeaningfulTemplateContent(extractMarkdownSection(body, 'QA Scope')), true)
  assert.equal(hasMeaningfulTemplateContent(extractMarkdownSection(body, 'Risk Areas')), true)
})

test('unfilled PR template fields are rejected', () => {
  assert.equal(hasMeaningfulTemplateContent('- Changed flow to verify: ...'), false)
  assert.equal(hasMeaningfulTemplateContent('- Forms / validation: TBD'), false)
  assert.equal(hasMeaningfulTemplateContent('- User can ...'), false)
})

test('an explicit QA skip is a final report', () => {
  assert.deepEqual(validateQaReport('## Verdict: QA_SKIPPED\n\nCompatibility guard.'), {
    ready: true,
    verdict: 'QA_SKIPPED',
  })
})

test('a crash-safe QA skeleton is not ready', () => {
  assert.deepEqual(
    validateQaReport('# QA Report\n\n**Verdict:** TBD (in progress)\n\nTesting in progress.'),
    {
      ready: false,
      reason: 'QA report has no final verdict',
    },
  )
})

test('a complete markdown report is ready', () => {
  const report = `# QA Report
**Verdict:** HEALTHY
## Acceptance Criteria
All pass.
## Evidence
Observed the flow.
## Bugs / Observations
None.
## Accessibility Findings
No issues observed.
## Console
No errors.
## Confidence
High.`
  assert.deepEqual(validateQaReport(report), { ready: true, verdict: 'HEALTHY' })
})

test('final-looking reports with empty sections are rejected', () => {
  const report = `# QA Report
**Verdict:** HEALTHY
## Acceptance Criteria
## Evidence
## Bugs / Observations
## Accessibility Findings
## Console
## Confidence`
  assert.equal(validateQaReport(report).ready, false)
})

test('structured output requires detailed tests and complete metrics', () => {
  const incomplete = JSON.stringify({
    verdict: 'HEALTHY',
    summary: 'Done',
    tests: [{ name: 'Dialog', result: 'skip', details: '' }],
    metrics: {},
  })
  assert.equal(validateQaReport('', incomplete).ready, false)

  const complete = JSON.stringify({
    verdict: 'HEALTHY',
    summary: 'The dialog flow passed.',
    tests: [{ name: 'Dialog', result: 'pass', details: 'CTA remained visible.' }],
    metrics: {
      total_tests: 1,
      passed: 1,
      failed: 0,
      critical_bugs: 0,
      major_bugs: 0,
      minor_bugs: 0,
    },
  })
  const report = `# QA Report
**Verdict:** HEALTHY
## Acceptance Criteria
All pass.
## Evidence
Observed the flow.
## Bugs / Observations
None.
## Accessibility Findings
No issues observed.
## Console
No errors.
## Confidence
High.`
  assert.deepEqual(validateQaReport(report, complete), { ready: true, verdict: 'HEALTHY' })
  assert.match(validateQaReport('', complete).reason, /Markdown report incomplete/)
})

test('CLI writes GitHub outputs and fails incomplete reports', () => {
  const directory = mkdtempSync(path.join(tmpdir(), 'qa-policy-'))
  const reportPath = path.join(directory, 'qa-report.md')
  const outputPath = path.join(directory, 'github-output')
  writeFileSync(reportPath, '**Verdict:** TBD\nTesting in progress.')
  const result = spawnSync(process.execPath, ['scripts/qa-workflow-policy.mjs', reportPath], {
    cwd: process.cwd(),
    env: { ...process.env, GITHUB_OUTPUT: outputPath },
    encoding: 'utf8',
  })
  assert.equal(result.status, 1)
  assert.match(readFileSync(outputPath, 'utf8'), /^ready=false$/m)
  assert.match(readFileSync(outputPath, 'utf8'), /^reason=QA report has no final verdict$/m)
})

test('workflow definitions retain hardening invariants', async () => {
  const [browser, fix, followup] = await Promise.all([
    readFile('.github/workflows/claude-qa-browser.yml', 'utf8'),
    readFile('.github/workflows/claude-fix-review.yml', 'utf8'),
    readFile('.github/workflows/claude-qa-followup.yml', 'utf8'),
  ])
  assert.match(browser, /qa-workflow-policy\.mjs/)
  assert.match(browser, /Bash\(agent-browser:\*\)/)
  assert.doesNotMatch(browser, /--allowedTools "Bash,/)
  assert.match(fix, /name: Verify candidate without secrets/)
  assert.match(fix, /persist-credentials: false/)
  assert.match(fix, /--ignore-scripts/)
  assert.match(fix, /claude-fix-review\//)
  assert.match(fix, /HEAD_SHA.*FINDING_IDS/)
  assert.match(fix, /\[\[ "\$path" == src\/\* \]\]/)
  assert.match(fix, /original sealed inputs and agent candidate/)
  assert.match(fix, /git rev-list --count/)
  assert.match(fix, /inputs\.force|FORCE/)
  assert.match(fix, /--disallowedTools "Bash,Skill"/)
  assert.match(fix, /Validate decisions and create candidate/)
  assert.doesNotMatch(fix, /Immediately reply in-thread/)
  assert.doesNotMatch(followup, /RUN_JSON[^\n]*head_sha|\.head_sha' <<<"\$RUN_JSON"/)
  assert.match(followup, /qa-provenance\.json/)
  assert.match(followup, /\.pr_number == \$pr and \.tested_head_sha == \$sha/)
  assert.match(followup, /report_sha256/)
  assert.match(followup, /qa-browser-artifacts-/)
  assert.match(followup, /github-actions\[bot\]/)
  assert.match(followup, /qa-report-provenance run-id=/)
})

test('agent-browser executable is integrity-pinned', async () => {
  const [action, packageJson, workspace, lockfile] = await Promise.all([
    readFile('.github/actions/setup-agent-browser/action.yml', 'utf8'),
    readFile('package.json', 'utf8'),
    readFile('pnpm-workspace.yaml', 'utf8'),
    readFile('pnpm-lock.yaml', 'utf8'),
  ])
  assert.doesNotMatch(action, /npm install -g agent-browser/)
  assert.match(action, /pnpm exec agent-browser install/)
  assert.match(packageJson, /"agent-browser": "catalog:"/)
  assert.match(workspace, /agent-browser: 0\.27\.0/)
  assert.match(lockfile, /agent-browser@0\.27\.0:[\s\S]*?integrity: sha512-/)
})

test('every Claude automation uses Sonnet 5', async () => {
  const workflowNames = (await readdir('.github/workflows')).filter(
    (name) => name.startsWith('claude') && name.endsWith('.yml'),
  )
  const sources = await Promise.all([
    ...workflowNames.map((name) => readFile(`.github/workflows/${name}`, 'utf8')),
    readFile('scripts/test-claude-qa-local.sh', 'utf8'),
  ])
  const configuredModels = new Set(
    sources.flatMap((source) =>
      source
        .matchAll(/claude-(?:sonnet|haiku|opus)-[A-Za-z0-9._-]+/g)
        .map((match) => match[0])
        .toArray(),
    ),
  )
  assert.deepEqual([...configuredModels], ['claude-sonnet-5'])
})
