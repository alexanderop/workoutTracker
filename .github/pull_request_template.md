## Summary

- Briefly describe the behavior change.

## User Impact

- Affected users:
- Behavior change:

## Acceptance Criteria

- [ ] User can ...
- [ ] User can ...
- [ ] Existing flow still ...

## QA Scope

- Changed flow to verify:
- One adjacent regression path to verify:
- Time budget: 5-8 minutes
- Automated test evidence:

## Risk Areas

- Forms / validation
- Navigation / routing
- Persistence / saved state
- Database schema / converter compatibility
- Offline / PWA lifecycle
- Accessibility / keyboard / touch targets
- Mobile layout / touch interactions

Mark non-applicable risks explicitly rather than deleting them.

## Manual Test Scenarios

1. **Scenario:**
   - Given:
   - When:
   - Then:

2. **Scenario:**
   - Given:
   - When:
   - Then:

## Checks

Run locally before pushing — the feature's own tests, not the whole tier:

- [ ] `pnpm type-check`
- [ ] `pnpm lint`
- [ ] `pnpm exec vitest run --project=default src/__tests__/<area>` — scope run:

CI runs the full suite on this PR: the `default` tier sharded four ways, plus
a11y, visual, e2e, coverage, and Lighthouse.
