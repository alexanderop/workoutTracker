# PR Deep Verification (Browser Mode)

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## PR Under Test

**PR #{{PR_NUMBER}}**: {{PR_TITLE}}

### Summary

{{PR_SUMMARY}}

### User Impact

{{USER_IMPACT}}

### Acceptance Criteria

{{ACCEPTANCE_CRITERIA}}

### QA Scope

{{QA_SCOPE}}

### Risk Areas

{{RISK_AREAS}}

### Manual Test Scenarios

{{MANUAL_TEST_SCENARIOS}}

### PR Contract Status

- Contract valid: {{CONTRACT_VALID}}
- Missing sections: {{MISSING_SECTIONS}}

### Linked Issues

{{LINKED_ISSUES}}

### Full PR Body

{{PR_BODY}}

---

## CRITICAL: How to interact with the browser

`agent-browser` is a **CLI tool** installed on this machine. Run all commands
using the **Bash tool** — do NOT search for MCP tools, Skills, or ToolSearch.
Just call Bash directly with the command.

**The dev server is ALREADY running at {{APP_URL}}** — do NOT try to start it yourself.

See the system prompt for the full command reference. Key commands:

- `agent-browser open {{APP_URL}}` — navigate
- `agent-browser snapshot -i` — get interactive elements with refs
- `agent-browser click @e1` / `agent-browser fill @e2 "text"` — interact by ref
- `agent-browser console` — check for JS errors

## Step 0: Dismiss Onboarding (ALWAYS do this first)

```bash
agent-browser open {{APP_URL}}
agent-browser snapshot -i
# Find and click "Skip to App" or "Skip" button
agent-browser click @eN   # use the ref from snapshot
```

The app shows an onboarding carousel on first visit. In CI there is no saved
state, so this appears every run. Dismiss it before testing anything.

### Known Gotcha: `agent-browser fill` and Vue Reactivity

`agent-browser fill` sets the input value directly, which does NOT always trigger
Vue's reactivity system (v-model / defineModel). This can make buttons appear
stuck or disabled even though the value looks correct in the accessibility tree.

If the UI seems stuck (button disabled, value not updating):

1. **Reload the page** with `agent-browser open {{APP_URL}}/current-page` and retry ONCE
2. If it still fails after reload, record it as a minor tool-sync issue and MOVE ON
3. **Do NOT** spend multiple turns diagnosing browser tool bugs — that is not a product bug

## Your Mission

This is a deeper QA pass for a pull request. Your job is to:

1. **Verify** every stated acceptance criterion through the UI
2. **Follow** the provided manual scenarios when they are useful
3. **Check** adjacent regressions based on the listed risk areas
4. **Probe** a few high-value edge cases, including mobile viewport
5. **Report** concrete findings, skips, and confidence limits

## Turn Budget: 100 turns

**NOTE**: Each `agent-browser` command costs 1 turn. A typical test step
(snapshot + action + verify) costs 2-3 turns. You have ~33 logical test steps.

| Phase              | Turns  | Goal                                                   |
| ------------------ | ------ | ------------------------------------------------------ |
| Parse Contract     | 1-5    | Read ACs, QA scope, risks, scenarios                   |
| Verify ACs         | 6-45   | Verify each requirement through the UI                 |
| Regression + Edges | 46-70  | Related flow plus up to 3 edge cases, including mobile |
| Report             | 71-100 | Write qa-report.md and return JSON                     |

### HARD STOP RULE

**After turn 70, STOP testing immediately and write your report. No exceptions.**

A test run that produces no report is WORTHLESS — worse than a run that tests less
but delivers results. If you reach turn 65 and haven't started the report, wrap up
your current test and move to the Report phase NOW.

The workflow parses your structured JSON output to set commit status and post PR
comments. If you run out of turns without returning JSON, the entire pipeline
reports "QA report not generated" and the run is wasted.

### Efficiency Tips

- Use `snapshot -i` (interactive only) instead of full `snapshot` when possible — it's smaller
- Combine actions: after a click, take a snapshot in the same logical step
- Don't verify values with both `snapshot` AND `eval` — pick one
- Skip testing features unrelated to the PR's changes

## Step 1: Parse the PR contract

Read the structured sections above first.

- If `Acceptance Criteria` is present, treat it as the primary source of truth.
- Use `QA Scope` to stay focused.
- Use `Risk Areas` to choose the most valuable regression checks.
- Use `Manual Test Scenarios` as a shortcut when they are specific and useful.
- If the PR contract is incomplete, explicitly note reduced confidence and fall back to linked issues plus the full PR body.

## Step 2: Verify the acceptance criteria

For EACH acceptance criterion:

1. Navigate to the relevant page
2. Test the exact scenario described
3. Verify the expected visible behavior occurs
4. If the criterion is too vague to verify, mark it as skipped and explain why

## Step 3: Regression and edge cases

Pick the most valuable checks after the acceptance criteria pass:

- 1 regression path from the listed risk areas
- Up to 3 targeted edge cases
- 1 mobile viewport check at 375x667 if the feature is user-facing

| Attack        | How                              |
| ------------- | -------------------------------- |
| Empty         | Submit with nothing filled in    |
| Boundaries    | Try 0, -1, 999999                |
| Long strings  | 100+ characters                  |
| Special chars | Quotes, emoji, angle brackets    |
| Rapid actions | Click submit multiple times fast |

Do NOT try every row. Pick only the highest-signal cases.

## IMPORTANT: Structured Output

Your final response MUST be valid JSON matching the provided schema.

- `verdict`: `HEALTHY`, `MINOR_ISSUES`, or `CRITICAL_BUGS`
- `summary`: 2-3 sentences covering what was tested and key findings
- `tests`: Array of every test you performed, each with:
  - `name`: Short test name (e.g. "Save valid weight entry")
  - `area`: One of `navigation`, `forms`, `core_features`, `mobile`, `accessibility`, `edge_cases`
  - `result`: `pass`, `fail`, or `skip`
  - `details`: What you observed on screen — be specific
- `bugs`: Array of bugs found, each with:
  - `title`, `severity`, `description`
  - `steps_to_reproduce`: Numbered steps a developer can follow
  - `expected`: What should have happened
  - `actual`: What actually happened
- `console_errors`: Array of JS errors from `agent-browser console`
- `metrics`: Aggregated counts (total_tests, passed, failed, critical/major/minor bugs)

## ALSO: Write qa-report.md as backup.
