#!/usr/bin/env -S pnpm dlx tsx
// Fetch ALL feedback on a PR in one pass: issue comments, review summaries,
// review approvals/change-requests, line-level review comments, and inline
// suggestions. `gh pr view --comments` only returns the issue-stream comments,
// which silently hides everything a reviewer leaves on the Files changed tab.
//
// Adapted from oven-sh/bun's scripts/pr-comments.ts (MIT).
//
// Usage:
//   pnpm -s pr:comments                    # current branch's PR
//   pnpm -s pr:comments 151                # by PR number
//   pnpm -s pr:comments '#151'             # also works
//   pnpm -s pr:comments https://github.com/alexanderop/workoutTracker/pull/151
//   pnpm -s pr:comments 151 --include-resolved  # also show resolved threads
//   pnpm -s pr:comments 151 --json              # machine-readable output for jq pipelines
//
// Default output is XML with resolved threads and bot noise (CodeRabbit
// body-level summaries/walkthroughs, Claude/Vercel workflow status comments)
// filtered out. Pass --include-resolved to restore resolved threads.
//
// JSON mode emits one object per entry with fields:
//   { when, user, tag, state?, suggestion?, location?, commentId?, body, url?, resolved?, outdated? }
// commentId is the REST id of line comments / replies — pass it to
// `gh api .../pulls/{pr}/comments/{commentId}/replies` to answer a thread.
// resolved/outdated come from GitHub's GraphQL reviewThreads and are only
// present on line comments / replies whose thread state was successfully
// fetched. They're omitted entirely on issue comments, review verdicts, and
// any entry where the GraphQL fetch failed — so `resolved == false` in jq
// unambiguously means "confirmed unresolved thread". You can filter with jq,
// e.g. (the PR is optional, defaults to current branch):
//   pnpm -s pr:comments --json | jq '.[] | select(.user == "coderabbitai[bot]")'

import { spawnSync } from 'node:child_process'

type RunResult = { exitCode: number; stdout: string; stderr: string }

function run(cmd: string, args: Array<string>): RunResult {
  const result = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })
  if (result.error) {
    console.error(`Could not run ${cmd}: ${result.error.message}`)
    process.exit(1)
  }
  return { exitCode: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
}

function print(line: string): void {
  process.stdout.write(`${line}\n`)
}

type GhUser = { login?: string }
type GhIssueComment = { created_at: string; user?: GhUser; body?: string; html_url?: string }
type GhReview = {
  submitted_at: string
  user?: GhUser
  state?: string
  body?: string
  html_url?: string
}
type GhReviewComment = {
  id: number
  created_at: string
  user?: GhUser
  body?: string
  html_url?: string
  path?: string
  line?: number
  in_reply_to_id?: number
}

// `--paginate` is load-bearing: GitHub's REST API defaults to 30 items per
// page, and without it a PR with more than 30 issue comments / reviews /
// line comments would silently truncate — the exact footgun this script is
// supposed to eliminate. gh follows Link: rel=next headers for us and emits
// one concatenated array.
function gh<T>(path: string): Array<T> {
  const result = run('gh', ['api', '--paginate', path])
  if (result.exitCode !== 0) {
    const stderr = result.stderr.trim()
    console.error(`gh api --paginate ${path} failed (exit ${result.exitCode}).`)
    if (stderr) console.error(stderr)
    console.error('Check that `gh auth status` is healthy and that the PR exists.')
    process.exit(1)
  }
  try {
    return JSON.parse(result.stdout) as Array<T>
  } catch (error) {
    console.error(
      `Could not parse response from \`gh api --paginate ${path}\` as JSON: ${(error as Error).message}`,
    )
    process.exit(1)
  }
}

