---
type: Reference
title: "Product Roadmap & Improvement Analysis"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/PRODUCT_ROADMAP.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Product Roadmap & Improvement Analysis

**Date**: December 2024
**Version**: 1.2.0
**Author**: Product Analysis

---

## Executive Summary

This document outlines product improvement opportunities for the Workout Tracker PWA. The app has strong fundamentals (offline-first, CrossFit support, no-paywall model) but lacks engagement mechanics, goal-tracking, and social features that drive retention.

---

## Current Product Strengths

| Strength                  | Description                                             |
| ------------------------- | ------------------------------------------------------- |
| **Offline-First**         | Full PWA with IndexedDB - works without internet        |
| **CrossFit Support**      | Native AMRAP, EMOM, Tabata, For Time protocols          |
| **No Paywall**            | All features free, no subscriptions                     |
| **Flexible Architecture** | Mixed block types (strength + intervals) in one workout |
| **Exercise Library**      | 100+ exercises with custom exercise support             |
| **Progress Tracking**     | PRs, exercise history, estimated 1RM calculations       |
| **Benchmark System**      | Time trials with personal best tracking                 |
| **i18n Ready**            | English and German language support                     |

---

## Improvement Areas

### 1. Onboarding & First-Time Experience

**Problem**: Users land on Home with no guidance on how to start. High likelihood of drop-off before first workout.

**Current State**:

- Empty home screen for new users
- No templates to get started quickly
- No explanation of block types or features

**Proposed Solutions**:

#### 1.1 Welcome Flow

- 3-step onboarding asking:
  - Training experience level (beginner/intermediate/advanced)
  - Primary goal (strength, conditioning, hybrid)
  - Preferred workout types (traditional lifting, CrossFit, bodybuilding)
- Store preferences in settings for personalization

#### 1.2 Starter Templates

- Pre-built templates based on onboarding:
  - **Beginner**: Full Body 3x/week, 5x5 Starting Strength
  - **Intermediate**: Push/Pull/Legs, Upper/Lower
  - **CrossFit**: Hero WODs, Classic benchmarks (Fran, Cindy, Murph)
- "Quick Start" button on empty home state

#### 1.3 Feature Discovery

- Tooltips/coach marks on first workout
- Contextual hints (e.g., "Tap + to add a strength block")
- Feature highlight cards on home for unused features

**User Stories**:

- As a new user, I want to start a workout within 30 seconds so I don't lose motivation
- As a beginner, I want suggested workouts so I don't have to design my own program
- As a user, I want to understand what block types do so I can use the app effectively

---

### 2. Goal Setting & Progress Visualization

**Problem**: No explicit goal-tracking. Users can't set targets or visualize progress toward them.

**Current State**:

- PRs are tracked implicitly
- No goal-setting UI
- No progress visualization beyond exercise history

**Proposed Solutions**:

#### 2.1 Strength Goals

```
Goal: Bench Press 100kg
Current: 85kg (estimated 1RM)
Progress: ████████░░ 85%
Target Date: March 2025
```

#### 2.2 Consistency Goals

- Weekly training frequency targets (e.g., "Train 4x per week")
- Streak tracking with visual counter
- Monthly consistency percentage

#### 2.3 Volume Goals

- Weekly/monthly volume targets per muscle group
- "Hit 10,000kg chest volume this month"

#### 2.4 Body Metrics (Optional)

- ✅ Done — Bodyweight logging with trend chart (`src/features/weight/`: `WeightChart.vue`, `WeightStatsSummary.vue`, `useWeightStats.ts`)
- Measurement tracking (arms, chest, waist) — still not implemented
- Integration point for Apple Health/Google Fit — still not implemented

#### 2.5 Calendar Heat Map

- GitHub-style contribution graph showing training days
- Color intensity based on volume/duration
- Visual motivation for consistency

**User Stories**:

- As a lifter, I want to set a strength goal so I have something concrete to work toward
- As a user, I want to see my training streak so I stay motivated
- As a user, I want a calendar view so I can see my consistency patterns

**Data Model Addition**:

```typescript
interface Goal {
  id: string
  type: 'strength' | 'consistency' | 'volume' | 'body'
  exerciseId?: string // for strength goals
  targetValue: number
  currentValue: number
  unit: string
  targetDate?: Date
  createdAt: Date
  completedAt?: Date
}
```

---

### 3. Workout Suggestions & Recommendations

**Problem**: Users must build every workout from scratch. No intelligent guidance.

**Current State**:

