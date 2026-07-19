---
type: Lesson
title: Claude repair commits need a credential-isolated publish handoff
description: Validate Claude's local commit, publish it without exposing a write token to PR code, and dispatch downstream workflows explicitly.
resource: brain/lessons/claude-direct-push-handoff.md
tags: [lesson, ci, github-actions, claude-code-action, self-healing]
timestamp: 2026-07-19T07:15:00Z
---

## Claude Repair Commits Need a Credential-Isolated Publish Handoff

The July 18, 2026 self-healing audit found that Claude sometimes committed and
pushed successfully from `claude-code-action`, but the workflow then compared
local and remote HEAD, concluded there was "nothing to push," and skipped its
downstream CI dispatch. A push made with `GITHUB_TOKEN` does not trigger another
workflow run, so a successful repair could silently stop the healing loop.

The first direct-push design exposed the checkout credential while Claude ran
PR-controlled package scripts. That is not a safe security boundary: a modified
script or local composite action could reuse the repository token before any
post-push validation ran. Path checks after publication are also too late.

### Reliable handoff pattern

1. Record the validated PR head SHA before Claude starts.
2. Check out that exact SHA with `persist-credentials: false`, use a deliberately
   read-only GitHub token for Claude, and never run PR code in Claude's
   OAuth-bearing job.
3. Let Claude diagnose and edit only an explicit safe path set, with no shell or
   commit tool access. A workflow-owned step validates the diff, creates fixed
   commit metadata with a run-specific trailer, and exports that exact Git
   object as a short-lived bundle artifact.
4. On a fresh secretless runner, import the bundle and run dependency install,
   type-check, lint, and tests. Export the same object plus its digest.
5. On a third fresh writer runner, revalidate the digest, commit trailer, path
   policy, PR identity, and unchanged remote head. Push the validated SHA (not
   mutable `HEAD`) with an exact `--force-with-lease` expectation.
6. Queue a small durable handoff workflow keyed by the published SHA. It can be
   rerun independently if downstream CI or review dispatch has an outage.
7. Key a commit status by head SHA plus failed-job signature to prevent repeated
   model calls for the same unchanged failure; retain a manual force override.

Dependency installation must not block the repair agent when the dependency
failure itself is what needs repair. Fetch the failed logs first and make the
general agent source-only. Route a recognized stale-lockfile error to a separate
secretless deterministic `pnpm install --lockfile-only --ignore-scripts` path;
do not let a general candidate modify its own verification configuration.

For QA follow-up, validate the referenced browser workflow run as well as the
bot comment, keep report and PR metadata classified as untrusted data, limit
edits to `src/`, and enforce that path boundary before publication. If the PR
head advances while the agent works, the exact-head publish gate must abort
instead of rebasing unrelated human commits into the verified result.
