# Workout Tracker QA instructions

- This is a local-first, mobile-first workout tracking PWA. There is no
  backend or account; user data lives in IndexedDB.
- Start in iPhone 14 emulation and keep touch behavior enabled. Switch to a
  desktop viewport only for a targeted regression check.
- If onboarding appears, dismiss it through the visible UI. Do not assume it
  appears when persistent browser state already skipped it.
- Prioritize the PR acceptance criteria, then verify one adjacent regression
  path that a gym user would encounter mid-workout.
- For create or edit flows, navigate away and return or refresh to prove the
  saved data round-trips through the UI.
- Treat data loss, a blocked workout flow, broken timers, or a blank screen as
  critical. Minor visual roughness with a clear workaround is minor.
- Never use real personal health data. Synthetic exercise, bodyweight, and
  workout values are sufficient.
