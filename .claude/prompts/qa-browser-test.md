# Pipeline Test — Nav Check (Browser Mode)

**App URL**: {{APP_URL}}
**Date**: {{DATE}}

## Mission

Minimal test to verify the QA pipeline works. Open the app and check main navigation loads.

## Steps (5 turns max)

1. Open the app: `agent-browser open {{APP_URL}}`
2. Take a snapshot: `agent-browser snapshot`
3. Verify the page rendered (snapshot is not empty)
4. Click one navigation link from the snapshot (use `@ref` syntax, e.g. `agent-browser click @e3`)
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
