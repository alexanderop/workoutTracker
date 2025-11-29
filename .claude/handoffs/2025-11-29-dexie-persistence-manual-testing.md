# Dexie.js Persistence - Manual Testing Checklist

## Overview

Implementation of Dexie.js with IndexedDB for persistent storage is complete. All automated tests, lint, and build pass. This document provides a manual testing checklist to verify the feature works correctly in the browser.

## What Was Implemented

- **Database**: 5 tables (customExercises, workouts, activeWorkout, templates, settings)
- **Auto-save**: Workouts auto-save every 1 second (debounced)
- **Resume Dialog**: Confirmation dialog on app load if unfinished workout exists
- **Custom Exercises**: Now persist to IndexedDB
- **Templates & History**: API ready, UI not yet built

## Key Files Created/Modified

| File | Purpose |
|------|---------|
| `src/db/schema.ts` | Database type definitions |
| `src/db/index.ts` | Dexie database instance |
| `src/db/converters.ts` | DB ↔ memory format conversion |
| `src/db/repositories/*.ts` | Repository pattern for each table |
| `src/composables/useWorkoutPersistence.ts` | Auto-save logic |
| `src/composables/useAppInitialization.ts` | App startup & resume |
| `src/components/ResumeWorkoutDialog.vue` | Resume/discard dialog |
| `src/App.vue` | Integration point |
| `src/stores/exercises.ts` | Now async with DB persistence |

---

## Manual Testing Checklist

### Test 1: Auto-Save Active Workout
- [ ] Navigate to `/active-workout`
- [ ] Add an exercise (e.g., "Bench Press")
- [ ] Enter some set data (kg, reps, rir)
- [ ] **Close the browser tab or refresh the page**
- [ ] **Expected**: Resume dialog should appear

### Test 2: Resume Workout Flow
- [ ] With an active workout saved (from Test 1)
- [ ] Open the app
- [ ] **Expected**: "Resume Workout?" dialog appears with workout name and exercise count
- [ ] Click "Resume Workout"
- [ ] **Expected**: Navigates to `/active-workout` with all data restored (exercises, sets, values)

### Test 3: Discard Workout Flow
- [ ] With an active workout saved
- [ ] Open the app
- [ ] Click "Discard" in the dialog
- [ ] **Expected**: Dialog closes, no workout is restored
- [ ] Refresh the page
- [ ] **Expected**: No resume dialog appears (data was deleted)

### Test 4: Custom Exercise Persistence
- [ ] Navigate to create custom exercise page
- [ ] Create a new custom exercise with all fields filled
- [ ] Refresh the page
- [ ] Navigate to where custom exercises are listed (e.g., add exercise dialog)
- [ ] **Expected**: Custom exercise should still exist

### Test 5: Multiple Set Modifications
- [ ] Start a workout with multiple exercises
- [ ] Complete several sets (marking them done)
- [ ] Modify values on different sets
- [ ] Add and remove sets
- [ ] Refresh the page
- [ ] Resume the workout
- [ ] **Expected**: All set values, completion status, and set count preserved

### Test 6: Empty Workout State
- [ ] Start a workout
- [ ] Add an exercise then remove it (so exercises array is empty)
- [ ] Refresh the page
- [ ] **Expected**: No resume dialog (empty workouts are not saved)

### Test 7: Exercise Selection Persistence
- [ ] Start a workout with 3+ exercises
- [ ] Select the middle exercise (not the first one)
- [ ] Refresh and resume
- [ ] **Expected**: Same exercise should be selected after resume

---

## Browser DevTools Verification

1. Open DevTools → Application → IndexedDB
2. Look for **"WorkoutTrackerDb"** database
3. Verify tables exist:
   - `customExercises`
   - `workouts`
   - `activeWorkout`
   - `templates`
   - `settings`
4. Click on `activeWorkout` table to inspect saved workout data

---

## Known Limitations (Not Yet Implemented)

- **Workout History UI**: API exists (`workoutsRepository.getHistory()`), but `TheWorkoutsView.vue` doesn't display it yet
- **Templates UI**: API exists (`templatesRepository`), but no UI for creating/starting from templates
- **Settings UI**: API exists (`settingsRepository`), but no settings page integration

---

## Debugging Tips

If something doesn't work:

1. Check browser console for errors
2. In DevTools → Application → IndexedDB, verify data is being written
3. Check that `useWorkoutPersistence` is being initialized in `ActiveWorkout.vue`
4. Verify the resume dialog component is rendering (check if `showResumeDialog` computed is true)

## Commands to Run

```bash
# Type check
pnpm type-check

# Lint
pnpm lint

# Unit tests
pnpm test:unit --run

# Dev server
pnpm dev

# Production build
pnpm build
```
