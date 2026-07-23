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

## Interacting with the browser

`agent-browser` is a CLI — call it via the **Bash tool**, not MCP/Skills/ToolSearch. The dev server is already running at {{APP_URL}}. See the system prompt for the command list, known gotchas, and verdict rubric.

The browser is initialized with **iPhone 14 device emulation**. Run all
user-facing verification there unless a criterion explicitly targets desktop
behavior. Reload after switching, then restore `set device "iPhone 14"` and
reload again before continuing.

## Your Mission

This is a deeper QA pass for a pull request. Your job is to:

1. **Verify** every stated acceptance criterion through the UI
2. **Follow** the provided manual scenarios when they are useful
3. **Check** adjacent regressions based on the listed risk areas
4. **Probe** a few high-value edge cases in the default mobile viewport
5. **Report** concrete findings, skips, and confidence limits

## Turn Budget: 100 turns

**NOTE**: Each `agent-browser` command costs 1 turn. A typical test step
(snapshot + action + verify) costs 2-3 turns. You have ~33 logical test steps.

| Phase              | Turns  | Goal                                                   |
| ------------------ | ------ | ------------------------------------------------------ |
| Parse Contract     | 1-5    | Read ACs, QA scope, risks, scenarios                   |
| Verify ACs         | 6-45   | Verify each requirement through the UI                 |
| Regression + Edges | 46-70  | Related flow plus up to 3 mobile-first edge cases      |
| Report             | 71-100 | Write qa-report.md and return JSON                     |

### Mid-run checkpoint (turn 35)

At turn ~35, pause and self-assess:

- Have I verified **at least 50%** of the acceptance criteria?
- If NO: cut the regression + edge-case phase to zero. Go straight to the remaining ACs and keep using the default mobile viewport.
- If YES: proceed with regression + 1-2 targeted edges as planned.

This checkpoint exists because past runs have over-invested in setup (template creation, fixture prep) and reached the hard stop with ACs still unverified.

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
4. Capture evidence while the outcome is on screen:
   `agent-browser screenshot qa-screenshots/ac<N>-<slug>.png` (1 turn, do not read it back)
5. If the criterion is too vague to verify, mark it as skipped and explain why

Also capture a screenshot for every bug you find and for the mobile viewport
check — see "Screenshot evidence" in the system prompt for naming rules.

## Step 3: Regression and edge cases

Pick the most valuable checks after the acceptance criteria pass:

- 1 regression path from the listed risk areas
- Up to 3 targeted edge cases
- Keep user-facing checks in iPhone 14 emulation; add desktop coverage only when the PR contract requires it

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
  - `screenshot` (optional): evidence filename, e.g. `ac1-weight-saved.png`
- `bugs`: Array of bugs found, each with:
  - `title`, `severity`, `description`
  - `steps_to_reproduce`: Numbered steps a developer can follow
  - `expected`: What should have happened
  - `actual`: What actually happened
  - `screenshot` (optional): filename showing the broken state, e.g. `bug-1-nav-overflow.png`
- `console_errors`: Array of JS errors from `agent-browser console`
- `metrics`: Aggregated counts (total_tests, passed, failed, critical/major/minor bugs)

## ALSO: Write qa-report.md as backup.