// Thread state (isResolved, isOutdated) is only exposed via GraphQL — the REST
// /pulls/N/comments endpoint omits it entirely. Returns a Map from the REST
// comment id (GraphQL `databaseId`) to its thread's state. On any failure we
// warn to stderr and return null so the caller proceeds without annotations
// rather than crashing.
//
// Pagination is fully manual (not `gh api graphql --paginate`) because the
// concatenated output format of gh's --paginate for GraphQL responses is not
// standard JSON. Manual cursor loops let us parse each page with plain
// JSON.parse and also handle nested pagination (per-thread comments) when a
// single thread has more than 100 comments.
type ThreadState = { resolved: boolean; outdated: boolean }

type GqlPageInfo = { hasNextPage?: boolean; endCursor?: string }
type GqlCommentsPage = { pageInfo?: GqlPageInfo; nodes?: Array<{ databaseId?: number | null }> }
type GqlThreadNode = {
  id: string
  isResolved?: boolean
  isOutdated?: boolean
  comments?: GqlCommentsPage
}
type GqlThreadsResponse = {
  data?: {
    repository?: {
      pullRequest?: {
        reviewThreads?: { pageInfo?: GqlPageInfo; nodes?: Array<GqlThreadNode> }
      }
    }
  }
}
type GqlInnerResponse = { data?: { node?: { comments?: GqlCommentsPage } } }

function runGraphQL<T>(query: string, vars: Record<string, string | number>): T | null {
  const flags = Object.entries(vars).flatMap(([k, v]) => ['-F', `${k}=${v}`])
  const result = run('gh', ['api', 'graphql', '-f', `query=${query}`, ...flags])
  if (result.exitCode !== 0) {
    console.error(`Warning: gh api graphql failed (exit ${result.exitCode}).`)
    const stderr = result.stderr.trim()
    if (stderr) console.error(`  ${stderr}`)
    return null
  }
  try {
    return JSON.parse(result.stdout) as T
  } catch (error) {
    console.error(`Warning: could not parse GraphQL response: ${(error as Error).message}`)
    return null
  }
}

function fetchThreadState(repo: string, number: number): Map<number, ThreadState> | null {
  const [owner, name] = repo.split('/')

  const threadQuery = `
    query($owner: String!, $name: String!, $number: Int!, $cursor: String) {
      repository(owner: $owner, name: $name) {
        pullRequest(number: $number) {
          reviewThreads(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes {
              id
              isResolved
              isOutdated
              comments(first: 100) {
                pageInfo { hasNextPage endCursor }
                nodes { databaseId }
              }
            }
          }
        }
      }
    }
  `

  // Inner pagination: if a single thread has more than 100 comments we have
  // to issue additional queries scoped to that thread to pick up the rest.
  const innerQuery = `
    query($threadId: ID!, $cursor: String) {
      node(id: $threadId) {
        ... on PullRequestReviewThread {
          comments(first: 100, after: $cursor) {
            pageInfo { hasNextPage endCursor }
            nodes { databaseId }
          }
        }
      }
    }
  `

  const map = new Map<number, ThreadState>()
  let cursor: string | undefined

  while (true) {
    const vars: Record<string, string | number> = { owner, name, number }
    if (cursor) vars.cursor = cursor

    const page = runGraphQL<GqlThreadsResponse>(threadQuery, vars)
    if (!page) return null
    const threadsField = page.data?.repository?.pullRequest?.reviewThreads
    if (!threadsField) return null

    for (const t of threadsField.nodes ?? []) {
      const state: ThreadState = { resolved: !!t.isResolved, outdated: !!t.isOutdated }
      for (const c of t.comments?.nodes ?? []) {
        if (typeof c.databaseId === 'number') map.set(c.databaseId, state)
      }

      // Paginate inner comments only when this thread overflowed the first 100.
      let innerCursor: string | undefined = t.comments?.pageInfo?.hasNextPage
        ? t.comments.pageInfo.endCursor
        : undefined
      while (innerCursor) {
        const innerVars: Record<string, string | number> = { threadId: t.id, cursor: innerCursor }
        const innerPage = runGraphQL<GqlInnerResponse>(innerQuery, innerVars)
        if (!innerPage) return null
        const innerComments = innerPage.data?.node?.comments
        if (!innerComments) break
        for (const c of innerComments.nodes ?? []) {
          if (typeof c.databaseId === 'number') map.set(c.databaseId, state)
        }
        innerCursor = innerComments.pageInfo?.hasNextPage
          ? innerComments.pageInfo.endCursor
          : undefined
      }
    }

    if (!threadsField.pageInfo?.hasNextPage) break
    cursor = threadsField.pageInfo.endCursor
  }

  return map
}

