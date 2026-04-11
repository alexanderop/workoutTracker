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

## Steps (5 turns max)

1. Open the app — run in Bash: `agent-browser open {{APP_URL}}`
2. Dismiss onboarding — snapshot, find "Skip" button, click it
3. Take a snapshot — run in Bash: `agent-browser snapshot`
3. Verify the page rendered (snapshot is not empty)
4. Click one navigation link from the snapshot — run in Bash: `agent-browser click @e3` (use refs from snapshot)
5. Take another snapshot to confirm the new page loaded
6. Return your JSON result

## IMPORTANT: Structured Output

Your final response MUST be valid JSON matching the provided schema.

- `verdict`: `HEALTHY` if both pages loaded, `CRITICAL_BUGS` if not
- `summary`: One sentence
- `coverage`: Set navigation `total`/`passed`/`failed` based on result. Set other areas to 0.
- `bugs`: Empty array if nav works, otherwise describe the issue
- `console_errors`: Empty array
- `metrics`: Match your coverage numbers
