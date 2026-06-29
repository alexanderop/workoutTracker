---
type: Reference
title: "Benchmark Workout UI Redesign"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/plans/2025-12-14-benchmark-workout-ui-redesign.md
tags: [reference, plans]
timestamp: 2026-06-28T08:10:00Z
---
## Benchmark Workout UI Redesign

**Date**: 2025-12-14
**Status**: Approved
**Goal**: Improve readability, show next exercise, and motivate users to beat their PB

## Problem Statement

The current benchmark workout screen lacks:

1. **Visual hierarchy** - Timer, exercise, and reps don't have clear importance levels
2. **Next exercise visibility** - Users can't see what's coming to prepare mentally
3. **PB motivation** - Split comparisons exist but aren't prominent enough

## Design: "Race Timing Display"

Athletic/competition-inspired design with clear visual zones.

### Full Layout

```
┌─────────────────────────────────────┐
│  🏆 First Attempt - Set Your PB!   │  ← Conditional badge (first attempt only)
├─────────────────────────────────────┤
│   ⏱  0:47                    3/5   │  ← Timer (large) + exercise count
│   ━━━━━━━━━━━━●━━━━━━━━━━━━        │  ← Progress bar (replaces dots)
├─────────────────────────────────────┤
│                                     │
│          BEAR CRAWL                 │  ← Exercise name (uppercase, bold)
│             10                      │  ← Rep count (massive, primary color)
│            reps                     │
│                                     │
│         ▲ -0:08                    │  ← Split comparison (green/red)
│     You're 8 seconds ahead!        │  ← Human-readable context
│                                     │
├─────────────────────────────────────┤
│  NEXT →  Burpees · 15 reps         │  ← Next exercise preview
└─────────────────────────────────────┘
```

### Zone 1: Header (Timer + Progress)

**Components**:

- Timer: Large (text-4xl), monospace font, slight glow for visibility
- Progress bar: Filled bar showing current position (replaces counting dots)
- Exercise count: "3/5" on the right for quick reference
- First attempt badge: Pill above timer area (conditional)

**Rationale**: Progress bar gives immediate spatial awareness without counting dots.

### Zone 2: Exercise (Hero Area)

**Components**:

- Exercise name: UPPERCASE, tracking-wide, bold weight, slightly smaller but more impactful
- Rep count: Massive (text-8xl/9xl), primary color, hero element
- Load: Shown below reps if applicable
- Split comparison (elevated importance):
  - Green arrow up + negative time = ahead of PB
  - Red arrow down + positive time = behind PB
  - Human text: "You're X seconds ahead!" or "Push! X seconds behind"

**First attempt state**: When no PB exists:

```
   🎯 Setting your baseline
   Go all out!
```

### Zone 3: Next Exercise Preview (Footer)

**Components**:

- Fixed at bottom of tappable area
- Muted background (bg-muted/50), smaller text (base/lg)
- Format: "NEXT → Exercise Name · X reps"
- With load: "NEXT → Exercise Name · X reps · Xkg"
- Final exercise: Show "FINAL EXERCISE" or hide preview

**Rationale**: Mental preparation without competing for attention.

### Interaction

- **Tap anywhere** to advance to next exercise
- **Visual hint**: "Tap anywhere to advance" (fades after first tap)
- **Checkmark animation**: Preserved from current implementation

## Files to Modify

1. `src/features/benchmarks/components/BenchmarkForTimeView.vue` - Main layout restructure
2. `src/features/benchmarks/components/BenchmarkExerciseDisplay.vue` - Exercise zone redesign
3. `src/components/ExerciseProgressDots.vue` → Create new `BenchmarkProgressBar.vue`
4. New: `src/features/benchmarks/components/BenchmarkNextExercise.vue` - Next exercise preview
5. Update i18n keys for new text

## Design Decisions

| Decision           | Choice                | Rationale                       |
| ------------------ | --------------------- | ------------------------------- |
| Progress indicator | Bar over dots         | Immediate spatial awareness     |
| Split comparison   | Prominent with text   | Motivation is a core goal       |
| Next exercise      | Subtle footer preview | Mental prep without distraction |
| Visual style       | Athletic/Competition  | User preference                 |
| Exercise name      | UPPERCASE             | Athletic aesthetic              |
