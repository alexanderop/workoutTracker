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
| Happy Path | 3-20 | Verify each requirement works as described |
| Break It | 21-38 | Edge cases, invalid inputs, boundary values |
| Report | 39-50 | Write qa-report.md and return JSON |

**IMPORTANT**: Reserve at least 10 turns at the end for writing the report and
returning your structured JSON response. Do NOT spend all turns on testing.

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

For every input or interactive element the PR touches:

| Attack | How |
|--------|-----|
| Empty | Submit with nothing filled in |
| Boundaries | Try 0, -1, 999999 |
| Long strings | 100+ characters |
| Special chars | Quotes, emoji, angle brackets |
| Rapid actions | Click submit multiple times fast |

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
