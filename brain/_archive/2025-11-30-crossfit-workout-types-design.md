---
type: Reference
title: "CrossFit Workout Types Design"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/plans/2025-11-30-crossfit-workout-types-design.md
tags: [reference, plans]
timestamp: 2026-06-28T08:10:00Z
---
## CrossFit Workout Types Design

**Date:** 2025-11-30
**Status:** Approved
**Author:** Brainstorm session with Alex

## Overview

Extend the workout tracker to support CrossFit-style workouts (EMOM, AMRAP, Tabata, For Time) alongside traditional bodybuilding workouts, enabling hybrid sessions that mix both styles.

## Goals

- Support EMOM, AMRAP, Tabata, and For Time workout types
- Enable hybrid workouts (e.g., strength work + AMRAP finisher)
- Maintain the current bodybuilding experience unchanged
- Provide a unified, adaptive UI that feels cohesive
- Full template system for saving and reusing WODs

## Non-Goals (Deferred)

- Scoring and comparison across workout attempts
- Leaderboards or social features
- Video/movement guidance

---

## Core Concept: Block-Based Architecture

Both bodybuilding and CrossFit workouts are modeled as a **sequence of blocks**. Each block has a type that determines its behavior and UI.

### Block Types

| Type         | Description                             | Metrics Tracked                   |
| ------------ | --------------------------------------- | --------------------------------- |
| **Strength** | Traditional sets × reps (current model) | Weight, reps, RIR per set         |
| **EMOM**     | Every Minute On the Minute              | Completed minutes, missed minutes |
| **AMRAP**    | As Many Rounds As Possible              | Rounds, partial reps, duration    |
| **Tabata**   | 20s work / 10s rest × 8                 | Reps per round                    |
| **For Time** | Complete work ASAP                      | Completion time                   |

### Example Hybrid Workout

1. **Strength Block:** Back Squat 5×5
2. **AMRAP Block (12 min):** 10 KB Swings, 10 Box Jumps, 10 Burpees
3. **Tabata Block:** Air Squats

---

## UI/UX Design

### Design Approach: Unified Adaptive UI

Keep the carousel navigation mental model, but each card can be a strength exercise OR an entire timed block. The timer widget adapts based on active block type.

**Benefits:**

- Consistent navigation across all workout types
- Smooth hybrid workout experience
- Gradual learning curve for users
- Single codebase, not two separate apps

### Adaptive Timer Widget

Position: Top of screen, below workout header. Always visible during timed blocks.

**States by Block Type:**

#### Strength Block (Collapsed)

```
┌─────────────────────────────────────┐
│  Workout: 23:45        [Rest 1:32]  │
└─────────────────────────────────────┘
```

#### EMOM Mode

```
┌─────────────────────────────────────┐
│      MINUTE 3 of 10                 │
│         :47                         │
│  ▸ KB Swings ← current              │
│    Box Jumps                        │
│    Burpees                          │
└─────────────────────────────────────┘
```

#### AMRAP Mode

```
┌─────────────────────────────────────┐
│       8:32 remaining                │
│  ┌─────────────────────────────┐    │
│  │    ROUNDS: 4                │    │
│  │    [  +  ]                  │    │
│  └─────────────────────────────┘    │
└─────────────────────────────────────┘
```

#### Tabata Mode

```
┌─────────────────────────────────────┐
│  ██████████████░░░░  WORK           │
│        :14                          │
│     Round 5 / 8                     │
│  [Reps: 12] [+] [-]                 │
└─────────────────────────────────────┘
```

#### For Time Mode

```
┌─────────────────────────────────────┐
│       05:23 ↑                       │
│  Cap: 12:00                         │
│       [ DONE ]                      │
└─────────────────────────────────────┘
```

**Timer UX Details:**

- Large, glanceable typography (gym-floor visibility)
- Color coding: Work = green, Rest = amber, Final 10s = red pulse
- Haptic feedback at transitions
- Audio cues: 3-2-1 countdown beeps, interval start/end tones

### Block Cards in Carousel

#### Strength Exercise Card (unchanged)

```
┌─────────────────────────────────────┐
│  🏋️ Back Squat                      │
│  Barbell · 8 reps target            │
└─────────────────────────────────────┘
```

#### Timed Block Card (inactive)

```
┌─────────────────────────────────────┐
│  ⏱️ AMRAP · 12 min                  │
│  ─────────────────────────────────  │
│  10 × KB Swings (24kg)              │
│  10 × Box Jumps (24")               │
│  10 × Burpees                       │
│  ─────────────────────────────────  │
│  [ START BLOCK ]                    │
└─────────────────────────────────────┘
```

#### Timed Block Card (active)

```
┌─────────────────────────────────────┐
│  ⏱️ AMRAP · ACTIVE                  │
│  ─────────────────────────────────  │
│  ☑ KB Swings      10                │
│  ☑ Box Jumps      10                │
│  ☐ Burpees        __  ← current     │
│  ─────────────────────────────────  │
│  [+1 ROUND]           Rounds: 3     │
└─────────────────────────────────────┘
```

### Adding Blocks Flow

"Add Exercise" button renamed/expanded to show both options:

```
┌─────────────────────────────────────┐
│  Add to Workout                     │
│  ─────────────────────────────────  │
│                                     │
│  EXERCISES                          │
│  [Search exercises...]              │
│  Recent: Bench Press, Squat...      │
│                                     │
│  ─────────────────────────────────  │
│                                     │
│  TIMED BLOCKS                       │
│  ┌──────┐ ┌──────┐ ┌──────┐        │
│  │ EMOM │ │AMRAP │ │Tabata│        │
│  └──────┘ └──────┘ └──────┘        │
│  ┌──────────┐                       │
│  │ For Time │                       │
│  └──────────┘                       │
└─────────────────────────────────────┘
```

