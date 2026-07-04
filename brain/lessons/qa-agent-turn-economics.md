---
type: Lesson
title: QA agent turn economics and crash-safe reports
description: One UI action costs ~2 turns; budget for it and write the report skeleton first so max-turns never eats the report.
resource: brain/lessons/qa-agent-turn-economics.md
tags: [lesson, ci, qa, claude-code-action, agent-browser]
timestamp: 2026-07-04T14:00:00Z
---

## QA Agent Turn Economics and Crash-Safe Reports

Learned 2026-07-04 (PR #151, fixed in PR #153), immediately after fixing the
[claude_args quoting hang](./claude-args-quoting-hang.md): the QA agent then
genuinely drove the browser but hit `Reached maximum number of turns (60)`
before writing `qa-report.md` — and the retry hit its limit (30) the same way.
The action fails the job on max turns, so a run that did 95% of the testing
still reported nothing.

### The math

- Every `agent-browser` command is one Bash tool call = one turn.
- The agent's own gotcha guide (correctly) mandates one action per command and
  a re-snapshot after anything that mutates the DOM → **one UI interaction
  costs ~2 turns**.
- So 60 turns ≈ 30 UI actions. Verifying a 10-AC PR plus onboarding dismissal,
  console checks, and report writing does not fit.
- Observed pace: ~60 turns in ~5.5 minutes, so turn limits bind long before
  step timeouts do. Size `timeout-minutes` at roughly `max_turns / 6` plus
  setup slack.

### The fix pattern (crash-safe reporting)

1. **Report skeleton first.** The prompt now requires writing `qa-report.md`
   as a skeleton (verdict line + full AC table) immediately after the first
   successful snapshot, and updating it after each AC. If the run dies at the
   turn limit, CI's `check-report` fallback still has something real.
2. **Hard stop before the limit.** "At 75 of 100 turns, stop testing, mark the
   rest `skip`, finalize the report." An incomplete report that exists beats a
   complete report that never got written.
3. **Triage ACs before spending turns.** Code-level ACs (grep results, TSDoc,
   type-check/lint/test) are not UI-verifiable — mark them `skip` immediately
   instead of wandering. Cap browser work at the 3-5 most user-impactful ACs.
4. **Keep the stated budget and the real limit consistent.** The prompt said
   "45 turns MAX" while the workflow allowed 60 and the mission implied 100+.
   The model cannot count turns reliably; give one number and enforce it via
   the early-report pattern, not via trust.

### Current settings (claude-qa-browser.yml)

| Mode | max_turns | step timeout |
|------|-----------|--------------|
| fast | 100 | 20 min |
| verify | 60 | 20 min |
| test/explore | 80 | 20 min |
| retry | 40 | 8 min |

### PR contract quality gates QA quality

The QA agent extracts Acceptance Criteria / QA Scope / Risk Areas from the PR
body. Missing sections put the commit status in a degraded "QA limited" mode
and reduce confidence. Fill them in (the `/pr` skill template does) to get
sharper runs.
