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

## Turn Budget: 30 turns

| Phase | Turns | Goal |
|-------|-------|------|
| Parse Requirements | 1-2 | Extract testable items from PR description |
| Happy Path | 3-15 | Verify each requirement works as described |
| Break It | 16-24 | Edge cases, invalid inputs, boundary values |
| Report | 25-30 | Write qa-report.md and return JSON |

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
- `summary`: One sentence
- `coverage`: Test counts per area
- `bugs`: Array of bugs found
- `console_errors`: Array of JS errors
- `metrics`: Aggregated counts

## ALSO: Write qa-report.md as backup.
