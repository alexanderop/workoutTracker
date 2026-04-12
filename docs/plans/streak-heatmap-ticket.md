# [WT-XXX] Add workout streak counter and activity heatmap to Home view

**Type:** Story
**Epic:** Engagement & Retention
**Priority:** Medium
**Created:** 2026-04-12

## Objective

Reward users for their consistency by surfacing a current workout streak and a GitHub-style activity heatmap on the Home screen, so they can see their progress at a glance and feel motivated to keep showing up.

## Background

Today the Home screen helps users start a workout but doesn't reflect the progress they've already made. User research shows consistency is the #1 motivator for our audience, yet the app gives no visual feedback for it. Streaks and heatmaps are a well-understood pattern in fitness and habit apps, and they directly support our retention goal for this quarter.

## Acceptance Criteria

```gherkin
Feature: Workout streak and activity heatmap on the Home screen

  Scenario: User with an active streak sees their streak card
    Given I have completed a workout on each of the last 5 days
    When I open the Home screen
    Then I see a streak card showing "🔥 5 day streak"
    And I see my longest streak displayed beneath it

  Scenario: User sees their longest streak as a personal record
    Given my longest ever streak is 14 days
    And my current streak is 5 days
    When I open the Home screen
    Then the streak card shows "Longest: 14 days"

  Scenario: Today has not broken the streak yet
    Given I have a 5 day streak ending yesterday
    And I have not worked out today yet
    When I open the Home screen
    Then my streak still shows "5 day streak"
    And the streak is not marked as broken

  Scenario: Streak breaks only after a full missed day
    Given I had a 5 day streak ending two days ago
    And I did not work out yesterday
    When I open the Home screen
    Then my current streak shows "0"
    And my longest streak still shows "5 days"

  Scenario: User sees their activity heatmap
    Given I have workout history across the last 6 months
    When I open the Home screen
    Then I see an activity heatmap covering roughly the last 6 months
    And each day is shaded by how much I trained that day
    And a legend shows "Less" to "More" intensity

  Scenario: Heavy and light days look different
    Given I did one workout on Monday and four workouts on Tuesday
    When I look at the heatmap
    Then Tuesday appears visibly darker / more intense than Monday

  Scenario: Tapping a day opens that day's workouts
    Given the heatmap shows a trained day on April 9th
    When I tap the April 9th cell
    Then I am taken to that day's workout(s) in the history view

  Scenario: New user sees an encouraging empty state
    Given I have never completed a workout
    When I open the Home screen
    Then instead of an empty heatmap I see a friendly empty state
    And I see a "Start workout" call to action

  Scenario: Feature works offline
    Given I have no internet connection
    When I open the Home screen
    Then my streak and heatmap still load from my local history

  Scenario: Visuals respect the active theme
    Given the app is in dark mode
    When I open the Home screen
    Then the streak card and heatmap use dark-theme colors
    And switching to light mode updates them accordingly
```

## Design

Compact streak card sits at the top of the home screen so it's the first thing users see. The heatmap lives further down, below the existing action cards and recent workouts, so the primary actions stay above the fold.

### Home view layout (mobile)

```
┌─────────────────────────────────┐
│  ☰  Workout Tracker         ⚙  │
├─────────────────────────────────┤
│                                 │
│  ┌───────────────────────────┐  │
│  │ 🔥  5 day streak          │  │  ← NEW: Streak card
│  │    Longest: 14 days       │  │
│  └───────────────────────────┘  │
│                                 │
│  Mon Tue Wed Thu Fri Sat Sun    │  ← existing week strip
│   ●   ●   ·   ●   ●   ○   ○    │
│                                 │
│  ┌──────┐ ┌──────┐ ┌──────┐    │
│  │Start │ │ Log  │ │Timer │    │  ← existing action cards
│  └──────┘ └──────┘ └──────┘    │
│                                 │
│  Recent workouts                │
│  • Push day          Apr 11    │
│  • Pull day          Apr 09    │
│                                 │
│  Activity                       │  ← NEW: Activity heatmap
│  ┌───────────────────────────┐  │
│  │ ░░▒▒▓▓██▒▒░░▓▓██▒▒░░▒▒▓▓ │  │
│  │ ░▒▒▓▓██░░▒▒▓▓██░░▒▒▓▓██▒ │  │
│  │ ▒▓▓██░░▒▒▓▓██░░▒▒▓▓██░░▒ │  │
│  │ ▓██░░▒▒▓▓██░░▒▒▓▓██░░▒▒▓ │  │
│  │ ██░░▒▒▓▓██░░▒▒▓▓██░░▒▒▓▓ │  │
│  │ ░░▒▒▓▓██░░▒▒▓▓██░░▒▒▓▓██ │  │
│  │ ░▒▒▓▓██░░▒▒▓▓██░░▒▒▓▓██░ │  │
│  │ Less ░ ▒ ▓ █ More         │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

### Heatmap grid (zoomed)

```
        Nov  Dec  Jan  Feb  Mar  Apr
Mon     · · ▒ ▓ · · · ▒ ▓ █ · · ▒ ▓ █ · · ▒ ▓ █ · · ▒ ▓ █ ·
Tue     ▒ · · ▓ █ · ▒ · ▓ · · ▒ ▓ █ · · ▒ ▓ · · ▒ ▓ █ · · ▒
Wed     ▓ ▒ · · ▓ █ · ▒ ▓ · · ▒ ▓ █ · · ▒ ▓ █ · · ▒ ▓ █ · ·
Thu     · ▓ ▒ · · ▓ █ · ▒ ▓ · · ▒ ▓ █ · · ▒ ▓ █ · · ▒ ▓ █ ·
Fri     · · ▓ ▒ · · ▓ █ · ▒ ▓ · · ▒ ▓ █ · · ▒ ▓ █ · · ▒ ▓ █
Sat     · ▒ · ▓ ▒ · · ▓ █ · ▒ ▓ · · ▒ ▓ █ · · ▒ ▓ █ · · ▒ ▓
Sun     ▒ · · ▒ ▓ █ · · ▓ █ · ▒ ▓ · · ▒ ▓ █ · · ▒ ▓ █ · · ▒

Intensity:  ·  = rest day
            ░  = light day     (1 workout)
            ▒  = normal day    (2 workouts)
            ▓  = strong day    (3 workouts)
            █  = heavy day     (4+ workouts)
```

### Empty state

```
┌───────────────────────────────┐
│  Activity                     │
│                               │
│        No workouts yet        │
│                               │
│   Your heatmap will light up  │
│     as you start training.    │
│                               │
│      ┌─────────────────┐      │
│      │  Start workout  │      │
│      └─────────────────┘      │
│                               │
└───────────────────────────────┘
```

### Streak card states

```
Active streak:              First-time / broken streak:
┌────────────────────────┐  ┌────────────────────────┐
│ 🔥  5 day streak       │  │ 💪  Start a new streak │
│    Longest: 14 days    │  │    Longest: 14 days    │
└────────────────────────┘  └────────────────────────┘
```

## Out of Scope

- Push notifications reminding users to keep their streak alive.
- Sharing streaks to social media.
- "Streak freezes" or any kind of paid/earned streak protection.
- Weekly or monthly streak modes (daily only for v1).

## Open Questions

- Should the streak be based on days, or on "workout days per week" (to allow planned rest days)? → Daily for v1, revisit after launch.
- How many months should the heatmap show on small screens? → Designer to confirm; starting point ~6 months.
- What tone should the empty-state copy have? → UX writer to pass.
