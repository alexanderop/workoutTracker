import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { load as parseYaml } from 'js-yaml'

import {
  extractMarkdownSection,
  hasMeaningfulTemplateContent,
  isValidScreenshotFilename,
  rewriteScreenshotLinks,
  validateQaReport,
} from './qa-workflow-policy.mjs'

function assertMobileStartup(commands) {
  const open = commands.indexOf('agent-browser open')
  const device = commands.indexOf('agent-browser set device "iPhone 14"')
  const reload = commands.indexOf('agent-browser reload')
  const firstSnapshot = commands.indexOf('agent-browser snapshot')

  assert.ok(open !== -1, 'mobile startup must open the app')
  assert.ok(device > open, 'device emulation must follow opening the app')
  assert.ok(reload > device, 'the app must reload after enabling device emulation')
  assert.ok(firstSnapshot > reload, 'device emulation must precede the first snapshot')
}

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

test('screenshot filenames must be flat kebab-case .png', () => {
  assert.equal(isValidScreenshotFilename('ac1-weight-saved.png'), true)
  assert.equal(isValidScreenshotFilename('bug-2_nav-overflow.png'), true)
  assert.equal(isValidScreenshotFilename('../escape.png'), false)
  assert.equal(isValidScreenshotFilename('sub/dir.png'), false)
  assert.equal(isValidScreenshotFilename('UPPER.png'), false)
  assert.equal(isValidScreenshotFilename('shot.jpeg'), false)
  assert.equal(isValidScreenshotFilename('.hidden.png'), false)
  assert.equal(isValidScreenshotFilename(`${'a'.repeat(100)}.png`), false)
  assert.equal(isValidScreenshotFilename(''), false)
  assert.equal(isValidScreenshotFilename(undefined), false)
})