Block configuration sheet for timed blocks:

```
┌─────────────────────────────────────┐
│  Configure AMRAP                    │
│  ─────────────────────────────────  │
│                                     │
│  Duration        [12] minutes       │
│                                     │
│  Exercises:                         │
│  + KB Swings         10 reps        │
│  + Box Jumps         10 reps        │
│  + Add exercise...                  │
│                                     │
│  ─────────────────────────────────  │
│  [ Cancel ]           [ Add Block ] │
└─────────────────────────────────────┘
```

---

## Data Model

### Block Types (Discriminated Union)

```typescript
type WorkoutBlock =
  | { kind: 'strength'; exercise: WorkoutExercise }
  | {
      kind: 'emom'
      config: EmomConfig
      exercises: ReadonlyArray<BlockExercise>
      result: EmomResult | null
    }
  | {
      kind: 'amrap'
      config: AmrapConfig
      exercises: ReadonlyArray<BlockExercise>
      result: AmrapResult | null
    }
  | { kind: 'tabata'; config: TabataConfig; exercise: BlockExercise; result: TabataResult | null }
  | {
      kind: 'fortime'
      config: ForTimeConfig
      exercises: ReadonlyArray<BlockExercise>
      result: ForTimeResult | null
    }
```

### Block Configurations

```typescript
type EmomConfig = {
  minutes: number
  exerciseRotation: 'each-minute' | 'full-round'
}

type AmrapConfig = {
  durationSeconds: number
  timeCap: number | null
}

type TabataConfig = {
  rounds: number
  workSeconds: number
  restSeconds: number
}

type ForTimeConfig = {
  timeCapSeconds: number | null
}
```

### Block Exercise (simplified for timed blocks)

```typescript
type BlockExercise = {
  id: string
  name: string
  prescribedReps: number
  load: string | null // "24kg", "bodyweight", "light band"
  thumbnail: string
}
```

### Block Results

```typescript
type AmrapResult = {
  rounds: number
  partialReps: number
  actualDuration: number
}

type EmomResult = {
  completedMinutes: number
  missedMinutes: ReadonlyArray<number>
}

type TabataResult = {
  repsPerRound: ReadonlyArray<number>
}

type ForTimeResult = {
  completionTime: number
  completed: boolean
}
```

### Updated Workout Structure

```typescript
type Workout = {
  id: string
  name: string
  blocks: ReadonlyArray<WorkoutBlock>
  selectedBlockIndex: number
  startedAt: number
}
```

### Template System

```typescript
type WorkoutTemplate = {
  id: string
  name: string
  blocks: ReadonlyArray<TemplateBlock>
  createdAt: number
  lastUsedAt: number | null
  tags: ReadonlyArray<string> // "benchmark", "hero", "custom"
}

type TemplateBlock =
  | { kind: 'strength'; exerciseId: string; defaultSets: number }
  | { kind: 'emom'; config: EmomConfig; exercises: ReadonlyArray<TemplateBlockExercise> }
  | { kind: 'amrap'; config: AmrapConfig; exercises: ReadonlyArray<TemplateBlockExercise> }
  | { kind: 'tabata'; config: TabataConfig; exercise: TemplateBlockExercise }
  | { kind: 'fortime'; config: ForTimeConfig; exercises: ReadonlyArray<TemplateBlockExercise> }

type TemplateBlockExercise = {
  exerciseId: string | null
  name: string
  prescribedReps: number
  load: string | null
  thumbnail: string
}
```

---

## Implementation Phases

### Phase 1: Foundation (Block Architecture)

- Refactor data model from `exercises[]` to `blocks[]`
- Migrate existing workouts: each exercise becomes `{ kind: 'strength' }` block
- Carousel renders blocks instead of exercises
- No new features, just architectural shift
- Ensures backwards compatibility

### Phase 2: AMRAP Support

- Add AMRAP block type and configuration UI
- Implement AMRAP timer widget mode
- Round counting and completion flow
- Simplest timed block to validate the architecture

### Phase 3: For Time Support

- Count-up timer with optional cap
- Checklist-style exercise completion
- "Done" button captures final time

### Phase 4: EMOM Support

- Minute-by-minute timer with auto-advance
- Exercise rotation display
- More complex timer state machine

### Phase 5: Tabata Support

- Work/rest interval logic
- Per-round rep tracking
- Visual work/rest phase indicators

### Phase 6: Templates & WODs

- Template creation for timed blocks
- Pre-loaded benchmark WODs (Fran, Cindy, Murph, etc.)
- Template browsing and filtering by tags

---

## Key Design Decisions

| Decision                          | Rationale                                                    |
| --------------------------------- | ------------------------------------------------------------ |
| Block-based architecture          | Unifies both workout styles under one model                  |
| Discriminated unions              | Type-safe, explicit structure per block type                 |
| Strength wraps existing exercise  | Zero-migration path for current users                        |
| Results nullable until completion | Clean separation of config vs outcome                        |
| Load as string                    | Flexible for various formats (kg, lbs, bands, bodyweight)    |
| Persistent timer widget           | User requested - allows exercise logging while timer visible |
| Phases 1-6 rollout                | Incremental delivery, validate architecture early            |

---

## Open Questions for Future

1. **Rest between blocks?** Should there be explicit rest periods between blocks in a hybrid workout?
2. **Block reordering?** Can users reorder blocks mid-workout or only during planning?
3. **Partial block completion?** What happens if user quits mid-AMRAP? Save partial result?
4. **Audio customization?** Let users choose beep sounds or use voice cues?