- Templates exist but require manual creation
- No suggestions based on history
- No progressive overload guidance

**Proposed Solutions**:

#### 3.1 "What Should I Train Today?"

Algorithm considering:

- Days since each muscle group was trained
- Recent volume distribution
- Template rotation patterns
- User's stated training frequency

Output: "It's been 4 days since you trained legs. Here are 3 leg-focused templates."

#### 3.2 Progressive Overload Suggestions

During active workout:

```
Last session: 80kg × 8 reps
Suggestions:
  → 82.5kg × 8 (increase weight)
  → 80kg × 9 (increase reps)
  → 80kg × 8 + 1 set (increase volume)
```

#### 3.3 Deload Recommendations

- Track accumulated fatigue (volume × intensity over time)
- Suggest deload week after 4-6 weeks of progression
- "You've been training hard for 5 weeks. Consider a deload."

#### 3.4 Recovery-Based Suggestions

- If RIR trending lower → suggest lighter session
- If missed workouts → suggest lighter return session

**User Stories**:

- As a user, I want workout suggestions so I don't have to think about what to train
- As a lifter, I want progressive overload hints so I know how to progress
- As a user, I want deload reminders so I don't overtrain

---

### 4. Rest & Recovery Intelligence

**Problem**: Rest timer is static. No recovery guidance or fatigue tracking.

**Current State**:

- Single configurable rest timer (default 90s)
- No per-exercise or per-intensity adjustments
- No fatigue indicators

**Proposed Solutions**:

#### 4.1 Adaptive Rest Timers

| Exercise Type              | Intensity            | Suggested Rest |
| -------------------------- | -------------------- | -------------- |
| Compound (squat, deadlift) | Heavy (1-5 reps)     | 3-5 minutes    |
| Compound                   | Moderate (6-10 reps) | 2-3 minutes    |
| Isolation                  | Any                  | 60-90 seconds  |
| Supersets                  | Between pairs        | 60-90 seconds  |

Implementation: Suggest rest time based on exercise + set configuration

#### 4.2 Fatigue Indicators

- Track RIR trends across sessions
- Warning if RIR consistently dropping: "Your RIR has dropped from 3 to 1 over 3 sessions"
- Suggest deload or lighter session

#### 4.3 Rest Day Recommendations

- Based on volume/intensity patterns
- "You've trained 5 days in a row. Consider a rest day."

#### 4.4 Recovery Log (Optional)

Simple daily check-in:

- Sleep quality (1-5)
- Muscle soreness (1-5)
- Energy level (1-5)
- Impacts workout suggestions

**User Stories**:

- As a lifter, I want appropriate rest times so I recover properly between sets
- As a user, I want fatigue warnings so I avoid overtraining
- As a user, I want rest day suggestions so I balance training and recovery

---

### 5. Social & Community Features

**Problem**: App is entirely solo. No sharing, competition, or community.

**Current State**:

- No export/share functionality
- No user accounts
- No social features

**Proposed Solutions**:

#### 5.1 Share Workouts (No Backend Required)

- Export workout summary as image (shareable to Instagram/stories)
- Export template as JSON/link for others to import
- QR code for template sharing

#### 5.2 Benchmark Leaderboards (Future - Requires Backend)

- Opt-in anonymous leaderboards for benchmarks
- Filter by bodyweight class, age, gender
- "Fran: Your time 4:32 - Rank #847 globally"

#### 5.3 Challenges

- 30-day consistency challenges
- Monthly benchmark challenges
- In-app challenge tracking (no backend needed)

#### 5.4 Friend System (Future - Requires Backend)

- Add friends via code/link
- Compare PRs with friends
- Share templates privately
- Activity feed

**User Stories**:

- As a user, I want to share my workout so I can post to social media
- As a CrossFitter, I want to compare my benchmark times to others
- As a user, I want to challenge friends so we motivate each other

**Technical Considerations**:

- Image export can be done client-side with html2canvas
- Template sharing via encoded URL parameters (no backend)
- Leaderboards/friends require backend infrastructure (future phase)

---

### 6. Enhanced Analytics Dashboard

**Problem**: Analytics are per-exercise only. No holistic view of training.

**Current State**:

- Exercise progress page with history and PRs
- No aggregate views
- No muscle group analysis

**Proposed Solutions**:

#### 6.1 Weekly Summary Card (Home Screen)

```
This Week
━━━━━━━━━━━━━━━━━━━━━
Workouts: 4 of 5 planned
Total Volume: 45,230 kg
Time: 4h 32m
PRs: 2 🎉
━━━━━━━━━━━━━━━━━━━━━
```