const prUrlRe = /github\.com\/([^/]+\/[^/]+)\/pull\/(\d+)/
const leadingHashRe = /^#/

function resolvePr(arg: string | undefined): { repo: string; number: number } {
  const urlMatch = arg?.match(prUrlRe)
  if (urlMatch) return { repo: urlMatch[1], number: Number(urlMatch[2]) }

  const repoResult = run('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'])
  if (repoResult.exitCode !== 0) {
    console.error('Could not determine the GitHub repo for the current directory.')
    console.error('Run this inside a repo with a GitHub remote, or pass a PR URL instead:')
    console.error('  pnpm -s pr:comments https://github.com/alexanderop/workoutTracker/pull/151')
    process.exit(1)
  }
  const repo = repoResult.stdout.trim()

  if (arg) {
    // PR numbers are positive integers. `Number.isFinite` would accept 1.5,
    // -1, and 0, all of which would just produce a confusing gh api error
    // later. Require a positive integer up front for a clearer message.
    const n = Number(arg.replace(leadingHashRe, ''))
    if (!Number.isSafeInteger(n) || n <= 0) {
      console.error(`Error: "${arg}" is not a PR number or URL.`)
      console.error('Usage: pnpm -s pr:comments [<number> | #<number> | <url>]')
      process.exit(1)
    }
    return { repo, number: n }
  }

  // No argument — look up a PR for the current branch. Don't merge stderr into
  // stdout — `gh` occasionally emits diagnostic lines like "A new release of
  // gh is available" to stderr, which would corrupt the JSON we parse.
  const branchResult = run('git', ['branch', '--show-current'])
  const branch = branchResult.stdout.trim()
  const lookup = run('gh', ['pr', 'view', '--json', 'number'])
  if (lookup.exitCode !== 0) {
    console.error(`No pull request found for the current branch (${branch || 'detached HEAD'}).`)
    console.error('')
    console.error('Options:')
    console.error('  - Pass a PR number:        pnpm -s pr:comments 151')
    console.error(
      '  - Pass a PR URL:           pnpm -s pr:comments https://github.com/alexanderop/workoutTracker/pull/151',
    )
    console.error('  - Push this branch and open a PR first')
    process.exit(1)
  }
  try {
    const view = JSON.parse(lookup.stdout.trim()) as { number: number }
    return { repo, number: view.number }
  } catch {
    console.error('Could not parse "gh pr view" output. Pass a PR number or URL instead.')
    process.exit(1)
  }
}

function fmtDate(iso: string): string {
  return new Date(iso).toISOString().replace('T', ' ').slice(0, 16)
}

function indent(text: string, prefix: string): string {
  return text
    .split('\n')
    .map((l) => prefix + l)
    .join('\n')
}

const xmlEscapeRe = /[<>&"']/g
const xmlEscapes: Record<string, string> = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
  '"': '&quot;',
  "'": '&apos;',
}

function xmlEscape(s: string): string {
  return s.replaceAll(xmlEscapeRe, (c) => xmlEscapes[c])
}

// CodeRabbit appends a collapsed "🤖 Prompt for AI Agents" <details> block with
// a fenced code block containing the actionable instruction. When present, that
// block is the only part worth feeding back to an agent — the prose above it is
// the human-facing duplicate. Otherwise: strip HTML comments (bot watermarks
// and sticky-comment markers) and cap length so one giant CI report doesn't
// drown out review feedback.
const aiPromptRe = /<summary>[^<]*🤖[^<]*AI [Aa]gents[^<]*<\/summary>\s*```[^\n]*\n([\s\S]*?)```/
const htmlCommentRe = /<!--[\s\S]*?-->/g

