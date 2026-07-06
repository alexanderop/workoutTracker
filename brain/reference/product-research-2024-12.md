---
type: Reference
title: "Product Research: High-ROI Features for Hybrid Bodybuilding + CrossFit Users"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/product-research-2024-12.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Product Research: High-ROI Features for Hybrid Bodybuilding + CrossFit Users

**Date:** December 2024
**Target Audience:** Users who do both traditional strength training and CrossFit-style workouts

---

## Executive Summary

Based on analysis of the current codebase and competitive research, this document identifies **10 high-value features** that would deliver the best ROI for hybrid athletes.

---

## Current App Strengths (Already Implemented)

The app has a solid foundation:

- ✅ **Block-based workout model** (strength + 5 timed types: AMRAP, EMOM, Tabata, For Time, Cardio — added later)
- ✅ **Timer functionality** with rest timer widget
- ✅ **Exercise library** with custom exercise creation
- ✅ **Template system** for reusable workouts
- ✅ **Set tracking** with kg/reps/RIR
- ✅ **Previous workout display** (shows last performance during active workout)
- ✅ **Data export/import**
- ✅ **Offline-first** (IndexedDB)

---

## HIGH ROI Features to Implement

### 🏆 Tier 1: Highest Impact (Retention Drivers)

#### 1. Progress Charts & Analytics Dashboard

**Complexity:** Medium | **Impact:** Very High

_Why it matters:_ Users who view progress data have **2.3x higher retention**. Progress visualization generates **3x more repeat usage** than social features.

**Implement:**

- Exercise progression graphs (weight over time)
- Volume trends (weekly/monthly)
- Workout frequency calendar/heatmap
- Personal record history timeline

**Current gap:** `DbCompletedWorkout` contains all the data but no visualization layer exists.

---

#### 2. Personal Records (PR) Tracking with Alerts

**Complexity:** Low-Medium | **Impact:** Very High

_Why it matters:_ Push notifications for PRs boost **65% higher 90-day retention**. PRs are the core dopamine loop for strength athletes.

**Implement:**

- Automatic PR detection per exercise (max weight, max reps at weight, max volume)
- PR celebration animation/notification when achieved
- PR history view per exercise
- "PR streak" (days since last PR)

**Current gap:** Set data is tracked but PRs are not calculated or stored.

---

#### 3. 1RM Estimation & Strength Standards

**Complexity:** Low | **Impact:** High

_Why it matters:_ Both bodybuilders and CrossFitters care about their estimated maxes. Provides goal-setting framework.

**Implement:**

- Calculate estimated 1RM using Epley/Brzycki formula from set data
- Show 1RM trend over time per exercise
- Optional: Compare against strength standards (beginner/intermediate/advanced)

---

### 🥈 Tier 2: High Impact (Workflow Improvement)

#### 4. Supersets, Drop Sets, Giant Sets

**Complexity:** Medium | **Impact:** High

_Why it matters:_ Reddit users cite this as a top missing feature in many apps. Hevy's superset support is a key differentiator. Both bodybuilders (drop sets, supersets) and CrossFitters (EMOMs with paired movements) use these.

**Implement:**

- Link exercises into supersets (skip rest timer between linked exercises)
- Drop set indicator (auto-skip rest)
- Giant set support (3+ exercises linked)

**Current gap:** Strength blocks are single-exercise only.

---

#### 5. Warm-up Sets & Working Sets Distinction

**Complexity:** Low | **Impact:** Medium-High

_Why it matters:_ Users consistently request "better support for dedicated warmup routines." Avoids polluting PR calculations with warm-up weights.

**Implement:**

- Mark sets as "warm-up" vs "working"
- Exclude warm-ups from volume/PR calculations
- Optional: Auto-suggest warm-up pyramid based on working weight

---

#### 6. Exercise Notes & Cues

**Complexity:** Low | **Impact:** Medium

_Why it matters:_ Athletes need to remember form cues, grip variations, tempo notes. Currently a `notes` field exists on workouts but no per-exercise notes.

**Implement:**

- Per-exercise notes that persist across workouts
- Show notes during active workout
- Common cue templates (tempo, grip, stance)

---

### 🥉 Tier 3: Differentiators (Hybrid Athlete Focus)

#### 7. Workout Scoring/Benchmarking

**Complexity:** Medium | **Impact:** Medium-High

_Why it matters:_ CrossFitters love benchmark WODs (Fran, Murph, etc.). Comparing times across attempts is core to the sport.

**Implement:**

- Save named benchmarks (user-defined or preset CrossFit WODs)
- Track benchmark history and improvements
- Show % improvement on repeated attempts

---

#### 8. Templates with Timed Block Support ✅ Done

**Complexity:** Low | **Impact:** Medium

_Status update:_ This gap has been closed — `useTemplateBlockManagement.ts` and `CreateTemplateView.vue` now support adding AMRAP, EMOM, Tabata, and ForTime blocks to templates alongside strength blocks.

**Was (historical):**

