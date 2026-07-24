import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { readFile, readdir } from 'node:fs/promises'
import { createRequire } from 'node:module'
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

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor
const require = createRequire(import.meta.url)

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

function runGit(cwd, args) {
  const result = spawnSync('git', args, { cwd, encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
  return result.stdout.trim()
}

async function runReviewCandidateFixture({
  baseline,
  changed,
  findings,
  fixed = [],
  rejected = [],
  human = [],
  preclassified = [],
}) {
  const workflow = parseYaml(await readFile('.github/workflows/claude-fix-review.yml', 'utf8'))
  const step = workflow.jobs.agent.steps.find(
    (candidate) => candidate.name === 'Validate decisions and create candidate',
  )
  assert.ok(step, 'candidate validation step must exist')
  const directory = mkdtempSync(path.join(tmpdir(), 'review-candidate-'))
  const repository = path.join(directory, 'repo')
  const scratch = path.join(directory, 'tmp')
  const reviewInput = path.join(scratch, 'review-input')
  mkdirSync(path.join(repository, 'src'), { recursive: true })
  mkdirSync(reviewInput, { recursive: true })
  for (const [relativePath, contents] of Object.entries(baseline)) {
    const target = path.join(repository, relativePath)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, contents)
  }
  runGit(repository, ['init', '-q'])
  runGit(repository, ['config', 'user.name', 'fixture'])
  runGit(repository, ['config', 'user.email', 'fixture@example.test'])
  runGit(repository, ['add', '.'])
  runGit(repository, ['commit', '-qm', 'fixture base'])
  const initialSha = runGit(repository, ['rev-parse', 'HEAD'])
  for (const [relativePath, contents] of Object.entries(changed)) {
    const target = path.join(repository, relativePath)
    mkdirSync(path.dirname(target), { recursive: true })
    writeFileSync(target, contents)
  }
  writeFileSync(path.join(reviewInput, 'findings.json'), JSON.stringify(findings))
  writeFileSync(
    path.join(reviewInput, 'gate.json'),
    JSON.stringify({ head_sha: initialSha, repair_rounds: 0 }),
  )
  writeFileSync(path.join(scratch, 'fixed-findings.json'), JSON.stringify(fixed))
  writeFileSync(path.join(scratch, 'rejected-findings.json'), JSON.stringify(rejected))
  writeFileSync(path.join(scratch, 'needs-human-findings.json'), JSON.stringify(human))
  writeFileSync(path.join(scratch, 'preclassified-findings.json'), JSON.stringify(preclassified))
  const script = step.run
    .replaceAll('/tmp/', () => `${scratch}/`)
    .replaceAll('${{ github.run_id }}', '12345')
  const result = spawnSync('bash', ['-c', script], {
    cwd: repository,
    encoding: 'utf8',
    env: {
      ...process.env,
      GITHUB_OUTPUT: path.join(directory, 'github-output'),
      INITIAL_SHA: initialSha,
      MAX_AUTO_FIX_FILES: '8',
      MAX_AUTO_FIX_LINES: '400',
    },
  })
  return { directory, initialSha, repository, result, scratch }
}

async function runReviewPartitionFixture({ findings, repairRounds }) {
  const workflow = parseYaml(await readFile('.github/workflows/claude-fix-review.yml', 'utf8'))
  const step = workflow.jobs.agent.steps.find(
    (candidate) => candidate.name === 'Validate sealed inputs and partition findings',
  )
  assert.ok(step, 'finding partition step must exist')
  const directory = mkdtempSync(path.join(tmpdir(), 'review-partition-'))
  const repository = path.join(directory, 'repo')
  const scratch = path.join(directory, 'tmp')
  const reviewInput = path.join(scratch, 'review-input')
  mkdirSync(path.join(repository, 'src'), { recursive: true })
  mkdirSync(reviewInput, { recursive: true })
  writeFileSync(path.join(repository, 'src/app.ts'), 'export const app = true\n')
  runGit(repository, ['init', '-q'])
  runGit(repository, ['config', 'user.name', 'fixture'])
  runGit(repository, ['config', 'user.email', 'fixture@example.test'])
  runGit(repository, ['add', '.'])
  runGit(repository, ['commit', '-qm', 'fixture base'])
  const headSha = runGit(repository, ['rev-parse', 'HEAD'])
  const signature = 'a'.repeat(12)
  writeFileSync(path.join(reviewInput, 'findings.json'), JSON.stringify(findings))
  writeFileSync(path.join(reviewInput, 'gate.json'), JSON.stringify({
    head_sha: headSha,
    repair_rounds: repairRounds,
    signature,
  }))
  const result = spawnSync('bash', ['-c', step.run.split('/tmp/').join(`${scratch}/`)], {
    cwd: repository,
    encoding: 'utf8',
    env: {
      ...process.env,
      EXPECTED_SHA: headSha,
      EXPECTED_SIGNATURE: signature,
      GITHUB_OUTPUT: path.join(directory, 'github-output'),
      MAX_AUTO_FIX_ROUNDS: '3',
    },
  })
  assert.equal(result.status, 0, result.stderr)
  return {
    agent: JSON.parse(readFileSync(path.join(reviewInput, 'agent-findings.json'), 'utf8')),
    human: JSON.parse(readFileSync(path.join(scratch, 'needs-human-findings.json'), 'utf8')),
    output: readFileSync(path.join(directory, 'github-output'), 'utf8'),
  }
}

function finding(commentId, file) {
  return {
    body: 'review finding',
    commentId,
    location: `${file}:1`,
    reviewer: 'coderabbitai',
  }
}

function fixedDecision(commentId, file) {
  return {
    changedPaths: [file],
    commentId,
    confidence: 0.9,
    evidence: 'The candidate changes the affected path.',
    summary: 'Addressed the finding.',
    testEvidence: 'Workflow-owned verification will run.',
  }
}

function reviewThread(id, reviewer, recent = []) {
  return {
    id: `thread-${id}`,
    isResolved: false,
    root: { nodes: [{ author: { login: reviewer }, databaseId: id }] },
    recent: { nodes: recent },
  }
}

function reviewFixMarker(id, sha) {
  return `<!-- claude-fix-review:fixed:${id}:${'b'.repeat(12)}:${sha} -->`
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
  const [browser, ci, fix, followup, triage, reusable, codeql, codeRabbit] = await Promise.all([
    readFile('.github/workflows/claude-qa-browser.yml', 'utf8'),
    readFile('.github/workflows/ci.yml', 'utf8'),
    readFile('.github/workflows/claude-fix-review.yml', 'utf8'),
    readFile('.github/workflows/claude-qa-followup.yml', 'utf8'),
    readFile('.github/workflows/claude-flaky-detect.yml', 'utf8'),
    readFile('.github/workflows/reusable-node-command.yml', 'utf8'),
    readFile('.github/workflows/codeql.yml', 'utf8'),
    readFile('.coderabbit.yaml', 'utf8'),
  ])
  assert.match(browser, /qa-workflow-policy\.mjs/)
  assert.match(browser, /Bash\(agent-browser:\*\)/)
  assert.match(browser, /agent-browser set device "iPhone 14"/)
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
  assert.match(fix, /Confirm previously fixed findings after a fresh review/)
  assert.match(fix, /MAX_AUTO_FIX_ROUNDS: 3/)
  assert.match(fix, /MAX_AUTO_FIX_FILES: 8/)
  assert.match(fix, /MAX_AUTO_FIX_LINES: 400/)
  assert.match(fix, /fixed-findings\.json.*rejected-findings\.json.*needs-human-findings\.json/s)
  assert.match(fix, /Preclassified human findings were removed or changed/)
  assert.match(fix, /Fixed findings do not account for the candidate paths/)
  assert.match(fix, /reviewThreads\(first: 100, after: \$after\)/)
  assert.match(fix, /pnpm test:a11y\s+pnpm build/)
  assert.match(fix, /core\.setOutput\('needs_human'/)
  assert.doesNotMatch(fix, /Immediately reply in-thread/)
  assert.match(codeRabbit, /auto_pause_after_reviewed_commits: 3/)
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
  assert.match(triage, /head_repository\.full_name == github\.repository/)
  assert.match(triage, /pull\.head\.sha !== expectedSha/)
  assert.match(triage, /filter\(name => name !== 'Required CI'\)/)
  assert.doesNotMatch(triage, /anthropics\/claude-code-action|actions\/checkout|id-token:/)
  assert.match(reusable, /case "\$PROFILE" in/)
  assert.doesNotMatch(reusable, /inputs\.command/)
  assert.match(codeql, /github\/codeql-action\/analyze@[0-9a-f]{40}/)
})

test('fresh reviews only confirm exactly bound workflow fixes', async () => {
  const workflow = parseYaml(await readFile('.github/workflows/claude-fix-review.yml', 'utf8'))
  const step = workflow.jobs.gate.steps.find(
    (candidate) => candidate.name === 'Confirm previously fixed findings after a fresh review',
  )
  assert.ok(step, 'fresh-review confirmation step must exist')
  const reviewedSha = 'a'.repeat(40)
  const thread = (id, overrides = {}) => ({
    id: `thread-${id}`,
    isOutdated: true,
    isResolved: false,
    root: { nodes: [{ author: { login: 'coderabbitai' }, databaseId: id }] },
    recent: {
      nodes: [{
        author: { login: 'github-actions[bot]' },
        body: reviewFixMarker(id, reviewedSha),
      }],
    },
    ...overrides,
  })
  const pages = [
    [
      thread(11),
      thread(12, { isOutdated: false }),
      thread(13, {
        root: { nodes: [{ author: { login: 'copilot-pull-request-reviewer' }, databaseId: 13 }] },
      }),
      thread(14, {
        recent: {
          nodes: [{ author: { login: 'someone' }, body: reviewFixMarker(14, reviewedSha) }],
        },
      }),
    ],
    [
      thread(15, { isResolved: true }),
      thread(16, {
        recent: {
          nodes: [{
            author: { login: 'github-actions[bot]' },
            body: reviewFixMarker(16, 'c'.repeat(40)),
          }],
        },
      }),
    ],
  ]
  const resolved = []
  const github = {
    async graphql(query, variables) {
      if (query.startsWith('mutation')) {
        resolved.push(variables.threadId)
        return { resolveReviewThread: { thread: { isResolved: true } } }
      }
      const pageIndex = variables.after ? 1 : 0
      return {
        repository: { pullRequest: { reviewThreads: {
          nodes: pages[pageIndex],
          pageInfo: { endCursor: pageIndex === 0 ? 'next' : null, hasNextPage: pageIndex === 0 },
        } } },
      }
    },
  }
  const context = {
    payload: {
      pull_request: { head: { sha: reviewedSha }, number: 42 },
      review: { commit_id: reviewedSha, user: { login: 'coderabbitai[bot]' } },
    },
    repo: { owner: 'owner', repo: 'repo' },
  }
  await new AsyncFunction('github', 'context', step.with.script)(github, context)
  assert.deepEqual(resolved, ['thread-11'])

  let staleQueries = 0
  const staleGithub = { graphql: async () => { staleQueries += 1 } }
  context.payload.review.commit_id = 'd'.repeat(40)
  await new AsyncFunction('github', 'context', step.with.script)(staleGithub, context)
  assert.equal(staleQueries, 0)
})

test('finding-set retries block only successful or recent pending runs', async () => {
  const workflow = parseYaml(await readFile('.github/workflows/claude-fix-review.yml', 'utf8'))
  const step = workflow.jobs.gate.steps.find(
    (candidate) => candidate.name === 'Fetch and seal the exact finding set',
  )
  assert.ok(step, 'finding-set gate must exist')
  const blockStart = step.run.indexOf('BLOCKING=$(jq')
  const filterStart = step.run.indexOf("'\n", blockStart) + 1
  const filterEnd = step.run.indexOf(`' <<<"$STATUSES")`, filterStart)
  assert.ok(blockStart !== -1 && filterStart > blockStart && filterEnd > filterStart)
  const filter = step.run.slice(filterStart, filterEnd)
  const prefix = 'claude-fix-review/abc/'
  const evaluate = (statuses) => {
    const result = spawnSync(
      'jq',
      ['--arg', 'prefix', prefix, '--argjson', 'now', '10000', filter],
      { encoding: 'utf8', input: JSON.stringify(statuses) },
    )
    assert.equal(result.status, 0, result.stderr)
    return JSON.parse(result.stdout)
  }
  const status = (state, createdAt = '1970-01-01T02:45:00Z') => ({
    context: `${prefix}123`,
    created_at: createdAt,
    creator: { login: 'github-actions[bot]' },
    state,
  })
  assert.equal(evaluate([]), false)
  assert.equal(evaluate([status('success')]), true)
  assert.equal(evaluate([status('failure')]), false)
  assert.equal(evaluate([status('pending')]), true)
  assert.equal(evaluate([status('pending', '1970-01-01T00:00:01Z')]), false)
})

test('repair-round cap and source boundary partition findings for human review', async () => {
  const findings = [finding(1, 'src/a.ts'), finding(2, '.github/workflows/ci.yml')]
  const belowCap = await runReviewPartitionFixture({ findings, repairRounds: 2 })
  assert.deepEqual(belowCap.agent.map((entry) => entry.commentId), [1])
  assert.deepEqual(belowCap.human.map((entry) => entry.commentId), [2])
  assert.match(belowCap.human[0].evidence, /source-only automation boundary/)
  assert.match(belowCap.output, /^actionable=1$/m)

  const exhausted = await runReviewPartitionFixture({ findings, repairRounds: 3 })
  assert.deepEqual(exhausted.agent, [])
  assert.deepEqual(exhausted.human.map((entry) => entry.commentId), [1, 2])
  assert.ok(exhausted.human.every((entry) => /repair-round budget/.test(entry.evidence)))
  assert.match(exhausted.output, /^actionable=0$/m)
})

test('review replies paginate independently and remain idempotent', async () => {
  const workflow = parseYaml(await readFile('.github/workflows/claude-fix-review.yml', 'utf8'))
  const step = workflow.jobs.publish.steps.find(
    (candidate) => candidate.name === 'Reply to and resolve sealed findings',
  )
  assert.ok(step, 'review reply step must exist')
  const directory = mkdtempSync(path.join(tmpdir(), 'review-replies-'))
  const files = {
    FIXED_PATH: [{
      ...fixedDecision(1, 'src/fixed.ts'),
      testEvidence: 'Tests passed.',
    }],
    FINDINGS_PATH: [
      { ...finding(1, 'src/fixed.ts'), reviewer: 'coderabbitai' },
      { ...finding(2, 'src/rejected.ts'), reviewer: 'copilot-pull-request-reviewer' },
      { ...finding(3, 'src/human.ts'), reviewer: 'coderabbitai' },
    ],
    HUMAN_PATH: [{
      commentId: 3,
      confidence: 1,
      evidence: 'The change crosses the automation boundary.',
      summary: 'Manual decision required.',
    }],
    METRICS_PATH: {
      attempted_files: 1,
      attempted_lines: 2,
      fixed: 1,
      needs_human: 1,
      rejected: 1,
      repair_round: 0,
    },
    REJECTED_PATH: [{
      commentId: 2,
      confidence: 0.8,
      evidence: 'The reviewer assumption does not apply.',
      summary: 'False positive.',
    }],
  }
  const previousEnvironment = {}
  for (const [name, contents] of Object.entries(files)) {
    const filePath = path.join(directory, `${name}.json`)
    writeFileSync(filePath, JSON.stringify(contents))
    previousEnvironment[name] = process.env[name]
    process.env[name] = filePath
  }
  Object.assign(previousEnvironment, {
    PR_NUMBER: process.env.PR_NUMBER,
    PUSHED_SHA: process.env.PUSHED_SHA,
    SIGNATURE: process.env.SIGNATURE,
  })
  process.env.PR_NUMBER = '42'
  process.env.PUSHED_SHA = 'e'.repeat(40)
  process.env.SIGNATURE = 'f'.repeat(12)
  const fixedMarker = `<!-- claude-fix-review:fixed:1:${process.env.SIGNATURE}:${process.env.PUSHED_SHA} -->`
  const replies = []
  let pageQueries = 0
  let summaryComments = 0
  const github = {
    async graphql(_query, variables) {
      pageQueries += 1
      const firstPage = !variables.after
      return {
        repository: { pullRequest: { reviewThreads: {
          nodes: firstPage
            ? [reviewThread(1, 'coderabbitai', [{
                author: { login: 'github-actions[bot]' },
                body: fixedMarker,
              }]),
                reviewThread(2, 'copilot-pull-request-reviewer')]
            : [reviewThread(3, 'coderabbitai')],
          pageInfo: { endCursor: firstPage ? 'next' : null, hasNextPage: firstPage },
        } } },
      }
    },
    paginate: async () => [{
      body: `<!-- claude-fix-review-human:${process.env.SIGNATURE} -->`,
      user: { login: 'github-actions[bot]' },
    }],
    rest: {
      issues: {
        createComment: async () => { summaryComments += 1 },
        listComments: Symbol('listComments'),
      },
      pulls: {
        createReplyForReviewComment: async (input) => { replies.push(input) },
      },
    },
  }
  const outputs = {}
  const summary = {
    addHeading() { return this },
    addTable() { return this },
    async write() {},
  }
  const core = {
    setOutput(name, value) { outputs[name] = value },
    summary,
  }
  const context = { repo: { owner: 'owner', repo: 'repo' } }
  try {
    await new AsyncFunction('require', 'github', 'core', 'context', step.with.script)(
      require,
      github,
      core,
      context,
    )
  } finally {
    for (const [name, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
  assert.equal(pageQueries, 2)
  assert.deepEqual(replies.map((reply) => reply.comment_id), [2, 3])
  assert.doesNotMatch(replies[0].body, /@coderabbitai/)
  assert.match(replies[1].body, /needs-human:3:/)
  assert.equal(summaryComments, 0)
  assert.equal(outputs.needs_human, '1')
})

test('candidate validation enforces decisions, path binding, and diff budgets', async () => {
  const valid = await runReviewCandidateFixture({
    baseline: { 'src/a.ts': 'old\n' },
    changed: { 'src/a.ts': 'new\n' },
    findings: [finding(1, 'src/a.ts')],
    fixed: [fixedDecision(1, 'src/a.ts')],
  })
  assert.equal(valid.result.status, 0, valid.result.stderr)
  assert.notEqual(
    readFileSync(path.join(valid.scratch, 'review-candidate/candidate.sha'), 'utf8').trim(),
    valid.initialSha,
  )

  const duplicate = await runReviewCandidateFixture({
    baseline: { 'src/a.ts': 'old\n' },
    changed: { 'src/a.ts': 'new\n' },
    findings: [finding(1, 'src/a.ts')],
    fixed: [fixedDecision(1, 'src/a.ts')],
    rejected: [{
      commentId: 1,
      confidence: 1,
      evidence: 'duplicate',
      summary: 'duplicate',
    }],
  })
  assert.notEqual(duplicate.result.status, 0)

  const preclassified = {
    commentId: 1,
    confidence: 1,
    evidence: 'Policy boundary.',
    summary: 'Human review required.',
  }
  const altered = await runReviewCandidateFixture({
    baseline: { 'src/a.ts': 'old\n' },
    changed: {},
    findings: [finding(1, 'src/a.ts')],
    human: [{ ...preclassified, summary: 'Changed by agent.' }],
    preclassified: [preclassified],
  })
  assert.notEqual(altered.result.status, 0)

  const mismatched = await runReviewCandidateFixture({
    baseline: { 'src/a.ts': 'old\n', 'src/b.ts': 'old\n' },
    changed: { 'src/b.ts': 'new\n' },
    findings: [finding(1, 'src/a.ts')],
    fixed: [fixedDecision(1, 'src/b.ts')],
  })
  assert.notEqual(mismatched.result.status, 0)

  const boundaryBaseline = Object.fromEntries(
    Array.from({ length: 8 }, (_, index) => [`src/f${index}.ts`, 'old\n']),
  )
  const boundaryChanged = Object.fromEntries(
    Array.from({ length: 8 }, (_, index) => [
      `src/f${index}.ts`,
      index === 0 ? 'new\n'.repeat(385) : 'new\n',
    ]),
  )
  const boundaryFindings = Array.from(
    { length: 8 },
    (_, index) => finding(index + 1, `src/f${index}.ts`),
  )
  const boundary = await runReviewCandidateFixture({
    baseline: boundaryBaseline,
    changed: boundaryChanged,
    findings: boundaryFindings,
    fixed: boundaryFindings.map((entry) =>
      fixedDecision(entry.commentId, entry.location.replace(/:[0-9]+$/, ''))),
  })
  assert.equal(boundary.result.status, 0, boundary.result.stderr)
  assert.notEqual(
    readFileSync(path.join(boundary.scratch, 'review-candidate/candidate.sha'), 'utf8').trim(),
    boundary.initialSha,
  )

  for (const overBudget of [
    {
      baseline: Object.fromEntries(
        Array.from({ length: 9 }, (_, index) => [`src/f${index}.ts`, 'old\n']),
      ),
      changed: Object.fromEntries(
        Array.from({ length: 9 }, (_, index) => [`src/f${index}.ts`, 'new\n']),
      ),
    },
    {
      baseline: { 'src/a.ts': 'old\n' },
      changed: { 'src/a.ts': 'new\n'.repeat(400) },
    },
  ]) {
    const paths = Object.keys(overBudget.changed)
    const fixedFindings = paths.map((file, index) => finding(index + 1, file))
    const budgetPreclassified = {
      commentId: 100,
      confidence: 1,
      evidence: 'The finding requires a cross-file change.',
      summary: 'Human review required by policy.',
    }
    const findings = [
      ...fixedFindings,
      finding(budgetPreclassified.commentId, 'src/human.ts'),
    ]
    const result = await runReviewCandidateFixture({
      ...overBudget,
      findings,
      fixed: paths.map((file, index) => fixedDecision(index + 1, file)),
      human: [budgetPreclassified],
      preclassified: [budgetPreclassified],
    })
    assert.equal(result.result.status, 0, result.result.stderr)
    assert.equal(
      readFileSync(path.join(result.scratch, 'review-candidate/candidate.sha'), 'utf8').trim(),
      result.initialSha,
    )
    const fixedPath = path.join(result.scratch, 'fixed-findings.json')
    const fixedManifest = JSON.parse(readFileSync(fixedPath, 'utf8'))
    assert.deepEqual(fixedManifest, [])
    const humanManifest = JSON.parse(readFileSync(
      path.join(result.scratch, 'needs-human-findings.json'),
      'utf8',
    ))
    assert.deepEqual(
      humanManifest.map((entry) => entry.commentId).toSorted((left, right) => left - right),
      findings.map((entry) => entry.commentId).toSorted((left, right) => left - right),
    )
    assert.deepEqual(
      humanManifest.find((entry) => entry.commentId === budgetPreclassified.commentId),
      budgetPreclassified,
    )
    const budgetEscalations = humanManifest.filter(
      (decision) => decision.commentId !== budgetPreclassified.commentId,
    )
    for (const entry of budgetEscalations) {
      assert.match(entry.summary, /exceeded the safe diff budget/)
      assert.match(entry.evidence, /discarded before verification or publication/)
    }
    assert.equal(runGit(result.repository, ['status', '--porcelain']), '')
  }
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
  const workflow = parseYaml(await readFile('.github/workflows/claude-ci-fix.yml', 'utf8'))
  const steps = workflow.jobs.verify.steps
  const cache = steps.find((step) => step.name === 'Cache Playwright browsers')
  const dependencies = steps.find((step) => step.name === 'Install Playwright system dependencies')
  const browser = steps.find((step) => step.name === 'Install Playwright browser')

  assert.match(cache.with.key, /\$\{\{ runner\.arch \}\}/)
  assert.equal(dependencies.if, "runner.os == 'Linux'")
  assert.equal(dependencies.run, 'pnpm exec playwright install-deps chromium')
  assert.equal(browser.if, "steps.playwright-cache.outputs.cache-hit != 'true'")
  assert.equal(browser.run, 'pnpm exec playwright install chromium')
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

test('deterministic CI failures bypass the flaky retry with the aggregate failure', async () => {
  const workflow = parseYaml(await readFile('.github/workflows/claude-flaky-detect.yml', 'utf8'))
  const script = workflow.jobs.triage.steps[0].with.script
  const calls = { comments: 0, dispatches: 0, reruns: 0 }
  const expectedSha = 'a'.repeat(40)
  const environment = {
    DEFAULT_BRANCH: 'main',
    EXPECTED_HEAD_SHA: expectedSha,
    EXPECTED_REPOSITORY: 'owner/repo',
    HEAD_BRANCH: 'feature',
    PR_NUMBER: '42',
    RUN_ATTEMPT: '1',
    RUN_ID: '123',
    RUN_URL: 'https://example.test/run/123',
  }
  const previous = Object.fromEntries(
    Object.keys(environment).map((name) => [name, process.env[name]]),
  )
  Object.assign(process.env, environment)
  const summary = {
    addHeading() {
      return this
    },
    addRaw() {
      return this
    },
    async write() {},
  }
  const github = {
    paginate: async () => [
      { conclusion: 'failure', name: 'type-check' },
      { conclusion: 'failure', name: 'Required CI' },
    ],
    rest: {
      actions: {
        createWorkflowDispatch: async () => {
          calls.dispatches += 1
        },
        getWorkflowRun: async () => ({
          data: {
            conclusion: 'failure',
            head_repository: { full_name: 'owner/repo' },
            head_sha: expectedSha,
            name: 'CI',
          },
        }),
        listJobsForWorkflowRun: Symbol('listJobsForWorkflowRun'),
        reRunWorkflowFailedJobs: async () => {
          calls.reruns += 1
        },
      },
      issues: {
        createComment: async () => {
          calls.comments += 1
        },
      },
      pulls: {
        get: async () => ({
          data: {
            head: { repo: { full_name: 'owner/repo' }, sha: expectedSha },
            state: 'open',
          },
        }),
      },
    },
  }
  const core = {
    setFailed(message) {
      assert.fail(message)
    },
    summary,
  }

  try {
    await new AsyncFunction('github', 'core', script)(github, core)
  } finally {
    for (const [name, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[name]
      else process.env[name] = value
    }
  }
  assert.deepEqual(calls, { comments: 0, dispatches: 1, reruns: 0 })
})

test('deprecated and competing privileged workflows are removed', async () => {
  const workflowNames = await readdir('.github/workflows')
  assert.equal(workflowNames.includes('claude-qa-test.yml'), false)
  assert.equal(workflowNames.includes('release.yml'), false)
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
