# Agent Browser QA Test Plan

Date: 2026-06-21
App URL: http://localhost:5174/
Browser profile: /Users/alexanderopalic/Projects/active/workoutTracker/tmp/qa-agent-browser/profile

## Mission

Act like a QA engineer using the `agent-browser` CLI. Exercise every route-level feature enough to catch blank screens, broken navigation, uncaught runtime errors, unusable primary actions, persistence failures, and obvious mobile-first workflow regressions. Save evidence and findings under `tmp/qa-agent-browser/`.

## Test Order

1. First load and onboarding: fresh profile, app shell, onboarding flow, navigation availability.
2. Home/dashboard: primary shortcuts and empty-state behavior.
3. Exercises: list, create exercise, edit path if possible, exercise progress route.
4. Workout logging: create/start active workout, add strength block, set interaction, finish or exit behavior.
5. History/workouts/detail/summary: verify workout persistence or empty-state if no workout can be saved.
6. Templates: create template, add blocks, detail/start flow.
7. Timers: presets, custom timer fields, start/pause/reset behavior.
8. Weight: add bodyweight entry, stats/history/chart update.
9. Benchmarks: create benchmark, detail/start active benchmark flow.
10. Progressions: create progression, detail/session flow.
11. Log past workout: source/date/duration/builder/save path.
12. Settings: theme/unit/screen/wake-lock/data import-export/danger-zone sections.
13. Cross-checks: console/errors after each cluster, screenshots, `pnpm type-check`, `pnpm lint`, `pnpm test`.

## Pass Criteria

- Route renders meaningful content and primary actions are usable.
- No uncaught JavaScript errors from product code.
- Created local-first data persists after route changes/reload where expected.
- Any confirmed bug is fixed, retested manually, and covered by automated checks when practical.
- Final QA report records test cases, evidence paths, bugs found/fixed, residual risks, and verdict.