#### 6.2 Monthly Progress Report

- Total workouts completed
- Volume progression chart
- PRs achieved
- Muscle group distribution
- Consistency percentage
- Top exercises by volume

#### 6.3 Muscle Group Balance

Radar chart showing volume distribution:

- Chest, Back, Shoulders, Arms, Legs, Core
- Highlight imbalances ("Legs are 40% below average")

#### 6.4 Strength Standards Comparison

- Compare lifts to population standards
- Categories: Beginner, Novice, Intermediate, Advanced, Elite
- Adjustable for bodyweight

#### 6.5 1RM Trend Charts

- Line chart of estimated 1RM over time per exercise
- Clear visualization of strength progression

#### 6.6 Volume Trends

- Weekly/monthly volume charts
- By muscle group or total

**User Stories**:

- As a user, I want a weekly summary so I can see my progress at a glance
- As a lifter, I want to see my strength trends so I know if I'm progressing
- As a user, I want muscle balance analysis so I can address weaknesses

---

### 7. Workout Experience Improvements

**Problem**: Active workout flow could be more seamless and feature-rich.

**Current State**:

- Functional workout execution
- Manual set tracking
- Basic timer integration

**Proposed Solutions**:

#### 7.1 Voice Announcements

- Countdown: "3... 2... 1... Go!"
- Interval changes: "10 seconds left"
- Round completion: "Round 5 complete"
- Configurable on/off in settings

#### 7.2 Plate Calculator ✅ Done

Implemented as `BarbellPlateHint.vue` (`src/components/ui/barbell-hint/BarbellPlateHint.vue`), shown inline during weight selection.

Original proposal (for reference):

```
Bar: 20kg
Each side: 20kg + 15kg + 5kg
Total: 100kg
```

#### 7.3 Superset/Circuit Mode

- Explicit superset block type
- Alternating exercise display
- Combined rest timer between supersets
- Clear A1/A2/A3 notation

#### 7.4 Rest Timer Auto-Start

- Configurable per exercise or globally
- Auto-start when set is marked complete
- Option to skip/extend

#### 7.5 Quick Weight Adjustments

- +2.5 / -2.5 buttons for quick adjustments
- Percentage-based adjustments (+5%, -10%)
- "Same as last set" quick fill

#### 7.6 Apple Watch / Wear OS (Future)

- Minimal interface for gym floor
- Current set display
- Quick complete button
- Rest timer
- Requires native app development

**User Stories**:

- As a CrossFitter, I want voice countdowns so I can focus on the workout
- As a lifter, I want a plate calculator so I load the bar correctly
- As a user, I want supersets supported so I can do my actual program

---

### 8. Template & Workout Planning

**Problem**: No way to schedule workouts or follow structured programs.

**Current State**:

- Templates exist but are unscheduled
- No program/periodization support
- No weekly planning

**Proposed Solutions**:

#### 8.1 Weekly Program Planner

```
Monday: Push Day (template)
Tuesday: Pull Day (template)
Wednesday: Rest
Thursday: Legs (template)
Friday: Upper Body (template)
Saturday: CrossFit WOD
Sunday: Rest
```

- Drag-and-drop scheduling
- Recurring weekly schedule
- Shows on home screen: "Today: Push Day"

#### 8.2 Training Programs

Pre-built multi-week programs:

- **5/3/1**: 4-week cycles with prescribed percentages
- **GZCLP**: Linear progression with T1/T2/T3 structure
- **PPL**: 6-day push/pull/legs rotation
- **CrossFit**: Daily WOD rotation

#### 8.3 Mesocycle View

- 4-12 week program view
- Volume/intensity progression visualization
- Deload weeks built-in

#### 8.4 Auto-Increment

- Templates that auto-increase weight each session
- Configurable increment (2.5kg, 5kg, etc.)
- Reset on failure

**User Stories**:

- As a user, I want to schedule my week so I know what to train each day
- As a lifter, I want to follow 5/3/1 so I have structured progression
- As a user, I want auto-progression so weights increase automatically

**Data Model Addition**:

```typescript
interface Program {
  id: string
  name: string
  description: string
  weeks: ProgramWeek[]
  currentWeek: number
  startDate: Date
}

interface ProgramWeek {
  weekNumber: number
  days: ProgramDay[]
  isDeload: boolean
}

interface ProgramDay {
  dayOfWeek: number // 0-6
  templateId: string
  modifications?: WeightModification[]
}
```