- Add AMRAP, EMOM, Tabata, ForTime blocks to template creation
- Allow mixed templates (strength + conditioning in one workout)

---

#### 9. RPE (Rate of Perceived Exertion) Tracking

**Complexity:** Low | **Impact:** Medium

_Why it matters:_ Modern training uses RPE for autoregulation. RIR (Reps In Reserve) exists but RPE is more universal.

**Implement:**

- Optional RPE input per set (1-10 scale)
- Track RPE trends for fatigue monitoring
- Flag high-RPE sessions for recovery consideration

---

#### 10. Workout Streaks & Consistency Metrics

**Complexity:** Low | **Impact:** Medium

_Why it matters:_ Gamification increases retention. 68% of users stick with apps when they track progress regularly.

**Implement:**

- Current streak counter
- Weekly/monthly workout count
- Consistency calendar (GitHub-style heatmap)
- Streak notifications/achievements

---

## Feature Priority Matrix

| Feature             | Complexity | Retention Impact | Unique Value    |
| ------------------- | ---------- | ---------------- | --------------- |
| Progress Charts     | Medium     | ⭐⭐⭐⭐⭐       | High            |
| PR Tracking         | Low-Med    | ⭐⭐⭐⭐⭐       | High            |
| 1RM Estimation      | Low        | ⭐⭐⭐⭐         | Medium          |
| Supersets/Drop Sets | Medium     | ⭐⭐⭐⭐         | High            |
| Warm-up Sets        | Low        | ⭐⭐⭐           | Medium          |
| Exercise Notes      | Low        | ⭐⭐⭐           | Low             |
| Benchmark WODs      | Medium     | ⭐⭐⭐⭐         | High (CrossFit) |
| Timed Templates     | Low        | ⭐⭐⭐           | Medium          |
| RPE Tracking        | Low        | ⭐⭐⭐           | Medium          |
| Streaks             | Low        | ⭐⭐⭐⭐         | Low             |

---

## Recommended Implementation Order

### Phase 1 (Quick Wins)

1. PR Tracking + Alerts (low effort, high retention)
2. Warm-up set distinction
3. Workout streaks

### Phase 2 (Core Value)

4. Progress Charts & Analytics Dashboard
5. 1RM Estimation
6. Timed block templates

### Phase 3 (Differentiation)

7. Supersets/Drop Sets
8. Benchmark WOD tracking
9. Exercise notes
10. RPE tracking

---

## What NOT to Build (Low ROI)

Based on research, avoid these common traps:

- ❌ **Social/community features** - 30% boost but massive complexity; users cite "too much noise"
- ❌ **AI workout generation** - Users with this target profile prefer control over their programming
- ❌ **Nutrition tracking** - Better to integrate with MyFitnessPal than rebuild
- ❌ **Video form guides** - Storage/bandwidth intensive, many free resources exist

---

## Competitive Landscape

### Key Competitors

**Strong App**

- Strengths: Clean UI, offline-first, CSV exports, fast logging
- Weaknesses: No social features, no workout programming, limited free tier

**Hevy App**

- Strengths: Free tier, social features, superset/drop set support, cross-device sync
- Weaknesses: Requires internet, cloud-dependent

**Beyond the Whiteboard**

- Strengths: CrossFit-focused, benchmark tracking, gym affiliation support
- Weaknesses: Less suited for pure bodybuilding

**Train Hard (Jason Khalipa)**

- Strengths: Hybrid programs (Force, Flex, EMOM), quality programming
- Weaknesses: iOS only, subscription required

### Differentiation Opportunity

The app can differentiate by excelling at **both** bodybuilding AND CrossFit tracking in one app, which most competitors don't do well.

---

## Key Statistics

- Users viewing progress data: **2.3x higher retention**
- Progress visualization vs social features: **3x more repeat usage**
- PR notifications: **65% higher 90-day retention**
- Users sharing progress: **68% stick with app**
- Fitness app 30-day retention average: **8.48%**
- AI-driven personalization retention boost: **up to 50%**

---

## Sources

- [Garage Gym Reviews - Best CrossFit Apps](https://www.garagegymreviews.com/best-crossfit-apps)
- [Strong vs Hevy Comparison](https://gymgod.app/blog/strong-vs-hevy)
- [Stormotion - Fitness App Retention](https://stormotion.io/blog/fitness-app-features/)
- [Hevy - Workout Set Types](https://www.hevyapp.com/features/workout-set-types/)
- [Best Weightlifting Apps Comparison](https://just12reps.com/best-weightlifting-apps-of-2025-compare-strong-fitbod-hevy-jefit-just12reps/)
- [Ready4S - What Users Hate in Fitness Apps](https://www.ready4s.com/blog/7-things-people-hate-in-fitness-apps)
- [Lucid - Retention Metrics for Fitness Apps](https://www.lucid.now/blog/retention-metrics-for-fitness-apps-industry-insights/)
- [Orangesoft - Fitness App Engagement Strategies](https://orangesoft.co/blog/strategies-to-increase-fitness-app-engagement-and-retention)
