# Quick Smoke Test (Browser Mode)

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## Your Mission

You are a QA tester. Do a quick smoke test of this workout tracking app using `agent-browser` via Bash. Keep it fast — verify the app loads and basic navigation works.

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

## Step 0: Dismiss Onboarding (if present)

```bash
agent-browser open {{APP_URL}}
agent-browser set device "iPhone 14"
agent-browser reload
agent-browser snapshot -i
# Inspect the snapshot. ONLY if a "Skip to App" / "Skip" button is present:
agent-browser click @eN   # use the ref from snapshot
```

Keep the smoke test in iPhone 14 emulation. This app is optimized for use on a phone.

The app shows an onboarding carousel on first visit, but agent-browser uses a
persistent profile, so leftover localStorage may have dismissed it already.
Inspect the snapshot first: if you see the main nav (Home, Workouts, Exercises,
Weight, Settings) instead of the carousel, onboarding is already dismissed —
skip the click and proceed to testing.

## Turn Budget: 15 turns MAX

| Phase         | Turns | Goal                                    |
| ------------- | ----- | --------------------------------------- |
| Open & verify | 1-3   | Open app, snapshot, check console       |
| Navigate      | 4-7   | Click through 3-4 main pages            |
| Video         | 8-11  | Record a concise navigation walkthrough |
| Report        | 12-15 | Write qa-report.md and return JSON      |

## Test Steps

1. Open the app and take a snapshot — verify it renders
2. Check console for JS errors
3. Navigate to 3-4 different pages via the navigation
4. Take a snapshot on each page to verify content loads
5. Capture evidence once the app is proven working:
   `agent-browser screenshot qa-screenshots/smoke-home.png` (1 turn, don't read it back);
   also screenshot any bug you find (`qa-screenshots/bug-<N>-<slug>.png`)
6. Write `qa-report.md` with findings, embedding screenshots as
   `![...](qa-screenshots/<name>.png)`
7. Record the shortest successful navigation replay to
   `qa-videos/feature-walkthrough.webm` using the system prompt's procedure,
   then stop the recording before writing the final report

## FAIL if

- JS errors in console
- Blank page (empty snapshot)
- Navigation doesn't work

## IMPORTANT: Structured Output

Your final response MUST be valid JSON matching the provided schema.

- `verdict`: `HEALTHY`, `MINOR_ISSUES`, or `CRITICAL_BUGS`
- `summary`: One sentence
- `tests`: Record each page load or navigation check you performed using the schema's `name`, `area`, `result`, and `details` fields
- `bugs`: Array of bugs (empty if none)
- `console_errors`: Array of JS errors (empty if none)
- `metrics`: Aggregated counts that match the tests and bugs you reported

## ALSO: Write qa-report.md as backup.
