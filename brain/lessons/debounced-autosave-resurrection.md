---
type: Lesson
title: Debounced auto-save resurrects deleted drafts after completion
description: A pending debounced save can re-write a draft that a completion transaction just deleted; gate persistence on terminal states instead of relying on delete order.
resource: brain/lessons/debounced-autosave-resurrection.md
tags: [lessons, persistence, dexie, workout, race-condition]
timestamp: 2026-07-07T20:45:00Z
---

## Debounced auto-save resurrects deleted drafts

### The bug (found via agent-browser E2E, fixed 2026-07-07)

Finishing a workout ran this sequence in `ActiveWorkout.vue`:

1. `enterCompletionMode()` sets `workout.value.mode = 'completed'` — a mutation
   on the shared workout ref.
2. `completeWorkout()` writes the workout to history and deletes the
   `activeWorkout` draft **in the same Dexie transaction** — looks safe.
3. ~1s later, `createPersistenceCore`'s `watchDebounced` (triggered by step 1)
   fires and **re-saves the deleted draft**, now with `mode: 'completed'`.

Result: every finished workout left a phantom draft unless the user tapped
"View Details" (whose `resetWorkout()` emptied the ref and re-cleared the
store). Next app start showed a bogus "Resume Workout?" prompt; resuming
would duplicate the workout in history.

### Why it was invisible

- Integration tests completed workouts and asserted on history, not on the
  draft store 1s later (the debounce window).
- The happy path ("View Details") self-healed. Only navigating away from the
  completion screen via bottom nav / app close exposed it.
- `useWorkoutPersistence()` creates a **new persistence core per caller**
  (App.vue via `useAppInitialization`, plus `ActiveWorkout.vue`) — each with
  its own debounced watcher on the same shared ref. Any fix that stops just
  one instance's watcher is insufficient.

### The fix pattern

Gate persistence declaratively on the domain state, not on call order:

- `createPersistenceCore` accepts `shouldPersist?: (domain) => boolean`;
  when false, the debounced auto-save and `saveNow()` skip (empty→clear
  still runs). Covers every core instance and any pending debounce.
- `useWorkoutPersistence` passes `shouldPersist: (w) => w.mode !== 'completed'`.
- `useAppInitialization` treats leftover `mode: 'completed'` drafts (written
  by builds without the gate) as finished: discards them instead of
  prompting resume.

### The general lesson

When a debounced writer and a transactional delete share a store, "delete
inside the transaction" is not enough — the writer's pending timer survives
the transaction. Either gate the writer on a terminal state (chosen here) or
make the deletion also cancel/disable every writer instance. Prefer the
state gate: it is idempotent and covers writers you forgot exist.

`ActiveBenchmarkWorkout.vue` avoids the bug by accident: it calls
`resetBenchmarkWorkout()` synchronously right after completing, so the
debounce lands on an empty ref and clears instead of saving. Don't copy that
pattern as a fix — it races with app close.