test('published screenshot links are rewritten, unknown ones left alone', () => {
  const report = [
    '![Weight saved](qa-screenshots/ac1-weight-saved.png)',
    '![Missing](qa-screenshots/never-published.png)',
    'Plain mention of qa-screenshots/ac1-weight-saved.png in text.',
  ].join('\n')
  const rewritten = rewriteScreenshotLinks(report, {
    'ac1-weight-saved.png': 'https://example.test/abc/ac1-weight-saved.png',
  })
  assert.equal(
    rewritten,
    [
      '![Weight saved](https://example.test/abc/ac1-weight-saved.png)',
      '![Missing](qa-screenshots/never-published.png)',
      'Plain mention of https://example.test/abc/ac1-weight-saved.png in text.',
    ].join('\n'),
  )
  assert.equal(rewriteScreenshotLinks('', {}), '')
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
  const [browser, ci, followup, reusable, codeql] = await Promise.all([
    readFile('.github/workflows/claude-qa-browser.yml', 'utf8'),
    readFile('.github/workflows/ci.yml', 'utf8'),
    readFile('.github/workflows/claude-qa-followup.yml', 'utf8'),
    readFile('.github/workflows/reusable-node-command.yml', 'utf8'),
    readFile('.github/workflows/codeql.yml', 'utf8'),
  ])
  assert.match(browser, /qa-workflow-policy\.mjs/)
  assert.match(browser, /Bash\(agent-browser:\*\)/)
  assert.match(browser, /agent-browser set device "iPhone 14"/)
  assert.doesNotMatch(browser, /--allowedTools "Bash,/)
  assert.doesNotMatch(followup, /RUN_JSON[^\n]*head_sha|\.head_sha' <<<"\$RUN_JSON"/)
  assert.match(followup, /qa-provenance\.json/)
  assert.match(followup, /\.pr_number == \$pr and \.tested_head_sha == \$sha/)
  assert.match(followup, /report_sha256/)
  assert.match(followup, /qa-browser-artifacts-/)
  assert.match(followup, /github-actions\[bot\]/)
  assert.match(followup, /qa-report-provenance run-id=/)
  assert.doesNotMatch(ci, /^\s+paths:/m)
  assert.match(ci, /name: Required CI/)
  assert.match(ci, /needs: required/)
  assert.match(ci, /skip-commit: 'true'/)
  assert.match(ci, /git-push: 'false'/)
  assert.match(ci, /zizmorcore\/zizmor-action@[0-9a-f]{40}/)
  assert.match(ci, /online-audits: true/)
  assert.match(reusable, /case "\$PROFILE" in/)
  assert.doesNotMatch(reusable, /inputs\.command/)
  assert.match(codeql, /github\/codeql-action\/analyze@[0-9a-f]{40}/)
})

// The publish job rejects a report whose H2 headings don't match
// validateQaReport's required list exactly, so every prompt that can be the
// last word to the QA agent has to name those headings verbatim. A run was
// lost to a prompt that listed them as prose bullets ("Accessibility
// findings", "Acceptance Criteria table") and let evidence be folded into the
// AC table, which silently dropped two headings.
test('QA prompts name the exact headings the validator requires', async () => {
  const requiredSections = [
    'Acceptance Criteria',
    'Evidence',
    'Bugs / Observations',
    'Accessibility Findings',
    'Console',
    'Confidence',
  ]
  const [systemPrompt, browser] = await Promise.all([
    readFile('.claude/prompts/qa-system-prompt.md', 'utf8'),
    readFile('.github/workflows/claude-qa-browser.yml', 'utf8'),
  ])

  for (const section of requiredSections) {
    const escaped = section.replace('/', String.raw`\/`)
    assert.match(
      systemPrompt,
      new RegExp(String.raw`^##\s+${escaped}\s*$`, 'm'),
      `qa-system-prompt.md must show "## ${section}" verbatim so the agent emits it`,
    )
    // The workflow embeds the same headings as quoted shell/JS string
    // literals (`echo '## Evidence'`, `report.push('## Evidence')`).
    assert.match(
      browser,
      new RegExp(String.raw`'##\s+${escaped}'`),
      `the retry prompt must show "## ${section}" verbatim so the agent emits it`,
    )
  }

  // A report that satisfies the prompt must satisfy the validator.
  const report = [
    '## Verdict: HEALTHY',
    '',
    'Everything checked out.',
    ...requiredSections.flatMap((section) => [`## ${section}`, '', 'Observed as expected.', '']),
  ].join('\n')
  assert.deepEqual(validateQaReport(report), { ready: true, verdict: 'HEALTHY' })

  // The regression that cost run 30190993183: a plausible report that folds
  // the evidence and observations into the AC table instead of giving them
  // their own headings. Reads complete, fails the gate.
  const folded = [
    '## Verdict: HEALTHY',
    '',
    'Everything checked out.',
    '## Acceptance Criteria',
    '',
    '| AC | Result | Evidence | Notes |',
    '| --- | --- | --- | --- |',
    '| Icons render | Pass | ![grid](qa-screenshots/grid.png) | none found |',
    '## Accessibility Findings',
    '',
    'No issues observed.',
    '## Console',
    '',
    'No errors.',
    '## Confidence',
    '',
    'High.',
  ].join('\n')
  assert.deepEqual(validateQaReport(folded), {
    ready: false,
    reason: 'QA report is missing sections: Evidence, Bugs / Observations',
  })
})

test('browser QA starts and stays mobile-first by default', async () => {
  const [
    workflowSource,
    systemPrompt,
    fastPrompt,
    verifyPrompt,
    explorePrompt,
    pipelinePrompt,
    mobileInitScript,
    localRunner,
  ] = await Promise.all([
    readFile('.github/workflows/claude-qa-browser.yml', 'utf8'),
    readFile('.claude/prompts/qa-system-prompt.md', 'utf8'),
    readFile('.claude/prompts/qa-browser-fast.md', 'utf8'),
    readFile('.claude/prompts/qa-browser-verify.md', 'utf8'),
    readFile('.claude/prompts/qa-browser-explore.md', 'utf8'),
    readFile('.claude/prompts/qa-browser-test.md', 'utf8'),
    readFile('.claude/scripts/qa-mobile-emulation.js', 'utf8'),
    readFile('scripts/test-claude-qa-local.sh', 'utf8'),
  ])

  const workflow = parseYaml(workflowSource)
  const warmup = workflow.jobs['qa-browser'].steps.find(
    (step) => step.name === 'Warm-up smoke check (agent-browser + onboarding)',
  )
  const retryPrompt = workflow.jobs['qa-browser'].steps.find(
    (step) => step.name === 'Load retry prompt',
  )

  assert.ok(warmup, 'browser QA warm-up step must exist')
  assert.ok(retryPrompt, 'browser QA retry prompt must exist')
  assert.equal(
    workflow.jobs['qa-browser'].env.AGENT_BROWSER_INIT_SCRIPTS,
    '.claude/scripts/qa-mobile-emulation.js',
  )
  assertMobileStartup(warmup.run)
  assert.match(warmup.run, /MOBILE_READY=.*pointer: coarse.*maxTouchPoints/)
  assert.match(retryPrompt.run, /set device "iPhone 14".*reload.*pointer: coarse/s)
  assert.match(systemPrompt, /MOBILE FIRST/)
  assert.match(systemPrompt, /restore\s+iPhone 14 emulation plus reload/)
  assert.match(fastPrompt, /initialized with \*\*iPhone 14 device emulation\*\*/)
  assert.match(fastPrompt, /restore\s+`set device "iPhone 14"` and reload/)
  assert.match(verifyPrompt, /initialized with \*\*iPhone 14 device emulation\*\*/)
  assert.match(verifyPrompt, /restore `set device "iPhone 14"` and\s+reload/)
  assert.doesNotMatch(verifyPrompt, /skip mobile viewport/i)
  const exploreStartup = explorePrompt.match(/```bash\n([\s\S]*?)```/)?.[1]
  assert.ok(exploreStartup, 'explore prompt must contain a startup command block')
  assertMobileStartup(exploreStartup)
  assertMobileStartup(pipelinePrompt.slice(pipelinePrompt.indexOf('## Steps')))
  assert.match(mobileInitScript, /coarsePointerQuery/)
  assert.match(mobileInitScript, /maxTouchPoints/)
  assert.match(localRunner, /AGENT_BROWSER_INIT_SCRIPTS/)
})

test('Playwright system packages are installed independently of the browser cache', async () => {
  const action = parseYaml(await readFile('.github/actions/setup-test-env/action.yml', 'utf8'))
  const steps = action.runs.steps
  const cache = steps.find((step) => step.name === 'Cache Playwright browsers')
  const dependencies = steps.find((step) => step.name === 'Install Playwright system dependencies')
  const browser = steps.find((step) => step.name === 'Install Playwright browsers')

  assert.match(cache.with.key, /\$\{\{ runner\.arch \}\}/)
  assert.equal(dependencies.if, "runner.os == 'Linux'")
  assert.match(dependencies.run, /playwright install-deps/)
  assert.equal(browser.if, "steps.playwright-cache.outputs.cache-hit != 'true'")
  assert.match(browser.run, /playwright install "\$\{browsers\[@\]\}"/)
})

test('issue assignment authorizes the triggering repository owner', async () => {
  const workflow = parseYaml(await readFile('.github/workflows/claude.yml', 'utf8'))
  const admission = workflow.jobs.claude.if

  assert.match(admission, /github\.event\.action == 'opened'/)
  assert.match(admission, /github\.event\.action == 'assigned'/)
  assert.match(admission, /github\.actor == github\.repository_owner/)
  assert.match(admission, /github\.event\.issue\.author_association == 'OWNER'/)
})

test('download-artifact uses the repository-verified action pin everywhere', async () => {
  const workflowNames = (await readdir('.github/workflows')).filter((name) => name.endsWith('.yml'))
  const sources = await Promise.all(
    workflowNames.map((name) => readFile(`.github/workflows/${name}`, 'utf8')),
  )
  const pins = sources.flatMap((source) =>
    source
      .matchAll(/actions\/download-artifact@([0-9a-f]{40})/g)
      .map((match) => match[1])
      .toArray(),
  )

  assert.ok(pins.length > 0)
  assert.deepEqual(new Set(pins).values().toArray(), ['3e5f45b2cfb9172054b4087a40e8e0b5a5461e7c'])
})

test('Required CI gates every verification job and the exact release commit', async () => {
  const ci = parseYaml(await readFile('.github/workflows/ci.yml', 'utf8'))
  const allJobs = Object.keys(ci.jobs)
  const expectedDependencies = allJobs.filter((name) => !['required', 'release'].includes(name))
  assert.deepEqual([...ci.jobs.required.needs].toSorted(), expectedDependencies.toSorted())
  assert.equal(ci.jobs.release.needs, 'required')
  assert.match(ci.jobs.release.if, /github\.event_name == 'push'/)
  assert.match(ci.jobs.release.if, /github\.ref == 'refs\/heads\/main'/)

  const checkout = ci.jobs.release.steps.find(
    (step) => step.name === 'Checkout verified main commit',
  )
  assert.equal(checkout.with.ref, '${{ github.sha }}')
  assert.equal(checkout.with['persist-credentials'], false)

  const changelog = ci.jobs.release.steps.find((step) => step.id === 'changelog')
  assert.equal(changelog.with['git-push'], 'false')
  const publish = ci.jobs.release.steps.find(
    (step) => step.name === 'Publish tag for the verified commit',
  )
  assert.match(publish.run, /TAG_SHA.*EXPECTED_SHA/s)
  assert.match(publish.run, /git push origin.*refs\/tags/s)
})

test('deprecated and competing privileged workflows are removed', async () => {
  const workflowNames = await readdir('.github/workflows')
  assert.equal(workflowNames.includes('claude-qa-test.yml'), false)
  assert.equal(workflowNames.includes('release.yml'), false)
  // Retired automation: Claude no longer auto-fixes CI, auto-reviews PRs, or
  // auto-applies reviewer findings. Removing the files is the whole feature —
  // this keeps a stray re-add from silently restoring the write path.
  for (const retired of [
    'claude-ci-fix.yml',
    'claude-flaky-detect.yml',
    'claude-pr-review.yml',
    'claude-fix-review.yml',
  ]) {
    assert.equal(workflowNames.includes(retired), false, `${retired} was intentionally removed`)
  }

  const sources = await Promise.all(
    workflowNames.map((name) => readFile(`.github/workflows/${name}`, 'utf8')),
  )
  for (const source of sources) {
    assert.doesNotMatch(source, /claude-(?:ci-fix|flaky-detect|pr-review|fix-review)\.yml/)
  }
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
  const pinned = workspace.match(/^ {2}agent-browser: (?<version>\S+)$/m)?.groups?.version
  assert.match(
    pinned ?? '',
    /^\d+\.\d+\.\d+$/,
    'pnpm-workspace.yaml must pin agent-browser to an exact version',
  )
  const escaped = pinned.replaceAll('.', String.raw`\.`)
  assert.match(
    lockfile,
    new RegExp(String.raw`agent-browser@${escaped}:[\s\S]*?integrity: sha512-`),
  )
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
