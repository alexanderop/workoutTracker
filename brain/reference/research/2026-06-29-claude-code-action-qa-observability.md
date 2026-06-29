# Research: Claude Code Action QA Observability

**Date:** 2026-06-29
**Status:** Complete

## Problem Statement

The Claude QA browser workflow needs enough live and post-run visibility to debug what the agent did inside GitHub Actions. A stuck, failed, or retried Claude run should show the latest tool activity in the job log and preserve an execution artifact that can explain the run after it finishes.

## Key Findings

- `anthropics/claude-code-action` exposes `execution_file`, `structured_output`, and `session_id` outputs. `execution_file` is the authoritative JSON execution log path for post-run debugging.
- `show_full_output: true` can print all Claude messages and tool results into Actions logs. Anthropic warns this may expose secrets or other sensitive data, so it is useful for temporary debugging but should not be the only routine observability surface.
- `track_progress` updates GitHub comments/checklists for PR and issue events, but it is not a substitute for runner logs when the action hangs or exits before posting a useful report.
- Claude Code supports OpenTelemetry for metrics, logs/events, and beta traces. That is the right direction for organization-wide observability, but for this repo's QA runner the lowest-risk local improvement is a sanitized execution-log summary plus an uploaded raw artifact.
- The Agent SDK/Claude Code docs note that short-lived processes can drop batched telemetry if killed before flushing. For GitHub Actions debugging, job-summary output and uploaded artifacts are more reliable than depending only on external telemetry.

## Codebase Patterns

- `.github/workflows/claude-qa-browser.yml` already runs a warm-up browser check, gates Claude execution when the workflow differs from the default branch, runs the Claude Code Action, retries when no report is generated, posts a sticky QA report, and uploads `qa-debug/`.
- `.github/scripts/tail-claude-execution.mjs` tails the action's execution log during the run and prints sanitized tool-call heartbeats.
- `.github/actions/summarize-claude-run/action.yml` copies the official `execution_file` when available, with fallbacks for observed temp paths.
- `brain/reference/TIL-agent-browser-qa-gotchas.md` already records the need for runner-side progress and the official `execution_file` output.

## Recommended Approach

Keep the workflow on `anthropics/claude-code-action`, but make observability explicit:

1. Use the official `execution_file` output as the first source for summaries and artifacts.
2. Keep sanitized live tailing enabled so long-running runs show current tool activity in Actions logs.
3. Keep the tailer alive through both the main QA action and the retry action so retry-only failures are visible.
4. Render summaries with a parser that tolerates both JSONL and array-style execution logs.
5. Archive raw execution logs under `qa-debug/` for deep inspection, while showing only redacted tool summaries in logs and step summaries.

## Sources

- [Claude Code GitHub Actions](https://code.claude.com/docs/en/github-actions) - Official setup, action behavior, and best practices.
- [anthropics/claude-code-action action.yml](https://github.com/anthropics/claude-code-action/blob/main/action.yml) - Official action inputs and outputs, including `execution_file`, `structured_output`, `session_id`, `track_progress`, and `show_full_output`.
- [Claude Code Base Action](https://github.com/anthropics/claude-code-base-action) - Base action trust model and output reference.
- [Claude Code Monitoring](https://code.claude.com/docs/en/monitoring-usage) - OpenTelemetry configuration, available events, privacy notes, and export intervals.
- [Agent SDK Observability](https://code.claude.com/docs/en/agent-sdk/observability) - How Claude Code emits tool, model, token, and failure telemetry.
