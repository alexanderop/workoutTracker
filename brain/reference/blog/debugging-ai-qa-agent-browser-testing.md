---
type: Reference
title: "Debugging an AI QA Agent That Never Wrote Its Report"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/blog/debugging-ai-qa-agent-browser-testing.md
tags: [reference, blog]
timestamp: 2026-06-28T08:10:00Z
---
## Debugging an AI QA Agent That Never Wrote Its Report

**How I fixed a Claude-powered browser testing pipeline that kept running out of turns**

---

We built something ambitious: a GitHub Actions pipeline where Claude acts as a QA engineer, opens a real browser, and tests our app like a human would. It worked — until it didn't. The agent would test thoroughly, find real bugs, and then... run out of turns before writing the report. Every single time.

This is the story of how we diagnosed and fixed it.

## The Setup

Our workout tracker PWA uses a CI pipeline where Claude (Opus) plays the role of "Quinn," a QA engineer. On every PR with a `qa-browser-verify` label, the pipeline:

1. Starts the dev server
2. Launches a headless browser via `agent-browser`
3. Gives Claude a prompt describing the PR and what to test
4. Claude navigates the app, clicks buttons, fills forms, checks accessibility
5. Claude writes a structured JSON report with verdict, bugs, and test coverage
6. The pipeline posts results as a PR comment

The problem? Step 5 never happened.

## The Symptom

Five consecutive runs on the same PR. Five identical PR comments:

```
QA report not generated. Check workflow logs.
```

The agent had 50 turns and used all 50 — every time — without producing output. The workflow's `STRUCTURED_OUTPUT` was empty. No `qa-report.md` file either.

## The Investigation

Reading the logs told the real story. Here's what the agent did on a typical run testing a simple accessibility PR ("add aria-label to weight save button"):

| Turns | What the agent did                                                                                                                                                                                                                                                                                                                                                   |
| ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1-12  | Dismissed onboarding, navigated to Weight page, saved a weight entry. All good.                                                                                                                                                                                                                                                                                      |
| 13-18 | Tested empty input, zero, negative values. Save button disabled correctly.                                                                                                                                                                                                                                                                                           |
| 19-48 | **Got stuck.** After testing negative values, `agent-browser fill` stopped syncing with Vue's reactivity. The Save button appeared permanently disabled. The agent spent 30 turns doing binary search on weight values (999999, 500, 300, 200, 100, 85...) trying to find "the max limit" — not realizing the problem was a stale reactive state, not a product bug. |
| 49-50 | Finally reloaded the page, fixed the state, was about to write the report...                                                                                                                                                                                                                                                                                         |
| 💀    | `Reached maximum number of turns (50)`                                                                                                                                                                                                                                                                                                                               |

The agent was a diligent QA engineer — too diligent. It went down a rabbit hole diagnosing what turned out to be a browser tool sync issue, not a product bug.

## Root Cause: Three Problems at Once

### 1. `agent-browser fill` doesn't trigger Vue reactivity

The `fill` command sets `input.value` directly via the DOM, bypassing Vue's event system. Vue's `v-model` / `defineModel` listens for `input` events, not property assignments. So the value changes in the DOM but Vue's reactive state doesn't update — buttons stay disabled, validation doesn't re-run.

### 2. 50 turns sounds like a lot, but it isn't

Each `agent-browser` command (snapshot, click, fill, eval) costs one turn. A single test step — take a snapshot, perform an action, verify the result — costs 2-3 turns. With 50 turns, the agent only gets ~17 logical test steps. That's barely enough for happy path testing, let alone edge cases and report writing.

### 3. The prompt said "reserve turns for the report" but didn't enforce it

The original prompt included:

> Reserve at least 10 turns at the end for writing the report and returning your structured JSON response.

The agent read this. The agent understood this. The agent ignored this — because it was more interested in that fascinating disabled-button mystery.

## The Fix: Four Changes

### 1. Give the agent app knowledge

A real QA engineer who's tested this app for months doesn't need to spend turns figuring out navigation or how the onboarding works. We added an "App Map" to the system prompt:

