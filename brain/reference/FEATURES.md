---
type: Reference
title: "Workout Tracker - Feature Documentation"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/FEATURES.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Workout Tracker - Feature Documentation

A Vue 3 progressive web app for tracking strength training and CrossFit-style workouts with a block-based programming model.

## What This App Does

Workout Tracker enables athletes to build, execute, and review workouts that combine traditional strength training with CrossFit-style timed intervals. Users create workouts as sequences of "blocks" - each block being either a strength exercise (sets/reps/weight) or a timed workout (EMOM, AMRAP, Tabata, For Time). This hybrid approach supports real-world training where a session might include heavy squats followed by a conditioning finisher.

The app runs as a PWA, working offline and installable on mobile devices for gym-floor use.

---

## 1. Build a Workout

### Start a New Workout

Users begin from the home screen and create a new workout session. The workout starts in "builder mode" where they assemble blocks before starting execution.

### Add Strength Blocks

Search and select from an exercise library (bench press, squat, deadlift, etc.). Each strength block tracks:

- Target sets and reps
- Weight (kg)
- Reps in Reserve (RIR) for autoregulation
- Rest timer between sets

### Add Timed Blocks

Five CrossFit-style workout formats available:

- **AMRAP** (As Many Rounds As Possible): Set duration, add exercises, track completed rounds
- **EMOM** (Every Minute On the Minute): Minute-by-minute timer with exercise rotation
- **Tabata**: 20s work / 10s rest intervals with per-round rep tracking
- **For Time**: Count-up timer with optional time cap, complete prescribed work as fast as possible
- **Cardio**: Continuous cardio block (distance/duration) for runs, rows, bikes, etc.

### Hybrid Workouts

Mix block types freely. Example session: Back Squat 5×5 (strength) → 12-min AMRAP finisher (timed). Blocks appear in a carousel and execute in order.

---

## 2. Execute the Workout

### Start Workout

Transition from builder mode to active mode. The carousel locks to the current block and timers become live.

### Strength Block Execution

- Log each set: weight, reps completed, RIR
- Rest timer starts automatically after logging a set
- Navigate between exercises via swipe carousel
- Screen stays awake during active workout (wake lock)

### Timed Block Execution

Each timer type has a dedicated UI optimized for gym-floor visibility:

- **AMRAP**: Countdown timer with prominent round counter and +1 round button
- **EMOM**: Minute countdown with current exercise highlighted, auto-advances each minute
- **Tabata**: Work/rest phase indicator with color coding (green=work, amber=rest), per-round rep input
- **For Time**: Count-up timer with "Done" button to capture completion time

### During Execution

- Large, glanceable typography for timer displays
- Audio cues for interval transitions (3-2-1 countdown beeps)
- Cancel workout option with confirmation dialog
- Progress persists if app is backgrounded

---

## 3. Review Workout History

### Workout Summary

After completing a workout, users see a summary view showing:

- Total workout duration
- All blocks completed with their results
- Strength blocks: sets logged with weight/reps/RIR
- Timed blocks: rounds completed, times achieved

### Workout History

Browse past workouts chronologically. Each entry shows:

- Date and workout name
- Block composition (what exercises/timed blocks were included)
- Key metrics (total volume, rounds completed, times)

### Redo Workout

Start a new session using a previous workout as a template. Pre-populates all blocks from the original workout, allowing users to repeat training sessions and compare performance over time.

### Data Management

- Export workout data for backup or analysis
- Import data to restore or transfer between devices
- All data stored locally in IndexedDB (no account required)

---

## 4. Manage Templates

### Save as Template

After completing a workout, save it as a reusable template. Templates preserve:

- Block structure and order
- Exercise selections
- Timed block configurations (duration, intervals)
- Default set/rep schemes for strength blocks

### Template Library

Browse saved templates to quickly start familiar workouts. View template details before starting:

- Block composition
- Estimated duration
- Last used date

### Start from Template

Select a template to create a new workout session with all blocks pre-configured. Modify as needed before or during execution - changes don't affect the original template.

### Template Management

- Edit template details (name, configuration)
- Delete templates no longer needed
- Templates stored locally alongside workout history

---

## 5. Platform Features

### Progressive Web App (PWA)

- Install on mobile home screen for native app experience
- Works offline - no internet required at the gym
- Automatic updates when new versions deploy

### Screen Wake Lock

Screen stays awake during active workouts. No more unlocking mid-set to check your timer or log reps.

### Local-First Storage

All data stored locally in browser IndexedDB:

- No account creation required
- No cloud sync (data stays on device)
- Fast, responsive performance
- Export/import for manual backup

### Mobile-Optimized UI

- Touch-friendly controls sized for gym use
- Swipe navigation between blocks
- Large timer displays visible from a distance
- Dark mode support

---

## 6. Benchmarks

Pre-loaded and custom CrossFit-style benchmark workouts (Fran, Cindy, Murph, etc.). Users can:

- Define benchmark workouts with rounds-based exercise structures
- Execute benchmarks and record times/scores
- Track personal bests and attempt history
- Compare split times across attempts

Views: `BenchmarkDetailView.vue`, `CreateBenchmarkView.vue`, `ActiveBenchmarkWorkout.vue`.

---

## 7. Weight Tracking

Log daily bodyweight entries with a chart view. Route: `/weight` → `WeightView.vue`.

---

## 8. Progressions

Structured strength progressions (e.g., kettlebell swing progressions). Track sessions over time with automatic advancement logic. Routes: `/progressions/*` → `ProgressionsView.vue`, `CreateProgressionView.vue`, `ProgressionDetailView.vue`, `ActiveProgressionView.vue`.

---

## 9. Log Past Workout

Record a workout that happened offline or in the past. Supports date/duration picker and the full block builder. Route: `/log-past-workout` → `LogPastWorkoutView.vue`.

---

## 10. Planned Features (Not Yet Implemented)

- **Template Tags**: Filter templates by category (benchmark, hero, custom)
- **Leaderboards**: Social comparison features
- **Video/Movement Guidance**: Exercise demonstration content
- **Audio Customization**: Custom beep sounds and voice cues
- **Rest Between Blocks**: Explicit rest periods in hybrid workouts
