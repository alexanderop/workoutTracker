---
type: Reference
title: "Workout Calendar Feature Design"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/plans/2024-12-14-workout-calendar-design.md
tags: [reference, plans]
timestamp: 2026-06-28T08:10:00Z
---
## Workout Calendar Feature Design

## Overview

Add a week strip to the home screen showing the current week with green dots indicating workout days. Clicking opens a monthly calendar view in a bottom sheet where users can browse their workout history.

## User Requirements

- **Week strip**: Current week only (Mon-Sun), not scrollable
- **Calendar view**: Monthly calendar with month navigation
- **Workout indicators**: Single green dot per day with any workout
- **Day interaction**: Clicking a day shows list of workouts for that day

## Component Architecture

### New Files

```
src/
├── composables/
│   └── useWorkoutCalendar.ts      # Data fetching & calendar state
├── components/
│   ├── WeekStrip.vue              # Week strip for home screen
│   └── WorkoutCalendarSheet.vue   # Calendar dialog with workout list
```

### Dependencies

**New shadcn-vue component**:

```bash
pnpm dlx shadcn-vue@latest add calendar
```

## Design Specifications

### Week Strip (Home Screen)

**Placement**: Between greeting and main action cards

**Visual structure**:

```
┌─────────────────────────────────────────────┐
│  December 2024           Week 50    [→]     │
│                                             │
│  Mon   Tue   Wed   Thu   Fri   Sat   Sun    │
│   9    10    11    12    13    14    15     │
│   ●          ●                 ●            │
└─────────────────────────────────────────────┘
```

**Elements**:

- Header: Month/year + week number + chevron affordance
- Day labels: Abbreviated weekday names
- Day numbers: Date of each day in week
- Green dots (`text-green-500`): Below days with completed workouts
- Today highlight: Subtle ring/background on current day
- Entire component is clickable to open calendar

### Calendar Sheet (Monthly View)

**Trigger**: Click anywhere on week strip

**Component**: `Sheet` (bottom drawer) - better for mobile

**Visual structure**:

```
┌─────────────────────────────────────────────┐
│         ◀   December 2024   ▶               │
│                                             │
│  Mon   Tue   Wed   Thu   Fri   Sat   Sun    │
│                                         1   │
│   2     3     4     5     6     7     8    │
│               ●                             │
│   9    10    11    12    13    14    15    │
│   ●          ●                 ●            │
│  ...                                        │
│─────────────────────────────────────────────│
│  Selected: Wed, Dec 4                       │
│  ┌───────────────────────────────────────┐  │
│  │ 💪 Push Day           32min  12 sets  │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
```

**Elements**:

- Month navigation arrows (prev/next)
- Calendar grid with green dots on workout days
- Today highlight (ring around current date)
- Selected day label
- Workout list for selected day (name, duration, set count)
- Tapping workout navigates to detail view

## Composable API

### `useWorkoutCalendar`

```typescript
type WorkoutDay = {
  date: Date
  hasWorkout: boolean
  workouts: Array<{
    id: string
    name: string
    durationMinutes: string
    setCount: number
  }>
}

function useWorkoutCalendar(): {
  // Current week data (for week strip)
  currentWeek: ComputedRef<Array<WorkoutDay>>
  weekNumber: ComputedRef<number>

  // Selected month data (for calendar dialog)
  selectedMonth: Ref<Date>
  monthDays: ComputedRef<Array<WorkoutDay>>

  // Navigation
  goToPreviousMonth(): void
  goToNextMonth(): void

  // Selection
  selectedDate: Ref<Date | null>
  selectedDayWorkouts: ComputedRef<Array<WorkoutDay['workouts'][number]>>

  // Loading state
  isLoading: Ref<boolean>
}
```

**Data source**: `getWorkoutsRepository().getByDateRange()`

**Caching**: In-memory cache for visited months, cleared on dialog close.

## Integration in TheHomeView.vue

```vue
<template>
  <div class="flex flex-1 flex-col items-center gap-6 p-4">
    <!-- Greeting -->
    <div class="w-full max-w-md text-left">
      <h1 class="text-2xl font-bold">{{ t('nav.homeView.greeting') }}</h1>
    </div>

    <!-- Week Strip + Calendar -->
    <WeekStrip class="w-full max-w-md" />

    <!-- Main action card -->
    <Card ...>
    <!-- Rest of existing content -->
  </div>
</template>
```

## i18n Keys

Add to translation files:

- Weekday abbreviations (Mon, Tue, etc.)
- Month names
- "Week {number}" label
- "No workouts" empty state
- Date formatting for selected day

## Integration Tests

**Test file**: `src/__tests__/integration/workout-calendar.spec.ts`

### Test Cases

| Test Case                        | Description                                                      |
| -------------------------------- | ---------------------------------------------------------------- |
| Week strip displays current week | Shows correct dates Mon-Sun with today highlighted               |
| Green dots show workout days     | Days with completed workouts display indicators                  |
| Opening calendar sheet           | Clicking week strip opens the calendar dialog                    |
| Month navigation                 | Prev/next arrows change displayed month                          |
| Selecting a workout day          | Tapping a day with dot shows workout list                        |
| Navigating to workout detail     | Tapping a workout in list navigates to detail view               |
| Empty state                      | Days without workouts show no dot, selecting shows empty message |

### Test Setup

```typescript
import { createTestApp } from '@/__tests__/helpers/createTestApp'
import { completedWorkoutFactory } from '@/__tests__/factories'
import { getWorkoutsRepository } from '@/db'

describe('Workout Calendar', () => {
  beforeEach(async () => {
    await resetDatabase()
  })

  it('shows green dot on days with completed workouts', async () => {
    // Seed workout completed on specific date
    const workout = completedWorkoutFactory.build({
      completedAt: new Date('2024-12-10').getTime(),
    })
    // Insert into database
    // Mount home view with createTestApp
    // Assert dot visible under Dec 10
  })

  it('opens calendar sheet and shows workouts for selected day', async () => {
    // Seed workouts on specific dates
    // Click week strip to open sheet
    // Assert sheet is visible
    // Click day with workout
    // Assert workout card appears in list
  })

  it('navigates to workout detail when clicking workout in list', async () => {
    // Seed workout
    // Open calendar, select day, click workout card
    // Assert navigation to /history/{workoutId}
  })
})
```

## Implementation Order

1. Install shadcn-vue calendar component
2. Create `useWorkoutCalendar` composable
3. Create `WeekStrip.vue` component
4. Create `WorkoutCalendarSheet.vue` component
5. Integrate into `TheHomeView.vue`
6. Add i18n keys
7. Write integration tests