```markdown
## The App: Workout Tracker PWA

You've been testing this app for months. Here's what you know:

### Navigation (bottom bar, always visible)

| Tab    | What it does                                |
| ------ | ------------------------------------------- |
| Home   | Dashboard — start workouts, recent activity |
| Weight | Body weight tracker — log, chart, history   |
| ...    | ...                                         |

### UI Patterns You Know

- **First visit**: Click "Skip to App" to dismiss onboarding
- **Weight range**: 0-500, step 0.5
- **One entry per day**: Saving replaces the existing entry
```

This saved 3-5 turns that previously went to discovering the app structure.

### 2. Warn about the Vue reactivity gotcha

We added a "Known Gotcha" section directly in the task prompt:

```markdown
### Known Gotcha: `agent-browser fill` and Vue Reactivity

`agent-browser fill` sets the input value directly, which does NOT always
trigger Vue's reactivity system. If the UI seems stuck:

1. Reload the page and retry ONCE
2. If it still fails, record it as a tool-sync issue and MOVE ON
3. Do NOT spend multiple turns diagnosing browser tool bugs
```

This directly addresses the rabbit hole that killed previous runs.

### 3. Increase the turn budget

We bumped `max_turns` from 50 to 100. With 2-3 turns per test step, this gives the agent ~33 logical steps — enough for happy path, a few edge cases, and a thorough report.

### 4. Add a hard stop with consequences

Instead of a polite suggestion to "reserve turns," we added a rule with teeth:

```markdown
### HARD STOP RULE

**After turn 70, STOP testing immediately and write your report. No exceptions.**

A test run that produces no report is WORTHLESS — worse than a run that
tests less but delivers results.
```

We also added efficiency tips:

```markdown
- Use `snapshot -i` (interactive only) instead of full `snapshot`
- Don't verify values with both `snapshot` AND `eval` — pick one
- Skip testing features unrelated to the PR's changes
```

## The Result

The next run after all four fixes:

```
Verdict: HEALTHY
Summary: All PR requirements pass — weight logging works end-to-end,
         aria-label "Save weight entry" is correctly applied,
         validation enforces boundaries (0-500).

Tests: 15/15 passed
Bugs found: 1 minor (delete button on weight history entries does not work)
```

A real, structured report. Posted to the PR. Commit status set. The agent even found a legitimate bug we hadn't noticed.

## Lessons Learned

**1. AI agents need domain context, not just instructions.**
Telling the agent "test the weight page" wastes turns if it doesn't know where the weight page is or that it needs to dismiss onboarding first. The more the agent knows upfront, the more turns it spends on actual testing.

**2. Tool-level quirks need tool-level documentation.**
The Vue reactivity issue isn't a bug the agent should investigate — it's a known limitation of the browser automation tool. Documenting it in the prompt prevents the agent from treating it as a product bug.

**3. Token budgets and turn budgets are different beasts.**
With LLM-based agents, "turns" don't map to "logical steps." Each browser interaction is a turn, so a 50-turn budget that looks generous actually gives you very few test steps. Count the real cost.

**4. Soft guidance gets ignored under pressure.**
"Please reserve 10 turns" doesn't work when the agent is deep in a debugging session. A hard stop rule with explicit consequences ("the run is wasted") works better. Even then, 50 turns wasn't enough — we needed headroom for the rule to actually matter.

**5. The agent found a real bug.**
Despite all the pipeline issues, once the agent could actually finish its job, it found a legitimate bug (broken delete button) that we hadn't caught. The investment in getting the pipeline right pays off immediately.

## The Pipeline Today

Our QA pipeline now reliably produces structured reports on every run. The key ingredients:

- **100 turns** with a hard stop at 70 for report writing
- **App context** so the agent doesn't waste turns on discovery
- **Tool gotcha documentation** to prevent rabbit holes
- **Efficiency tips** to make each turn count
- **Structured JSON output** parsed by the workflow for commit status and PR comments

The whole thing costs about $2-3 per run in API credits — cheap insurance for catching bugs before they reach users.

---

_Built with Claude Opus, agent-browser, and GitHub Actions. The full pipeline code is in our [workflow file](../../../.github/workflows/claude-qa-browser.yml) and [QA prompts](../../../.claude/prompts)._
