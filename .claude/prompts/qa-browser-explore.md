# Quick Smoke Test (Browser Mode)

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## Your Mission

You are a QA tester. Do a quick smoke test of this workout tracking app using `agent-browser` via Bash. Keep it fast — verify the app loads and basic navigation works.

## How to Use agent-browser

```bash
agent-browser open {{APP_URL}}       # Open browser and navigate
agent-browser snapshot                # Get accessibility tree with refs (@e1, @e2, etc.)
agent-browser snapshot -i             # Interactive elements only (buttons, inputs, links)
agent-browser click @e15              # Click element by ref (note the @ prefix!)
agent-browser fill @e3 "text"         # Clear and fill input by ref
agent-browser screenshot              # Take screenshot
agent-browser console                 # Check JS console errors
agent-browser get text @e1            # Get text content of element
agent-browser get url                 # Get current URL
agent-browser close                   # Done
```

**Important**: Element refs always use the `@` prefix (e.g., `@e1`, `@e2`). Get refs from `snapshot` output.

## Turn Budget: 15 turns MAX

| Phase | Turns | Goal |
|-------|-------|------|
| Open & verify | 1-3 | Open app, snapshot, check console |
| Navigate | 4-8 | Click through 3-4 main pages |
| Report | 9-10 | Write qa-report.md and return JSON |

## Test Steps

1. Open the app and take a snapshot — verify it renders
2. Check console for JS errors
3. Navigate to 3-4 different pages via the navigation
4. Take a snapshot on each page to verify content loads
5. Write `qa-report.md` with findings

## FAIL if

- JS errors in console
- Blank page (empty snapshot)
- Navigation doesn't work

## IMPORTANT: Structured Output

Your final response MUST be valid JSON matching the provided schema.

- `verdict`: `HEALTHY`, `MINOR_ISSUES`, or `CRITICAL_BUGS`
- `summary`: One sentence
- `coverage`: Test counts per area (use 0 for untested areas)
- `bugs`: Array of bugs (empty if none)
- `console_errors`: Array of JS errors (empty if none)
- `metrics`: Aggregated counts

## ALSO: Write qa-report.md as backup.
