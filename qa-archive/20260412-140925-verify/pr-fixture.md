TITLE: feat(workout): auto-start rest timer after logged set and resume in-progress workout on reload

## Summary

- After a user completes a set in a strength block, the rest timer automatically starts using the block's configured rest duration — no extra tap required.
- If the user reloads the page (or the PWA is killed) mid-workout, reopening the app drops them back into the same in-progress workout at the same block and set index, with elapsed time preserved.
- A small "Resume" banner appears on the Workouts view when an in-progress workout exists, as an alternative entry point.

## User Impact

- Affected users: anyone logging a strength workout (the most common flow in the app).
- Behavior change: one fewer tap per set (no manual "start rest"), and the phone going to sleep or the tab crashing no longer loses workout state.
- Unaffected: AMRAP/EMOM/Tabata/ForTime/cardio blocks — their timer behavior is unchanged.

## Acceptance Criteria

- [x] Starting a workout from an existing template lands the user on a block view with at least one strength block and logged-set inputs visible.
- [x] After tapping "Log set" (or the equivalent confirm control) on a strength set, a rest countdown becomes visible and is actively counting down — the user does not need to tap a separate "start rest" button.
- [x] The rest duration used matches the strength block's configured rest seconds (not a hardcoded default). Verify by configuring a non-default rest (e.g. 17s or 23s) on the block and observing the initial countdown value.
- [x] Reloading the browser mid-workout (after at least one set has been logged) returns the user to the same workout, same block, same set index, with previously logged sets still present.
- [x] The Workouts view shows a "Resume" affordance whenever an in-progress workout exists, and tapping it opens that workout (not a new one).
- [x] Finishing the workout clears the "Resume" affordance — the Workouts view no longer advertises an in-progress workout.
- [x] No regressions to AMRAP blocks: starting an AMRAP block still shows its own timer UI and does not auto-trigger a strength-style rest countdown.

## QA Scope

- Primary flow: fresh storage → create/use template with a strength block (configure rest to a distinctive value) → start workout → log a set → observe auto rest → reload → resume → finish → verify Resume affordance gone.
- Adjacent regression: create or start a workout containing an AMRAP block and confirm its timer still behaves normally (no strength-rest countdown injected).
- Out of scope: visual polish, exact animation timing, sound/vibration.
- Time budget: 10-15 minutes.

## Risk Areas

- **Persistence layer (Dexie)**: the in-progress workout must be written on every set log, not only on finish. A converter/schema regression could corrupt resume.
- **Timer coupling**: auto-starting the rest timer must not leak across block types (AMRAP/EMOM must not inherit strength behavior).
- **Route guards**: the "Resume" banner navigation must target the existing workout id, not create a duplicate.
- **Wake lock / visibility**: returning to the tab after a reload should not double-start the rest timer.
- **State singletons**: `createGlobalState()` stores can cross-contaminate across tests if not reset on workout finish.

## Manual Test Scenarios

1. **Scenario: Auto-rest uses block-configured duration**
   - Given: a template containing a strength block with rest configured to a distinctive value (e.g. 17 seconds)
   - When: the user starts a workout from that template and logs the first set
   - Then: a rest countdown appears and its initial visible value is the configured duration (17s), counting down

2. **Scenario: Reload mid-workout resumes state**
   - Given: a user has logged at least one set in an in-progress strength workout
   - When: the user reloads the browser tab
   - Then: the app returns to the same workout, the same block is active, and the previously logged set is still shown as logged

3. **Scenario: Resume banner on Workouts view**
   - Given: an in-progress workout exists (created in scenario 2)
   - When: the user navigates to the Workouts view
   - Then: a "Resume" affordance is visible, and tapping it reopens the same workout (same id/title, not a new blank one)

4. **Scenario: Finishing clears Resume**
   - Given: the resumed in-progress workout from scenario 3
   - When: the user finishes/completes the workout
   - Then: navigating back to the Workouts view shows no "Resume" affordance

5. **Scenario: AMRAP regression**
   - Given: a workout containing an AMRAP block
   - When: the user starts that block
   - Then: the AMRAP timer UI renders and no strength-style rest countdown is injected between reps

## CI Checks

- [x] `pnpm type-check`
- [x] `pnpm lint`
- [x] `pnpm test`