function cleanBody(body: string, max = 1000): string {
  const aiPrompt = body.match(aiPromptRe)
  if (aiPrompt) return aiPrompt[1].trim()

  const stripped = body.replaceAll(htmlCommentRe, '').trim()
  if (stripped.length <= max) return stripped
  return `${stripped.slice(0, max)}\n... [${stripped.length - max} more chars truncated]`
}

function xmlAttr(name: string, value: string | boolean | undefined): string {
  if (value === undefined || value === false) return ''
  if (value === true) return ` ${name}="true"`
  return ` ${name}="${xmlEscape(value)}"`
}

const rawArgs = process.argv.slice(2)
const jsonMode = rawArgs.includes('--json')
const includeResolved = rawArgs.includes('--include-resolved')
const positional = rawArgs.find((a) => !a.startsWith('--'))

const { repo, number } = resolvePr(positional)

const issueComments = gh<GhIssueComment>(`repos/${repo}/issues/${number}/comments`)
const reviews = gh<GhReview>(`repos/${repo}/pulls/${number}/reviews`)
const reviewComments = gh<GhReviewComment>(`repos/${repo}/pulls/${number}/comments`)
const threadState = fetchThreadState(repo, number)

type Entry = {
  when: string
  user: string
  tag: 'issue-comment' | 'review' | 'line-comment' | 'reply'
  state?: string
  suggestion?: boolean
  location?: string
  // REST id of a line comment / reply — the handle for posting an in-thread
  // reply via gh api .../pulls/{pr}/comments/{commentId}/replies.
  commentId?: number
  body: string
  url?: string
  // Present only on line-level entries whose thread state we successfully
  // looked up. Omitted entirely on issue comments, review verdicts, and any
  // thread entry where the GraphQL fetch failed — that way `resolved == false`
  // in jq unambiguously means "confirmed unresolved thread" with no overlap
  // between "not applicable" and "unknown". A stderr warning is printed when
  // the thread-state fetch fails so the omission is visible.
  resolved?: boolean
  outdated?: boolean
}

const entries: Array<Entry> = issueComments.map((c) => ({
  when: c.created_at,
  user: c.user?.login ?? '?',
  tag: 'issue-comment' as const,
  body: c.body ?? '',
  url: c.html_url,
}))

for (const r of reviews) {
  // Skip the empty "COMMENTED" review stub that GitHub emits as a container
  // for line-level comments — the real content is in reviewComments below.
  if (!r.body && r.state === 'COMMENTED') continue
  // PENDING reviews are drafts the viewer hasn't submitted yet. They have
  // submitted_at=null (which would crash the sort below) and aren't visible
  // to anyone else, so skip them.
  if (r.state === 'PENDING') continue
  entries.push({
    when: r.submitted_at,
    user: r.user?.login ?? '?',
    tag: 'review',
    state: (r.state ?? 'unknown').toLowerCase().replaceAll('_', '-'),
    body: r.body || '(no body)',
    url: r.html_url,
  })
}

