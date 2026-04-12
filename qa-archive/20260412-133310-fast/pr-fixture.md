TITLE: feat(onboarding): add Skip to App shortcut on welcome screen

## Summary

- Add a prominent "Skip to App" shortcut on the first onboarding screen so returning or impatient users can jump straight to the workouts view without stepping through every slide.

## User Impact

- Affected users: anyone launching the app for the first time on a new device, and returning users who cleared storage.
- Behavior change: onboarding is no longer a forced multi-step wizard — a single tap dismisses it and lands on the main app.

## Acceptance Criteria

- [x] User can see a "Skip to App" action on the first onboarding screen without scrolling.
- [x] Tapping "Skip to App" dismisses onboarding and lands on the main workouts view.
- [x] The main bottom navigation (Workouts, Templates, Benchmarks, Settings) is reachable immediately after the skip.
- [x] Reloading the page after skipping does not re-show onboarding — the dismissal persists.
- [x] The original step-by-step onboarding flow (if a user chooses it) still works without regressions.

## QA Scope

- Changed flow to verify: onboarding welcome screen → Skip to App → main workouts view.
- One adjacent regression path to verify: after skipping, navigating between main tabs (Workouts ↔ Settings) still works.
- Time budget: 5-8 minutes.

## Risk Areas

- Navigation / routing — skipping must land on the correct default route.
- Persistence / saved state — the "onboarding complete" flag must survive a reload.
- Mobile layout / touch interactions — the Skip button must be tappable on a phone-sized viewport.

## Manual Test Scenarios

1. **Scenario: Skip from fresh install**
   - Given: a fresh browser session with no prior onboarding completion
   - When: the user opens the app and taps "Skip to App" on the welcome screen
   - Then: the main workouts view loads and the bottom navigation is visible

2. **Scenario: Persistence across reload**
   - Given: a user who just tapped "Skip to App"
   - When: the user reloads the page
   - Then: the app opens directly on the main view — onboarding is not shown again

3. **Scenario: Adjacent nav regression**
   - Given: a user on the main workouts view after skipping
   - When: the user taps Settings in the bottom nav, then taps Workouts
   - Then: both routes render without console errors

## CI Checks

- [x] `pnpm type-check`
- [x] `pnpm lint`
- [x] `pnpm test`
