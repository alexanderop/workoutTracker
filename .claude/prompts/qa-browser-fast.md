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

## Interacting with the browser

`agent-browser` is a CLI — call it via the **Bash tool**. The dev server is already running at {{APP_URL}}. See the system prompt for the command list, known gotchas, verdict rubric, and the onboarding-dismissal requirement.

## Mission

You are doing a **fast, pragmatic QA pass** for this PR.

First, triage the acceptance criteria: **only UI-verifiable criteria get browser
turns.** Code-level criteria (grep results, TSDoc, type-check/lint/test runs,
internal refactors) are not observable through the UI — mark them `skip` with
reason "not UI-verifiable" immediately, without spending any browser turns.

Priority order:

1. Verify the 3-5 most user-impactful UI-verifiable acceptance criteria
2. Verify one adjacent regression path based on the listed risk areas
3. If budget remains, probe 1 targeted edge case
4. Stop and report

If the PR contract is incomplete, say so clearly and do a best-effort check based
on the available PR summary and linked issue context. Missing sections reduce confidence.

## Turn Budget: 100 turns HARD LIMIT — the run is killed at the limit

Turn economics: every `agent-browser` command is one turn, and most interactions
need a follow-up `snapshot` — so one UI action costs ~2 turns. Budget accordingly.

- **Immediately after your first successful snapshot**, Write `qa-report.md` as a
  skeleton (verdict line, empty AC table with every AC listed, empty sections).
  If the run dies later, this file is what CI falls back on.
- **Update `qa-report.md` after completing each acceptance criterion** — never
  let it fall more than one AC behind what you've tested.
- **At 75 turns spent, STOP testing** no matter what remains, mark untested ACs
  as `skip`, and finalize the report. An incomplete report that exists beats a
  complete report that never got written.
- Do not wander into unrelated exploratory testing.

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
