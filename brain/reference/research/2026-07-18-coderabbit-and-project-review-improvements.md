---
type: Research
title: CodeRabbit and project review improvements
description: Evidence-based recommendations for improving CodeRabbit signal, review policy, and CI coverage in workoutTracker.
resource: brain/reference/research/2026-07-18-coderabbit-and-project-review-improvements.md
tags: [research, coderabbit, code-review, ci, testing]
timestamp: 2026-07-18T10:09:00Z
---

## Problem Statement

The repository already has strong automated review and CI infrastructure. The
goal is to make CodeRabbit more aware of workoutTracker's local-first, Dexie,
Vue, and browser-testing constraints while reducing duplicate or low-value
feedback. The review also looked for project risks that CodeRabbit cannot cover
reliably by itself.

The evidence combines CodeRabbit's current official documentation and blog,
community reports, the repository configuration, and a sample of recent merged
pull requests.

## Key Findings

### The current foundation is strong

- `.coderabbit.yaml` uses valid current schema keys and enables useful static
  analysis tools.
- CodeRabbit automatically reads root `AGENTS.md` and `CLAUDE.md`, so the
  explicit `filePatterns` entries for those files are redundant but harmless.
- Review automation retrieves inline review threads correctly and tells the
  fixing agent to judge findings instead of applying them blindly.
- CI already covers lint, type checking, build, dependency and secret scans,
  browser tests, architecture, accessibility, visual regression, Lighthouse,
  bundle size, and SBOM generation.
- The PR template already asks for user impact, acceptance criteria, risk, QA,
  and manual scenarios.

### CodeRabbit is useful here, but its policy is under-specified

Recent merged PRs show meaningful findings, especially around persistence,
async failure paths, local-first loading, test behavior, and architecture:

| PR                                                             | Changed files | CodeRabbit inline comments |
| -------------------------------------------------------------- | ------------: | -------------------------: |
| [#151](https://github.com/alexanderop/workoutTracker/pull/151) |            60 |                          4 |
| [#159](https://github.com/alexanderop/workoutTracker/pull/159) |            21 |                          6 |
| [#161](https://github.com/alexanderop/workoutTracker/pull/161) |            62 |                         20 |
| [#163](https://github.com/alexanderop/workoutTracker/pull/163) |            53 |                          2 |

The 20 comments on PR #161 also show the noise risk of `profile: assertive`.
For example, CodeRabbit applied the discriminated-union convention to a simple
expanded/collapsed boolean. The convention is intended for mutually exclusive
states that can otherwise form invalid combinations, not every boolean. This is
a guideline precision problem, not a need for more analyzers.

Community reports are mixed and anecdotal: reviewers value localized bug
detection and summaries, but often report verbosity, stale comments, latency,
and false positives. This supports measuring signal before turning CodeRabbit
into a blocking reviewer.

### The biggest missing CodeRabbit capability is path-specific guidance

Official guidance recommends narrow `path_instructions` for recurring,
path-specific review requirements. This repository currently has none. Root
guidelines provide broad context, but they do not explain the exact persistence
cascade, browser-test conventions, timer lifecycle risks, or where a rule does
and does not apply.

High-value scopes are:

- `src/db/**`: repository boundary, converter compatibility, old-shape tests,
  transactions, import/export validation, and IndexedDB failure paths.
- `src/features/**`: no cross-feature imports; keep shared state in VueUse
  `createGlobalState`; protect offline and mid-workout latency.
- `src/types/blocks.ts`, block factories, converters, and block UI: require the
  full discriminated-union cascade for new block kinds or persisted fields.
- `**/*.vue`: use `defineModel` for two-way binding; review touch target,
  keyboard, focus, and reactive-work costs. Clarify that ordinary independent
  booleans do not need a state machine.
- `src/__tests__/**`: use Vitest Browser Mode and Page Objects, assert
  user-observable outcomes, reset IndexedDB and singleton global state, and
  avoid Jest/jsdom-only advice.
- timers, wake lock, and PWA code: check cleanup, visibility/background
  transitions, offline behavior, and resumed state.

### Several configuration values should be tightened

1. Add the official YAML schema comment for editor validation.
2. Correct directory filter globs from `!brain/reference/` and
   `!**/__screenshots__/` to `!brain/reference/**` and
   `!**/__screenshots__/**` if excluding those trees is intentional.
   `pnpm-lock.yaml` is already excluded by CodeRabbit's defaults.
3. Trial `profile: chill`. Existing linters cover style, while `assertive` is
   documented as intentionally more verbose and potentially nitpicky.
4. Either enable and customize `high_level_summary` or remove the currently
   ineffective `high_level_summary_in_walkthrough: true` setting. A useful
   summary should call out user impact, persistence/schema impact, offline
   behavior, risky state transitions, and verification evidence.
5. Increase `github-checks.timeout_ms` from 90 seconds to 5–10 minutes. The
   browser-test jobs can run for up to ten minutes, so the current value is
   unlikely to capture final CI results consistently.
6. Give the warning-level title check the actual requirement: Conventional
   Commit format with a scope, such as `feat(workout): add rest timer`.
7. Add `issue_assessment.mode: warning`; linked-issue enrichment alone is not a
   pre-merge assessment.
8. Set `knowledge_base.learnings.scope: local` if this is a private repository
   in an organization with unrelated stacks. The default `auto` can apply
   organization-wide learnings to private repositories.
9. Make data retention an explicit decision. `opt_out: false` retains learnings
   and contextual knowledge. If that is wanted, review stale learnings
   quarterly; if not, opt out with the understanding that deletion is
   irreversible.

### Start custom checks as warnings, not gates

If the CodeRabbit plan supports custom checks, add one deterministic concern per
check:

- **Persisted-shape compatibility**: fail when a changed persisted DB shape has
  no corresponding converter/defaulting change or backward-compatibility test.
- **Workout block cascade**: fail when a new block kind or persisted block field
  omits an affected schema, converter, validation, factory, rendering, or
  persistence-reload path.
- **Behavioral evidence**: warn when user-visible behavior changes without a
  relevant browser-mode test or an explicit explanation in the PR description.

Custom checks cannot install dependencies or run `pnpm test`, so CI must remain
the executable source of truth. Keep `request_changes_workflow: false` until
warning-mode results have demonstrated a low false-positive rate.

### CodeRabbit cannot compensate for these project CI gaps

These should be fixed independently and have higher correctness value than
adding more AI review features:

1. **Coverage thresholds never run in CI.** `vitest.config.ts` defines
   thresholds and `package.json` has `test:coverage`, but CI only runs plain
   sharded Vitest. The Claude review prompt incorrectly says a separate
   coverage job exists.
2. **CI lint mutates instead of only checking.** Both oxlint and ESLint use
   `--fix`; CI does not fail when those commands leave a dirty worktree. A
   fixable lint violation can therefore pass without the fix being committed.
3. **Vitest ESLint rules match no nested tests.** The glob
   `src/**/__tests__/*` does not reach the repository's nested spec files. Use a
   recursive test glob.
4. **Review auto-fix can consume human threads.** A bot review triggers the
   workflow, but its GraphQL gate counts all unresolved threads. The subsequent
   fetch and resolution loop can therefore treat unresolved human feedback as a
   bot work queue.
5. **CI path filters omit CI-affecting configuration.** Changes to oxlint,
   markdownlint, Knip, CodeRabbit, Husky, and workspace/catalog configuration
   can avoid CI entirely.
6. **Copilot instructions conflict with canonical guidance.** They name Pinia,
   reference a missing DB instruction file, and use a compatibility test-helper
   import. Because CodeRabbit also auto-detects Copilot instructions, this stale
   file can contaminate both generation and review context.
7. **Conventional Commits are local-hook-only.** Release automation derives
   versions from commit messages, but no server-side check protects the
   convention when hooks are bypassed.
8. **The declared Node range is broader than CI.** The package supports Node 20
   and 22+, while CI only exercises Node 22. Add a small Node 20 compatibility
   check or narrow the declared engine.

## Recommended Approach

### Phase 1: improve signal and repair deterministic gaps

1. Fix the coverage job, lint check mode, Vitest ESLint glob, human-thread
   filtering, CI path filters, and stale Copilot instructions.
2. Add the schema header, correct path-filter globs, title requirements, local
   learning scope, and a longer GitHub Checks timeout.
3. Add four or five narrow path instructions, starting with DB, features, Vue,
   tests, and timer/PWA behavior.
4. Switch to `profile: chill` for a 10–20 PR trial. Keep review advisory.

### Phase 2: measure and tune

For each sampled PR, record:

- valid-and-fixed comments;
- valid-but-deferred comments;
- false positives;
- duplicates of lint, TypeScript, or CI;
- findings missed by CodeRabbit but found by humans or CI;
- time to first review and total review latency.

Use `@coderabbitai emit path instructions` after several reviews as input, but
review the generated policy before merging it. Audit the Learnings dashboard
quarterly and delete stale or contradictory entries. CodeRabbit now exposes a
source line for each comment; use it to identify which guideline caused noisy
feedback.

### Phase 3: selectively enforce

Add the two persistence/domain custom checks in warning mode. Promote a check
to error only after its criteria are deterministic and its false-positive rate
is acceptably low. Keep human approval and CI as the authoritative merge gates.

## Sources

### Official CodeRabbit sources

- [YAML configuration](https://docs.coderabbit.ai/getting-started/yaml-configuration)
- [Configuration reference](https://docs.coderabbit.ai/reference/configuration)
- [Path-based review instructions](https://docs.coderabbit.ai/configuration/path-instructions)
- [Code guidelines](https://docs.coderabbit.ai/knowledge-base/code-guidelines)
- [Knowledge base overview](https://docs.coderabbit.ai/knowledge-base)
- [Learnings](https://docs.coderabbit.ai/knowledge-base/learnings)
- [Built-in pre-merge checks](https://docs.coderabbit.ai/pr-reviews/pre-merge-checks)
- [Custom checks and limitations](https://docs.coderabbit.ai/pr-reviews/custom-checks)
- [Change Stack announcement](https://www.coderabbit.ai/blog/introducing-change-stack-the-first-ai-native-code-review-interface)
- [Context engineering for AI code review](https://www.coderabbit.ai/blog/context-engineering-ai-code-reviews)
- [Policy as code](https://www.coderabbit.ai/blog/policy-as-code-the-missing-layer-in-ai-assisted-development)

### Community and general evidence

- [CodeRabbit reviews on G2](https://www.g2.com/products/coderabbit/reviews)
- [Developer discussion of CodeRabbit noise and latency](https://www.reddit.com/r/devops/comments/1ojc1b6/tried_coderabbit_for_automated_code_reviews_and/)
- [Open-source developer discussion of CodeRabbit](https://www.reddit.com/r/opensource/comments/1ok0imj/anyone_used_coderabbit_how_is_it/)
- [Industrial study of LLM code-review impact](https://arxiv.org/abs/2412.18531)
