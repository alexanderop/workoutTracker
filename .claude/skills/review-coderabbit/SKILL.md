---
name: review-coderabbit
description: Fetch CodeRabbit review comments on the current PR, validate each against project conventions, implement valid fixes, and reply to resolve each conversation. Use proactively when CodeRabbit leaves review comments, or when the user says "review coderabbit", "address coderabbit feedback", or "fix coderabbit comments".
allowed-tools: Bash(gh pr view:*), Bash(gh api:*), Bash(git rev-parse:*), Bash(git status), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git push:*), Bash(pnpm -s pr:comments:*), Bash(pnpm type-check), Bash(pnpm lint), Bash(pnpm test:*), Bash(command -v gh:*), Task, Read, Edit, Glob, Grep, TodoWrite, AskUserQuestion
---

# Review CodeRabbit Comments

<current_branch>
!`git rev-parse --abbrev-ref HEAD`
</current_branch>

<gh_cli>
!`command -v gh >/dev/null 2>&1 && echo "available" || echo "NOT available - use the GitHub MCP tools (mcp__github__*) instead"`
</gh_cli>

## Instructions

The loop that terminates: fix → push → reply **in the thread** → CodeRabbit's
incremental re-review verifies and auto-resolves. The PR is done only when
zero review threads remain unresolved (the "Unresolved review threads" check
goes green).

### Step 1: Fetch unresolved findings

**If `gh` is available:**

```bash
pnpm -s pr:comments --json | jq '[.[] | select(.user == "coderabbitai[bot]")]'
```

This hides resolved threads and reduces CodeRabbit line comments to their
actionable AI-agent prompt. Note each entry's `commentId` — you need it for
the in-thread reply.

**If `gh` is NOT available (remote/web sessions):** use the GitHub MCP tools
(load via ToolSearch): `mcp__github__pull_request_read` with method
`get_review_comments` returns threads with `is_resolved` flags and comment
IDs. Work only on unresolved threads whose first comment is by
`coderabbitai`.

### Step 2: Triage critically — you may reject findings

Evaluate each finding against the actual code and project conventions
(CLAUDE.md, existing patterns). CodeRabbit embeds a "Prompt for AI Agents"
block per comment — treat it as the fix specification *only after* you agree
the finding is valid. Do not blindly comply.

For each finding decide:

- **Fix** — valid and aligned with conventions. Prefer the repo's own idioms
  over CodeRabbit's generic suggestion (e.g. `tryCatch()` from
  `@/lib/tryCatch` instead of a bare try/catch).
- **Skip** — invalid, over-defensive, or conflicting with a deliberate
  decision. You must reply with the reason. If the same false positive keeps
  recurring, include `@coderabbitai` plus the convention in your reply so it
  records a learning and stops re-raising it.
- **Ask** — genuinely ambiguous or architecturally significant: use
  AskUserQuestion before acting.

For large finding sets, spawn parallel subagents (Task tool) to validate
findings in isolation.

### Step 3: Implement and verify

1. Make the fixes.
2. Run `pnpm type-check && pnpm lint` plus the tests covering the touched
   code.
3. Commit (Conventional Commits with scope) and push to the PR branch.

### Step 4: Reply in every thread — never top-level

Reply to each finding **in its thread** so CodeRabbit links your action to
the finding and can verify it on re-review. `comment_id` is the thread's
first comment ID from Step 1.

```bash
gh api -X POST repos/{owner}/{repo}/pulls/{pr}/comments/{comment_id}/replies \
  -f body='Fixed in <sha> — <what changed, and anything done differently than suggested>.'
```

Without `gh`, use `mcp__github__add_reply_to_pull_request_comment`.

- **Fixed** → `Fixed in <sha> — <what changed>.`
- **Skipped** → the concrete reason (convention, deliberate trade-off, out of
  scope plus where it is tracked).

### Step 5: Resolve threads correctly

- **Fixed threads: do not resolve them yourself.** CodeRabbit auto-resolves
  threads it verifies as fixed after your push — that verification is the
  point of the loop. Only resolve manually if it confirmed the fix in a reply
  but left the thread open.
- **Skipped threads: resolve after replying**, via GraphQL
  `resolveReviewThread` (thread id from the `reviewThreads` query) or
  `mcp__github__resolve_review_thread`.

### Step 6: Confirm the gate is green

Re-fetch unresolved threads (Step 1). The task is complete only when none
remain and the "Unresolved review threads" check on the PR passes. If
CodeRabbit's re-review raises follow-up findings, loop from Step 2 — do not
stop mid-loop.