---

### 9. Import & Integration

**Problem**: App is isolated from other fitness ecosystems.

**Current State**:

- Local data only
- No import from other apps
- No health app integration

**Proposed Solutions**:

#### 9.1 Apple Health / Google Fit Sync

Export:

- Workouts (duration, calories estimate)
- Strength training sessions

Import:

- Bodyweight
- Sleep data (for recovery features)
- Heart rate during workouts

#### 9.2 Import from Other Apps

Support import from:

- **Strong**: CSV export format
- **Hevy**: JSON export
- **FitNotes**: CSV format
- **JEFIT**: Export format

Capture users switching apps with their history intact.

#### 9.3 Garmin/Fitbit Integration (Future)

- Sync heart rate data
- Import GPS data for cardio
- Recovery metrics

#### 9.4 CSV Import/Export

- Full data export for backup
- Exercise history import
- Template import/export

**User Stories**:

- As a user switching from Strong, I want to import my history so I don't lose data
- As an Apple Watch user, I want workouts in Health so all my fitness data is together
- As a user, I want to export my data so I have a backup

---

### 10. Gamification & Motivation

**Problem**: Limited motivation mechanics. PRs are the only achievement.

**Current State**:

- PR tracking exists
- No celebrations or badges
- No streaks or milestones

**Proposed Solutions**:

#### 10.1 Achievement Badges

Categories:

- **Getting Started**: First workout, first template, first benchmark
- **Consistency**: 7-day streak, 30-day streak, 100 workouts
- **Strength**: First PR, 10 PRs, PR in every major lift
- **Volume**: 10,000kg week, 100,000kg month, 1 million kg lifetime
- **Benchmarks**: Complete Fran, sub-5 Fran, complete all Hero WODs

#### 10.2 Streak Counter

- Prominent display on home screen
- Freeze option (1 per week)
- Milestone celebrations (7, 30, 100, 365 days)

#### 10.3 PR Celebrations

- Confetti animation on new PR
- Sound effect (optional)
- PR notification/badge

#### 10.4 Yearly Wrapped

End-of-year summary:

```
Your 2024 Wrapped
━━━━━━━━━━━━━━━━━━━━━
Total Workouts: 156
Total Volume: 892,340 kg
Total Time: 187 hours
PRs Set: 23
Favorite Exercise: Bench Press
Most Trained Day: Monday
Longest Streak: 34 days
━━━━━━━━━━━━━━━━━━━━━
```

#### 10.5 Milestone Notifications

- "You just hit 100 workouts!"
- "1 million kg lifted lifetime!"
- "1 year since your first workout!"

**User Stories**:

- As a user, I want to see my streak so I'm motivated to maintain it
- As a user, I want PR celebrations so hitting PRs feels rewarding
- As a user, I want badges so I have goals to work toward

---

## Quick Wins (Low Effort, High Value)

| Improvement                        | Effort | Impact | Category     |
| ---------------------------------- | ------ | ------ | ------------ |
| Streak counter on home             | Low    | High   | Gamification |
| PR celebration animation           | Low    | Medium | Gamification |
| Weekly summary card                | Low    | High   | Analytics    |
| Empty state with starter templates | Low    | High   | Onboarding   |
| ~~Plate calculator widget~~ ✅ Done | Medium | High   | Workout UX   |
| Progressive overload hints         | Medium | High   | Suggestions  |
| Share workout as image             | Medium | Medium | Social       |
| Calendar heat map                  | Medium | Medium | Goals        |

---

## Implementation Phases

### Phase 1: Retention (1-2 Sprints)

**Goal**: Keep existing users engaged

- [ ] Streak counter with visual display
- [ ] Weekly summary card on home
- [ ] PR celebration animation
- [ ] Achievement badges (first 5-10)
- [ ] Calendar heat map

**Success Metrics**:

- 7-day retention rate
- Weekly active users
- Session frequency

---

### Phase 2: Onboarding (2-3 Sprints)

**Goal**: Improve new user activation

- [ ] Welcome flow with preferences
- [ ] Pre-built starter templates (10+)
- [ ] Empty state improvements
- [ ] Feature discovery tooltips
- [ ] "What to train today" basic suggestions

**Success Metrics**:

- First workout completion rate
- Time to first workout
- 30-day retention

---

### Phase 3: Guidance (2-3 Sprints)

**Goal**: Help users train smarter

