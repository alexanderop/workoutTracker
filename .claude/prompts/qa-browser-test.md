# Pipeline Test — Nav Check (Browser Mode)

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## Mission

Minimal test to verify the QA pipeline works. Open the app and check main navigation loads.

## CRITICAL: How to interact with the browser

`agent-browser` is a **CLI tool** installed on this machine. Run all commands
using the **Bash tool** — do NOT search for MCP tools, Skills, or ToolSearch.
Just call Bash directly with the command.

**The dev server is ALREADY running at {{APP_URL}}** — do NOT try to start it yourself.

See the system prompt for the full command reference.

## Steps (8 turns max)

1. Open the app — run in Bash: `agent-browser open {{APP_URL}}`
2. Enable touch-capable mobile emulation — run in Bash: `agent-browser set device "iPhone 14"`
3. Reload the app — run in Bash: `agent-browser reload`
4. Dismiss onboarding — snapshot, find "Skip" button, click it
5. Take a snapshot — run in Bash: `agent-browser snapshot`
6. Verify the page rendered (snapshot is not empty)
7. Click one navigation link from the snapshot — run in Bash: `agent-browser click @e3` (use refs from snapshot)
8. Take another snapshot to confirm the new page loaded
9. Return your JSON result

## IMPORTANT: Structured Output

Your final response MUST be valid JSON matching the provided schema.

- `verdict`: `HEALTHY` if both pages loaded, `CRITICAL_BUGS` if not
- `summary`: One sentence
- `tests`: Include at least two entries, such as "Open app" and "Navigate to second page", using the schema's fields.
- `bugs`: Empty array if nav works, otherwise describe the issue
- `console_errors`: Empty array
- `metrics`: Set totals to match the tests you performed
