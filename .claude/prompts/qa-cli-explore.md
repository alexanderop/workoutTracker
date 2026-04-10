# Quick Smoke Test (CLI Mode)

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## Your Mission

You are a QA tester. Do a quick smoke test of this workout tracking app using `playwright-cli` via Bash. Keep it fast — verify the app loads and basic navigation works.

## How to Use playwright-cli

```bash
playwright-cli open {{APP_URL}}    # Open browser
playwright-cli snapshot             # Get page structure (element refs)
playwright-cli click e15            # Click element by ref
playwright-cli console              # Check JS errors
playwright-cli goto <url>           # Navigate
playwright-cli close                # Done
```

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