- [ ] Progressive overload suggestions
- [ ] Adaptive rest timer recommendations
- [ ] Deload reminders
- [x] Plate calculator ✅ Done — `BarbellPlateHint.vue`
- [ ] Superset/circuit block type

**Success Metrics**:

- PR frequency
- Workout completion rate
- Feature adoption

---

### Phase 4: Analytics (2-3 Sprints)

**Goal**: Provide training insights

- [ ] Analytics dashboard
- [ ] Muscle group balance chart
- [ ] 1RM trend charts
- [ ] Monthly progress reports
- [ ] Strength standards comparison

**Success Metrics**:

- Analytics page visits
- Time in app
- User satisfaction

---

### Phase 5: Goals (2-3 Sprints)

**Goal**: Enable explicit goal-setting

- [ ] Goal creation UI
- [ ] Strength goal tracking
- [ ] Consistency goal tracking
- [ ] Goal progress visualization
- [ ] Goal completion celebrations

**Success Metrics**:

- Goals created per user
- Goal completion rate
- Retention correlation

---

### Phase 6: Planning (3-4 Sprints)

**Goal**: Support structured programming

- [ ] Weekly program planner
- [ ] Training program templates
- [ ] Auto-increment weights
- [ ] Program progress tracking

**Success Metrics**:

- Program adoption rate
- Long-term retention (90-day)
- Template usage

---

### Phase 7: Social (Future)

**Goal**: Add community features

- [ ] Share workout as image
- [ ] Template sharing via links
- [ ] Backend infrastructure
- [ ] User accounts
- [ ] Benchmark leaderboards
- [ ] Friend system

**Success Metrics**:

- Shares per user
- Viral coefficient
- Social feature adoption

---

### Phase 8: Integrations (Future)

**Goal**: Connect to fitness ecosystem

- [ ] Apple Health export
- [ ] Google Fit export
- [ ] Import from Strong/Hevy
- [ ] CSV export/import
- [ ] Wearable integration

**Success Metrics**:

- Integration usage
- Data import conversions
- Health app connections

---

## Competitive Analysis Notes

### Strong App

- Strengths: Clean UI, Apple Watch, great exercise library
- Weaknesses: Subscription model, limited free tier
- Opportunity: Match features without paywall

### Hevy

- Strengths: Social features, workout sharing
- Weaknesses: CrossFit support is limited
- Opportunity: Our interval support is better

### WODIFY / SugarWOD

- Strengths: CrossFit-specific, gym integration
- Weaknesses: Require gym subscription
- Opportunity: Free CrossFit tracking for individuals

### Our Differentiation

1. **Free forever** - No feature gates
2. **Hybrid support** - Strength + CrossFit in one app
3. **Offline-first** - Works anywhere
4. **Privacy** - No accounts required, local data

---

## Appendix: Data Model Extensions

### Goals

```typescript
interface Goal {
  id: string
  type: 'strength' | 'consistency' | 'volume' | 'body'
  name: string
  exerciseId?: string
  targetValue: number
  currentValue: number
  unit: string
  targetDate?: Date
  createdAt: Date
  completedAt?: Date
  status: 'active' | 'completed' | 'abandoned'
}
```

### Achievements

```typescript
interface Achievement {
  id: string
  type: string
  name: string
  description: string
  icon: string
  unlockedAt?: Date
  progress?: number
  target?: number
}
```

### Programs

```typescript
interface Program {
  id: string
  name: string
  description: string
  weeks: ProgramWeek[]
  currentWeek: number
  currentDay: number
  startDate: Date
  status: 'active' | 'completed' | 'paused'
}

interface ProgramWeek {
  weekNumber: number
  days: ProgramDay[]
  isDeload: boolean
}

interface ProgramDay {
  dayOfWeek: number
  templateId: string
  completed: boolean
  completedWorkoutId?: string
}
```

### User Stats (Aggregate)

```typescript
interface UserStats {
  totalWorkouts: number
  totalVolume: number
  totalDuration: number
  totalPRs: number
  currentStreak: number
  longestStreak: number
  firstWorkoutDate: Date
  lastWorkoutDate: Date
  favoriteExercise: string
  favoriteDayOfWeek: number
}
```

---

## Next Steps

1. **Prioritize**: Review phases and adjust based on team capacity
2. **User Research**: Validate assumptions with user interviews
3. **Design**: Create mockups for Phase 1 features
4. **Technical Spike**: Evaluate analytics storage approach
5. **Roadmap**: Create timeline with milestones

---

_Last updated: December 2024_
