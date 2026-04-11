# PR Verification Testing (Browser Mode)

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## PR Under Test

**PR #{{PR_NUMBER}}**: {{PR_TITLE}}

### Description
{{PR_BODY}}

### Linked Issues
{{LINKED_ISSUES}}

---

## CRITICAL: How to interact with the browser

`agent-browser` is a **CLI tool** installed on this machine. Run all commands
using the **Bash tool** — do NOT search for MCP tools or use ToolSearch.
Just call Bash directly with the command.

**The dev server is ALREADY running at {{APP_URL}}** — do NOT try to start it yourself.
Just open the URL with `agent-browser open {{APP_URL}}` and start testing immediately.

## agent-browser Commands Reference

```bash
agent-browser open {{APP_URL}}       # Open browser and navigate
agent-browser snapshot                # Get accessibility tree with refs (@e1, @e2)
agent-browser snapshot -i             # Interactive elements only
agent-browser click @e15              # Click element by ref (note the @ prefix!)
agent-browser fill @e3 "text"         # Fill input by ref
agent-browser console                 # Check JS console errors
agent-browser get text @e1            # Get text content
agent-browser eval "js expression"    # Run JS in page context
agent-browser close                   # Done
```

**IMPORTANT**: Do NOT use `agent-browser screenshot` — you cannot view image files.
Use `agent-browser snapshot` or `agent-browser snapshot -i` instead. These return
text-based accessibility trees which you CAN read and reason about.

### Known Gotcha: `agent-browser fill` and Vue Reactivity

`agent-browser fill` sets the input value directly, which does NOT always trigger
Vue's reactivity system (v-model / defineModel). This can make buttons appear
stuck or disabled even though the value looks correct in the accessibility tree.

**After every `fill` command**, verify the value actually reached Vue:

```bash
agent-browser fill @e3 "100"
agent-browser eval "document.querySelector('input').value"
```

If the UI seems stuck (button disabled, value not updating):
1. **Reload the page** with `agent-browser open {{APP_URL}}/current-page` and retry ONCE
2. If it still fails after reload, record it as a minor tool-sync issue and MOVE ON
3. **Do NOT** spend multiple turns diagnosing browser tool bugs — that is not a product bug

Similarly, if the accessibility tree shows stale values (e.g. a spinbutton showing
an old number after you filled a new one), reload and re-check once before reporting.

## Your Mission

This PR claims to implement or fix something. Your job is to:
1. **Parse** the PR description and extract testable requirements
2. **Verify** each requirement actually works through the UI
3. **Break** them with edge cases and invalid inputs
4. **Check** for regressions in related features

## Turn Budget: 50 turns

| Phase | Turns | Goal |
|-------|-------|------|
| Parse Requirements | 1-2 | Extract testable items from PR description |
| Happy Path | 3-18 | Verify each requirement works as described |
| Break It | 19-34 | Edge cases, invalid inputs, boundary values |
| Report | 35-50 | Write qa-report.md and return JSON |

### HARD STOP RULE

**After turn 35, STOP testing immediately and write your report. No exceptions.**

A test run that produces no report is WORTHLESS — worse than a run that tests less
but delivers results. If you reach turn 30 and haven't started the report, wrap up
your current test and move to the Report phase NOW.

The workflow parses your structured JSON output to set commit status and post PR
comments. If you run out of turns without returning JSON, the entire pipeline
reports "QA report not generated" and the run is wasted.

## Step 1: Parse Requirements

Read the PR description and linked issues above. Extract specific, testable requirements:
- "User can X" -> Test that user can X
- "Fixes Y bug" -> Verify Y bug no longer occurs
- "Adds Z feature" -> Test all aspects of Z

## Step 2: Happy Path

For EACH requirement:
1. Navigate to the relevant page
2. Test the exact scenario described
3. Verify expected behavior occurs

## Step 3: Break It

Pick the **3 most important** edge cases for the PR's changes. Do NOT exhaustively
test every boundary — focus on what is most likely to break. If you've tested 3 edge
cases and they pass, move on to the Report phase.

| Attack | How |
|--------|-----|
| Empty | Submit with nothing filled in |
| Boundaries | Try 0, -1, 999999 |
| Long strings | 100+ characters |
| Special chars | Quotes, emoji, angle brackets |
| Rapid actions | Click submit multiple times fast |

**Choose at most 3 rows from the table above.** Do NOT try all of them.

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
