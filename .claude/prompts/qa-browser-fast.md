# PR Fast Verification (Browser Mode)

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

### Fallback Context

{{LINKED_ISSUES}}

---

## CRITICAL: How to interact with the browser

`agent-browser` is a **CLI tool** installed on this machine. Run all commands
using the **Bash tool**. The dev server is already running at {{APP_URL}}.

## Step 0: Dismiss Onboarding

```bash
agent-browser open {{APP_URL}}
agent-browser snapshot -i
agent-browser click @eN
```

Dismiss the onboarding flow before testing anything else.

## Mission

You are doing a **fast, pragmatic QA pass** for this PR.

Priority order:

1. Verify the stated acceptance criteria through the UI
2. Verify one adjacent regression path based on the listed risk areas
3. If time remains, probe 1 targeted edge case
4. Stop and report

If the PR contract is incomplete, say so clearly and do a best-effort check based
on the available PR summary and linked issue context. Missing sections reduce confidence.

## Turn Budget: 45 turns MAX

- Spend most turns on the explicit acceptance criteria.
- Do not wander into unrelated exploratory testing.
- If you have verified the criteria and one regression path, move to the report.

## Test Guidance

- Prefer `snapshot -i` and direct ref-based interaction.
- Verify visible outcomes only; do not assume implementation details.
- If `agent-browser fill` appears out of sync with Vue state, retry once after reload, then record it as a tool-sync limitation and move on.
- Check console once during the run for JS errors.

## Report Requirements

Your final response MUST be valid JSON matching the provided schema.

- `summary` must mention what criteria were verified and whether confidence was reduced by missing PR sections.
- `tests` must list each verification step you performed.
- `bugs` should include only concrete reproducible product issues.
- If you could not verify a criterion because the PR contract was vague, record that as `skip` in `tests` and mention it in `summary`.

Also write `qa-report.md` as a backup.