const suggestionRe = /```suggestion\b/

for (const c of reviewComments) {
  const loc = c.path ? `${c.path}${c.line ? `:${c.line}` : ''}` : undefined
  // Only annotate when we have confirmed thread state. If threadState is null
  // (GraphQL fetch failed) or this comment isn't in the map, we omit both
  // fields rather than setting them to null — see the Entry type comment.
  const state = threadState?.get(c.id)
  const body = c.body ?? ''
  const entry: Entry = {
    when: c.created_at,
    user: c.user?.login ?? '?',
    tag: c.in_reply_to_id ? 'reply' : 'line-comment',
    suggestion: suggestionRe.test(body) || undefined,
    location: loc,
    commentId: c.id,
    body,
    url: c.html_url,
  }
  if (state) {
    entry.resolved = state.resolved
    entry.outdated = state.outdated
  }
  entries.push(entry)
}

const collator = new Intl.Collator('en')
entries.sort((a, b) => collator.compare(a.when, b.when))

// Bot-noise filter. CodeRabbit posts (a) line comments with an AI-agent prompt
// — keep those — and (b) body-level entries (issue comments, review summaries)
// that either have no AI prompt at all (Walkthrough, Reviews paused) or just
// aggregate the line comments verbatim. Drop both (b) cases.
const isLineLevel = (e: Entry): boolean => e.tag === 'line-comment' || e.tag === 'reply'
const coderabbitHasLineComments = entries.some(
  (e) => e.user === 'coderabbitai[bot]' && isLineLevel(e),
)

const claudeWatermarkRe = /<!--\s*claude-/
const qaReportRe = /^#{1,3} QA /m

function isBotNoise(e: Entry): boolean {
  // Vercel's deployment status card — CI status, edited in place per push.
  if (e.user === 'vercel[bot]') return true
  // claude-code-action progress/status comments (the claude-pr-review sticky
  // summary, QA verdicts): normally carry a "[View job](...)" header line
  // linking the workflow run, and duplicate the inline review comments which
  // are line-level and kept. The comment is edited in place while the job
  // runs, and in transient states the header is absent — so also match the
  // QA report heading the qa workflows write.
  if (
    e.user === 'claude[bot]' &&
    !isLineLevel(e) &&
    (e.body.includes('[View job') || qaReportRe.test(e.body))
  )
    return true
  // Workflow-generated reports posted by github-actions[bot] carry a
  // `<!-- claude-... -->` watermark so the workflow can find them again.
  if (e.user === 'github-actions[bot]' && claudeWatermarkRe.test(e.body)) return true
  if (e.user === 'coderabbitai[bot]' && !isLineLevel(e)) {
    if (!aiPromptRe.test(e.body)) return true
    if (coderabbitHasLineComments) return true
  }
  return false
}

// Resolved threads are noise when you're looking for what's actionable. Only
// drop entries we know are resolved — issue comments and review verdicts have
// no thread state and always pass through.
const resolvedHidden = entries.reduce((n, e) => n + (e.resolved === true ? 1 : 0), 0)
const visible = entries.filter((e) => !isBotNoise(e) && (includeResolved || e.resolved !== true))

if (jsonMode) {
  // Clean bodies here too so JSON consumers get the same noise-free content
  // as the XML output (AI-agent prompts extracted, watermarks stripped,
  // giant reports truncated).
  const cleaned = visible.map((entry) => ({ ...entry, body: cleanBody(entry.body) }))
  print(JSON.stringify(cleaned, null, 2))
  process.exit(0)
}

const url = `https://github.com/${repo}/pull/${number}`
const hiddenAttr =
  !includeResolved && resolvedHidden > 0 ? xmlAttr('resolved-hidden', String(resolvedHidden)) : ''
print(
  `<pr-comments${xmlAttr('repo', repo)}${xmlAttr('number', String(number))}${xmlAttr('url', url)}${hiddenAttr}>`,
)
for (const e of visible) {
  const attrs =
    xmlAttr('user', e.user) +
    xmlAttr('when', fmtDate(e.when)) +
    xmlAttr('state', e.state) +
    xmlAttr('location', e.location) +
    xmlAttr('suggestion', e.suggestion) +
    xmlAttr('resolved', e.resolved) +
    xmlAttr('outdated', e.outdated) +
    xmlAttr('url', e.url)
  const body = cleanBody(e.body)
  if (body) {
    print(`  <${e.tag}${attrs}>`)
    print(indent(xmlEscape(body), ' '.repeat(4)))
    print(`  </${e.tag}>`)
  } else {
    print(`  <${e.tag}${attrs} />`)
  }
}
print('</pr-comments>')
