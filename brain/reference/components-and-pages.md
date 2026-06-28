---
type: Reference
title: "Workout Tracker - Complete Component & Page Reference"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/components-and-pages.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Workout Tracker - Complete Component & Page Reference

> **Comprehensive visual documentation of all pages, components, and composables in the Workout Tracker application.**

---

## Table of Contents

1. [Views (11 Pages)](#views)
2. [Feature Components (5 Features)](#feature-components)
3. [Shared Components (15 Components)](#shared-components)
4. [Composables (15 Core)](#composables)
5. [Visual Flow Diagrams](#visual-flow-diagrams)
6. [Timed Block UI Deep Dive](#timed-block-ui-deep-dive)

---

## Views

### 1. TheHomeView.vue

**Route:** `/` (RouteNames.Home)
**Purpose:** Landing page providing quick access to start workouts and timers
**File:** `src/views/TheHomeView.vue`

```
┌─────────────────────────────────────────┐
│  [←] Home                               │
├─────────────────────────────────────────┤
│                                         │
│   ┌───────────────────────────────┐    │
│   │  🏋️  Start Workout            │    │
│   │                               │    │
│   │  Begin a new workout session  │    │
│   │                          →    │    │
│   └───────────────────────────────┘    │
│                                         │
│   ┌───────────────────────────────┐    │
│   │  ⏱️  Quick Timer               │    │
│   │                               │    │
│   │  Access standalone timers     │    │
│   │                          →    │    │
│   └───────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘
```

**Component Tree:**

- Card (shadcn-vue)
  - CardHeader
    - CardTitle
    - CardDescription
  - CardContent
- Button (shadcn-vue)
- Icons: ArrowRight, Play, Timer (lucide-vue-next)

**Key Features:**

- Two prominent action cards with hover effects
- Direct navigation to workout builder and timers
- Animated transitions on card interactions

**User Flow:**

- **In:** Default landing page, back from other views
- **Out:** → ActiveWorkout (builder mode), → TheTimersView

---

### 2. TheExercisesView.vue

**Route:** `/exercises` (RouteNames.Exercises)
**Purpose:** Browse and search exercise library with muscle group filtering
**File:** `src/views/TheExercisesView.vue`

```
┌─────────────────────────────────────────┐
│  [←] Exercises                          │
├─────────────────────────────────────────┤
│  ┌─────────────────────────────────┐    │
│  │ 🔍 Search exercises...      [x] │    │ ← Sticky search
│  └─────────────────────────────────┘    │
│                                         │
│  ○ All  ○ Chest  ○ Back  ○ Legs  ...   │ ← Muscle filters
│  ════════════════════════════════════   │
│                                         │
│  │ Squat                          →│    │
│  │ Back Squat                     →│    │
│  │ Bench Press                    →│    │
│  │ Deadlift                       →│    │
│  │ ...                             │    │
│                                         │
│                    [+ Create Custom]     │ ← Floating button
└─────────────────────────────────────────┘
```

**Component Tree:**

- PageLayout (wrapper)
- Input (shadcn-vue) - Search bar
- Button (shadcn-vue) - Filter pills, create button
- ExerciseListItem (custom) - Each exercise row
- Icons: Plus, Search, X (lucide-vue-next)

**Composables Used:**

- `useExerciseSearch` - Search and filtering logic

**Key Features:**

- Real-time search with debouncing
- Horizontal scrolling muscle group filters
- Empty state with helpful message
- Floating "Create Custom Exercise" button

**User Flow:**

- **In:** Bottom nav, workout builder exercise picker
- **Out:** → CreateCustomExercise

---

### 3. TheWorkoutsView.vue

**Route:** `/workouts` (RouteNames.Workouts)
**Purpose:** Manage workout templates and view workout history
**File:** `src/views/TheWorkoutsView.vue`

```
┌─────────────────────────────────────────┐
│  [←] Workouts           [+ Create]      │
├─────────────────────────────────────────┤
│                                         │
│  [ Templates ]  [ History ]             │ ← Tabs
│  ══════════════                         │
│                                         │
│  ┌───────────────────────────────┐      │
│  │ Upper Body Strength           │      │
│  │ 3 blocks • Last used: 2d ago  │  →  │
│  └───────────────────────────────┘      │
│                                         │
│  ┌───────────────────────────────┐      │
│  │ Leg Day                       │      │
│  │ 2 blocks • Last used: 1w ago  │  →  │
│  └───────────────────────────────┘      │
│                                         │
│  ┌───────────────────────────────┐      │
│  │ (Empty State)                 │      │
│  │ No templates yet              │      │
│  └───────────────────────────────┘      │
│                                         │
└─────────────────────────────────────────┘
```

**Component Tree:**

- PageLayout (wrapper)
- Tabs (shadcn-vue)
  - TabsList
    - TabsTrigger × 2
  - TabsContent × 2
- TemplateListCard (custom) - Template cards
- WorkoutHistoryCard (custom) - History cards
- Empty (shadcn-vue) - Empty states
- Button (shadcn-vue) - Create button

**Composables Used:**

- `useWorkoutsList` - Load templates and history

**Key Features:**

- Tabbed interface (Templates / History)
- Template cards show block count and last used
- History cards show completion date and duration
- Empty states for each tab
- Loading states during data fetch

**User Flow:**

- **In:** Bottom nav
- **Out:** → CreateTemplateView, → TemplateDetailView, → WorkoutDetailView

---

### 4. TheTimersView.vue

**Route:** `/timers` (RouteNames.Timers)
**Purpose:** Standalone timer tool for CrossFit-style workouts
**File:** `src/views/TheTimersView.vue`

```
┌─────────────────────────────────────────┐
│  [←] Timers                             │
├─────────────────────────────────────────┤
│                                         │
│  Select Timer Type                      │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │   AMRAP     │  │    EMOM     │      │
│  │             │  │             │      │
│  │  As Many    │  │  Every Min  │      │
│  │  Rounds...  │  │  On Min...  │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
│  ┌─────────────┐  ┌─────────────┐      │
│  │   TABATA    │  │  FOR TIME   │      │
│  │             │  │             │      │
│  │  20s / 10s  │  │  Complete   │      │
│  │  Intervals  │  │  For Time   │      │
│  └─────────────┘  └─────────────┘      │
│                                         │
└─────────────────────────────────────────┘
```

**Component Tree:**

- PageLayout (wrapper)
- TimerPresetSelector (custom) - Grid selector
- StandaloneTimerRunner (custom) - Timer execution

**State Machine:**

- `select` → User picks timer type
- `configure` → User sets duration/rounds
- `running` → Timer actively counting

**Key Features:**

- 2×2 grid layout with color-coded timer types
- Each timer type has unique color from BLOCK_COLORS
- State transitions: select → configure → running
- Independent from workout system

**User Flow:**

- **In:** Home quick action, bottom nav
- **Out:** Back to home or previous view

---

### 5. TheSettingsView.vue

**Route:** `/settings` (RouteNames.Settings)
**Purpose:** Configure app preferences, appearance, units, and data management
**File:** `src/views/TheSettingsView.vue`

```
┌─────────────────────────────────────────┐
│  [←] Settings                           │
├─────────────────────────────────────────┤
│                                         │
│  UNITS                                  │
│  ─────────────────────────────────      │
│  Weight:    [ kg ]  [ lbs ]             │
│  Height:    [ cm ]  [ ft/in ]           │
│                                         │
│  APPEARANCE                             │
│  ─────────────────────────────────      │
│  Dark mode:                    [●]      │ ← Toggle
│  Language:   English            ▾       │ ← Select
│                                         │
│  SCREEN                                 │
│  ─────────────────────────────────      │
│  Keep screen on:               [●]      │
│  Timer sounds:                 [○]      │
│  ▾ Advanced diagnostics                 │
│                                         │
│  DATA                                   │
│  ─────────────────────────────────      │
│  [Export Data]  [Import Data]           │
│                                         │
│  DANGER ZONE                            │
│  ─────────────────────────────────      │
│  [Delete All Data]                      │
│                                         │
└─────────────────────────────────────────┘
```

**Component Tree:**

- PageLayout (wrapper)
- ToggleGroup (shadcn-vue) - Unit selectors
  - ToggleGroupItem × 2
- Switch (shadcn-vue) - Dark mode, wake lock, sounds
- Select (shadcn-vue) - Language dropdown
- Separator (shadcn-vue) - Section dividers
- Collapsible (shadcn-vue) - Wake lock diagnostics
- Button (shadcn-vue) - Export, import, delete
- SettingsDeleteAllDataDialog (custom)
- SettingsImportDataDialog (custom)
- SettingsWakeLockDiagnostics (custom)
- ErrorDialog (custom)
- Icons: Scale, Ruler, Moon, Smartphone, Download, Upload, Trash2, Globe, Volume2

**Composables Used:**

- `useTheme` - Dark mode management
- `useSettingsStore` - Persist settings

**Utils Used:**

- `exportAllData`, `importAllData`, `deleteAllData`
- `parseExportFile`

**Key Features:**

- Unit conversions (kg/lbs, cm/ft-in) with immediate effect
- Dark mode toggle with system preference detection
- Multi-language support (en, de)
- Wake lock with diagnostics panel
- Data export/import as JSON
- Dangerous operations require confirmation
- Responsive layout (flex-col → flex-row on desktop)

**User Flow:**

- **In:** Bottom nav
- **Out:** None (settings dialog-based interactions)

---

### 6. ActiveWorkout.vue

**Route:** `/workout/active` (RouteNames.ActiveWorkout)
**Purpose:** Main workout execution view with builder and active modes
**File:** `src/views/ActiveWorkout.vue`

```
┌─────────────────────────────────────────┐
│  [←] Workout Builder    [Queue] [End]   │ ← BUILDER MODE
├─────────────────────────────────────────┤
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Block 1: Squats                 │    │
│  │ 3 sets × 5 reps                 │    │
│  │                          [Edit] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Block 2: AMRAP (10 min)         │    │
│  │ Push-ups, Sit-ups               │    │
│  │                          [Edit] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [+ Add Block]                          │
│                                         │
│            [Start Workout]               │ ← Starts active mode
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  [←] SQUATS             [Skip] [End]    │ ← ACTIVE MODE
│      Block 1 of 2                       │
├─────────────────────────────────────────┤
│                                         │
│  Set  kg    Reps   RIR                  │
│  ──────────────────────────────         │
│  1    100    8      2    ✓              │
│  2    100    7      2    ✓              │
│  3    [__]  [__]   [__]                 │ ← Active set
│                                         │
│                                         │
│  Previous: 100kg × 8, 8, 7              │
│                                         │
│                                         │
│  ┌─────────────────────────────────┐    │
│  │ Rest Timer: 01:23               │    │ ← After set complete
│  └─────────────────────────────────┘    │
│                                         │
│  [◄ Prev]      [Complete Set]   [Next ►]│
└─────────────────────────────────────────┘
```

**Component Tree (Builder Mode):**

- PageLayout (wrapper)
- WorkoutBuilderMode (custom)
  - WorkoutBlockPlaylist (custom)
    - WorkoutBlockPlaylistItem × N (custom)
  - Button - Add Block
- WorkoutAddBlockDialog (custom)
- WorkoutEditExerciseDialog (custom)

**Component Tree (Active Mode):**

- PageLayout (wrapper)
- WorkoutActiveMode (custom)
  - WorkoutActiveStrengthView (strength blocks)
    - WorkoutSetTable → WorkoutSetTableRow × N
  - WorkoutAmrapView (AMRAP blocks)
  - WorkoutEmomView (EMOM blocks)
  - WorkoutTabataView (Tabata blocks)
  - WorkoutForTimeView (ForTime blocks)
  - WorkoutActiveModeFooter
    - WorkoutRestTimerWidget (after set completion)
- WorkoutActiveModeHeaderActions (header)
- WorkoutQueueDrawer (block queue)
- WorkoutFinishDialog (end confirmation)
- WorkoutCancelDialog (cancel confirmation)
- WorkoutConfigureAmrapDialog, WorkoutConfigureEmomDialog, etc.

**Composables Used:**

- `useWorkout` - Workout state singleton
- `useWorkoutMode` - Mode transitions and block navigation
- `useWorkoutPersistence` - Auto-save to IndexedDB

**Key Features:**

- **Dual-mode interface:** Builder (planning) ↔ Active (execution)
- **Builder Mode:**
  - Add/edit/remove blocks
  - Configure exercises, sets, reps
  - Reorder blocks
  - Preview workout structure
- **Active Mode:**
  - Strength blocks: Set-by-set tracking with kg/reps/RIR
  - Timed blocks: Circular timer with exercise progression
  - Rest timer between sets
  - Block navigation (prev/next/skip)
  - Queue drawer for workout overview
- **State persistence:** Auto-saves during workout
- **Lifecycle management:** Resume on refresh, cleanup on unmount

**User Flow:**

- **In:** Home (Start Workout), Templates (Start from template), Resume dialog
- **Out (Builder):** Cancel → Home, Start → Active Mode
- **Out (Active):** Finish → WorkoutSummaryView, Cancel → Home

---

### 7. WorkoutDetailView.vue

**Route:** `/workouts/:id` (RouteNames.WorkoutDetail)
**Purpose:** View completed workout details with exercise breakdown and redo functionality
**File:** `src/views/WorkoutDetailView.vue`

```
┌─────────────────────────────────────────┐
│  [←] Leg Day - March 15, 2025           │
├─────────────────────────────────────────┤
│                                         │
│  ⏱ 45:32  │  🏋️ 3 exercises  │  📊 9 sets│ ← Stats row
│  ─────────────────────────────────      │
│                                         │
│  BLOCK 1: SQUATS                        │
│  ┌─────────────────────────────────┐    │
│  │ Set  kg    Reps   RIR           │    │
│  │ ──────────────────────────      │    │
│  │ 1    100    8      2            │    │
│  │ 2    100    8      2            │    │
│  │ 3    100    7      3            │    │
│  └─────────────────────────────────┘    │
│                                         │
│  BLOCK 2: AMRAP (10:00)                 │
│  ┌─────────────────────────────────┐    │
│  │ Completed: 4 rounds             │    │
│  │                                 │    │
│  │ • Push-ups (20 reps)            │    │
│  │ • Sit-ups (30 reps)             │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Notes:                                 │
│  Felt strong today, increased weight    │
│                                         │
│              [Redo Workout]              │
└─────────────────────────────────────────┘
```

**Component Tree:**

- PageLayout (wrapper)
- WorkoutDetailStatsRow (custom) - Summary metrics
- WorkoutDetailExerciseCard (custom) - Strength blocks
  - WorkoutDetailSetTable
    - WorkoutDetailSetRow × N
- TimedBlockCard (custom) - Timed blocks
  - WorkoutTimedBlockExerciseList
- Button (shadcn-vue) - Redo workout
- ErrorDialog (custom)

**Composables Used:**

- `useWorkoutDetail` - Load workout from DB
- `useEnterAnimation` - Stagger fade-in animations
- `useAppInitialization` - Ensure app state loaded

**Utils Used:**

- `formatDate` - Human-readable dates

**Key Features:**

- **State machine:** loading → success / error / not-found
- **Staggered animations:** Cards fade in with delays (100ms, 200ms, 300ms, etc.)
- **Stats row:** Duration, exercise count, sets, rounds (conditional)
- **Block display:**
  - Strength: Table view of sets with kg/reps/RIR
  - Timed: Round count and exercise list
- **Notes section:** Optional workout notes
- **Redo button:** Loads workout as new session in builder mode

**User Flow:**

- **In:** WorkoutHistoryCard from TheWorkoutsView
- **Out:** Redo → ActiveWorkout (builder mode with pre-filled data)

---

### 8. WorkoutSummaryView.vue

**Route:** `/workout/summary/:id` (RouteNames.WorkoutSummary)
**Purpose:** Celebratory summary screen after workout completion with stats and save-as-template option
**File:** `src/views/WorkoutSummaryView.vue`

```
┌─────────────────────────────────────────┐
│  [←] Workout Complete! 🎉              │
├─────────────────────────────────────────┤
│                                         │
│           🏆  (glowing trophy)          │ ← Animated
│                                         │
│    ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨ ✨         │ ← Confetti
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ ⏱       │  │ 🏋️       │  │ 🔄      │ │
│  │ 45:32   │  │ 3 ex.   │  │ 9 sets  │ │
│  │ Duration│  │ Exercise│  │ Sets    │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ 🎯      │  │ 🔥      │  │ 🔁      │ │
│  │ 4       │  │ 2,400kg │  │ 2       │ │
│  │ Rounds  │  │ Total   │  │ Timed   │ │
│  └─────────┘  └─────────┘  └─────────┘ │
│                                         │
│      [Save as Template]  [Done]         │
│                                         │
└─────────────────────────────────────────┘
```

**Component Tree:**

- PageLayout (wrapper)
- Card (shadcn-vue) - Stat cards
- Button (shadcn-vue) - Actions
- WorkoutSaveTemplateDialog (custom)
- Icons: Trophy, Clock, Dumbbell, Target, Flame, Repeat (lucide-vue-next)

**Composables Used:**

- `useWorkoutDetail` - Load completed workout
- `useEnterAnimation` - Staggered card animations
- `useSummaryStats` - Calculate aggregate stats

**Utils Used:**

- `formatDuration` - MM:SS formatting
- `formatWeight` - Weight with unit

**Key Features:**

- **Full-screen celebration view** with confetti animation
- **Animated trophy icon** with glow/pulse effect
- **Stats grid** (responsive: 2 cols on mobile, 3 on tablet+):
  - Duration: Total workout time
  - Exercises: Number of unique exercises
  - Rounds: Total rounds (timed blocks only)
  - Sets: Total strength sets
  - Timed Blocks: Count of timed blocks
  - Total Weight: Sum of kg × reps across all sets
- **Conditional stats:** Only shows rounds/timed if applicable
- **Staggered animations:** Cards cascade in (100ms delays)
- **Action buttons:**
  - Save as Template: Opens dialog to create reusable template
  - Done: Navigate to workout detail view

**User Flow:**

- **In:** ActiveWorkout (after workout complete)
- **Out:** Done → WorkoutDetailView, Back → TheWorkoutsView

---

### 9. CreateTemplateView.vue

**Route:** `/templates/create` (RouteNames.CreateTemplate)
**Purpose:** Create new workout templates from scratch
**File:** `src/views/CreateTemplateView.vue`

```
┌─────────────────────────────────────────┐
│  [←] Create Template                    │
├─────────────────────────────────────────┤
│                                         │
│  Template Name:                         │
│  ┌─────────────────────────────────┐    │
│  │ Upper Body Push...              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Exercises (3):                         │
│  ┌─────────────────────────────────┐    │
│  │ 🏋️ Bench Press          [3 sets]│    │
│  │                          [Edit] │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🏋️ Overhead Press       [3 sets]│    │
│  │                          [Edit] │    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🏋️ Dips                 [3 sets]│    │
│  │                          [Edit] │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [+ Add Exercise]                       │
│                                         │
│  [Cancel]                    [Save]     │
└─────────────────────────────────────────┘
```

**Component Tree:**

- PageLayout (wrapper)
- Input (shadcn-vue) - Template name
- TemplateExerciseList (custom) - Exercise list
- WorkoutExercisePicker (from workout feature) - Exercise selector
- Button (shadcn-vue) - Add, cancel, save

**Composables Used:**

- `useTemplateCreation` - Template creation logic

**Key Features:**

- **Template name input** with validation (required)
- **Exercise list** with count badge
- **Empty state** when no exercises added
- **Add exercise modal** (WorkoutExercisePicker dialog)
- **Save button** disabled when:
  - Name is empty
  - No exercises added
- **Footer actions:**
  - Cancel: Discard and return to workouts
  - Save: Create template and navigate to detail view

**User Flow:**

- **In:** TheWorkoutsView (Create Template button)
- **Out:** Cancel → TheWorkoutsView, Save → TemplateDetailView

---

### 10. TemplateDetailView.vue

**Route:** `/templates/:id` (RouteNames.TemplateDetail)
**Purpose:** View and edit template details, start workouts from templates
**File:** `src/views/TemplateDetailView.vue`

```
┌─────────────────────────────────────────┐
│  [←] Upper Body Push                    │
├─────────────────────────────────────────┤
│                                         │
│  Template Name:                         │
│  ┌─────────────────────────────────┐    │
│  │ Upper Body Push                 │    │ ← Editable
│  └─────────────────────────────────┘    │
│                                         │
│  Exercises (3):                         │
│  ┌─────────────────────────────────┐    │
│  │ 🏋️ Bench Press          [3 sets]│    │
│  │ ═══   ☰  ═══             [✕]   │    │ ← Reorder/delete
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ 🏋️ Overhead Press       [3 sets]│    │
│  │ ═══   ☰  ═══             [✕]   │    │
│  └─────────────────────────────────┘    │
│                                         │
│  [+ Add Exercise]                       │
│                                         │
│  ─────────────────────────────────      │
│                                         │
│  [Start Workout]                        │ ← Normal state
│                                         │
│  OR (if edited):                        │
│  [Cancel]  [Save Changes]  [Delete]     │ ← Edited state
│                                         │
└─────────────────────────────────────────┘
```

**Component Tree:**

- PageLayout (wrapper)
- Input (shadcn-vue) - Editable template name
- TemplateExerciseList (custom) - Exercise list with reorder/delete
- WorkoutExercisePicker (custom) - Add exercise modal
- MobileDialogContent (custom) - Delete confirmation
- Dialog (shadcn-vue) - Delete dialog
- Button (shadcn-vue) - Actions

**Composables Used:**

- `useTemplateDetail` - Load, edit, save, delete operations

**Key Features:**

- **Editable template name** field
- **Exercise list** with:
  - Dynamic count display
  - Drag handles for reordering
  - Delete buttons per exercise
  - Set count adjustment (+ / -)
- **Three footer button states:**
  1. **Normal (not edited):** [Start Workout]
  2. **Edited:** [Cancel] [Save Changes] [Delete] (delete disabled)
  3. **Always available:** Delete Template (when not edited)
- **Delete confirmation dialog** with cancel/delete options
- **Add exercise modal** (same as create template)
- **Redirect to workouts list** if template not found
- **Unsaved changes confirmation** on back navigation

**User Flow:**

- **In:** TemplateListCard from TheWorkoutsView
- **Out:**
  - Start Workout → ActiveWorkout (builder mode with template data)
  - Delete → TheWorkoutsView
  - Back (with changes) → Confirmation dialog

---

### 11. CreateCustomExercise.vue

**Route:** `/create-exercise` (RouteNames.CreateCustomExercise)
**Purpose:** Create custom exercises with comprehensive configuration options
**File:** `src/views/CreateCustomExercise.vue`

```
┌─────────────────────────────────────────┐
│  [←] Create Exercise          [Save]    │
├─────────────────────────────────────────┤
│                                         │
│  Icon:  [🏋️ Select]                     │ ← Emoji picker
│                                         │
│  Name:                                  │
│  ┌─────────────────────────────────┐    │
│  │ Bulgarian Split Squat           │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Settings:                              │
│  ┌─────────────────────────────────┐    │
│  │ Equipment       Barbell        →│    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Muscle Group    Legs           →│    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Exercise Type   Compound       →│    │
│  └─────────────────────────────────┘    │
│  ┌─────────────────────────────────┐    │
│  │ Metrics         Weight & Reps  →│    │
│  └─────────────────────────────────┘    │
│                                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Select Equipment                 [✕]   │ ← Modal (one at a time)
├─────────────────────────────────────────┤
│  ○ Barbell                              │
│  ○ Dumbbell                             │
│  ○ Machine                              │
│  ○ Cable                                │
│  ○ Bodyweight                           │
│  ○ Kettlebell                           │
│  ○ Band                                 │
│  ○ EZ-Bar                               │
│  ○ Hex-Bar                              │
└─────────────────────────────────────────┘
```

**Component Tree:**

- PageLayout (wrapper)
- Button (shadcn-vue) - Icon picker, save
- Input (shadcn-vue) - Name, icon (hidden file input)
- ExerciseSettingsItem (custom) - Setting rows
- ExerciseSelectorDialog (custom) - Selection modals × 4
  - Equipment modal
  - Muscle group modal
  - Exercise type modal
  - Metrics modal

**Composables Used:**

- `useExerciseForm` - Form state and validation

**Data:**

- `EQUIPMENT_OPTIONS` - barbell, dumbbell, machine, cable, bodyweight, kettlebell, band, ez-bar, hex-bar
- `MUSCLE_OPTIONS` - chest, back, legs, shoulders, arms, core
- `TYPE_OPTIONS` - compound, isolation, stability, cardio
- `METRICS_OPTIONS` - weight-reps, reps-only, duration, distance-duration, weight-distance

**Utils Used:**

- `EQUIPMENT_LABELS`, `METRICS_LABELS`, `MUSCLE_LABELS`, `TYPE_LABELS`

**Key Features:**

- **Icon picker button** (emoji) with hidden file input
- **Name input field** with auto-focus
- **Settings list** with click-to-modal pattern
- **Four selection modals** (one open at a time):
  - Equipment
  - Muscle group
  - Exercise type
  - Metrics
- **Modal state machine:** Only allows one modal open simultaneously
- **Form validation:**
  - Name required (min length)
  - All settings must be selected
- **Save button** in header:
  - Disabled when validation fails
  - Saves to exercises store
  - Navigates back to exercises view

**User Flow:**

- **In:** TheExercisesView (Create Custom button)
- **Out:** Save → TheExercisesView, Cancel → TheExercisesView

---

## Feature Components

### Workout Feature (`src/features/workout/`)

**Domain:** Core workout building, execution, and tracking

#### Active Mode Components (Execution)

**1. WorkoutActiveMode.vue**

- **Purpose:** Orchestrator for active workout mode
- **File:** `src/features/workout/components/WorkoutActiveMode.vue:1`
- **Composables:** useWorkout, useWorkoutMode, useRestTimer
- **Key Features:**
  - Switches between strength and timed views based on current block
  - Manages timer state via template refs
  - Coordinates footer display (rest timer, controls)
  - Handles block navigation and completion

**2. WorkoutActiveStrengthView.vue**

- **Purpose:** Strength block execution UI with set table
- **File:** `src/features/workout/components/WorkoutActiveStrengthView.vue:1`
- **Contains:** WorkoutSetTable → WorkoutSetTableRow × N
- **Features:**
  - Real-time set input (kg, reps, RIR)
  - Previous workout history display
  - Active set highlighting
  - Input validation

**3. WorkoutActiveModeFooter.vue**

- **Purpose:** Contextual footer with controls
- **File:** `src/features/workout/components/WorkoutActiveModeFooter.vue:1`
- **Props:**
  - `block: Block` - Current block
  - `timer?: TimerDisplayData` - Timer info for timed blocks
  - `canComplete: boolean` - Enable complete set button
  - `isFirstBlock: boolean`, `isLastBlock: boolean`
  - `restTimer: ReturnType<typeof useRestTimer>`
- **Emits:** `prev-block`, `next-block`, `complete-set`, `toggle-timer`, `complete-block`
- **Displays:**
  - Strength: [◄ Prev] [Complete Set] [Next ►]
  - Timed: [▶/❚❚ Toggle] [Complete Block]
  - Rest timer widget (after set completion)

**4. WorkoutActiveModeHeaderActions.vue**

- **Purpose:** Header action buttons
- **File:** `src/features/workout/components/WorkoutActiveModeHeaderActions.vue:1`
- **Buttons:** Skip Block, Queue, End Workout

**5. WorkoutSetTable.vue + WorkoutSetTableRow.vue**

- **Purpose:** Editable strength set table
- **File:** `src/features/workout/components/WorkoutSetTable.vue:1`
- **Columns:** Set #, kg, Reps, RIR, Status (✓)
- **Features:**
  - Number inputs for kg/reps/RIR
  - Active set highlighting
  - Completed set checkmarks
  - Weight unit conversion via useWeightDisplay

#### Builder Mode Components (Planning)

**6. WorkoutBuilderMode.vue**

- **Purpose:** Workout planning interface
- **File:** `src/features/workout/components/WorkoutBuilderMode.vue:1`
- **Contains:** WorkoutBlockPlaylist, Add Block button
- **Features:**
  - Block list with edit/delete
  - Add block dialog
  - Start workout button

**7. WorkoutBlockPlaylist.vue + WorkoutBlockPlaylistItem.vue**

- **Purpose:** Block list with management controls
- **File:** `src/features/workout/components/WorkoutBlockPlaylist.vue:1`
- **Each Item Shows:**
  - Block kind label (STRENGTH, AMRAP, EMOM, etc.)
  - Exercise list or timer config
  - Edit and delete buttons
- **Features:** Reordering (drag handles)

**8. WorkoutAddBlockDialog.vue**

- **Purpose:** Add new block to workout
- **File:** `src/features/workout/components/WorkoutAddBlockDialog.vue:1`
- **Two Tabs:**
  - Strength: Exercise picker with set count
  - Timed: Timer type selector (AMRAP/EMOM/Tabata/ForTime)
- **Emits:** `add-block: [block: Block]`

**9. WorkoutExercisePicker.vue**

- **Purpose:** Exercise selection modal
- **File:** `src/features/workout/components/WorkoutExercisePicker.vue:1` (exported from `index.ts`)
- **Features:**
  - Search bar with muscle filters
  - Exercise list with ExerciseListItem
  - Uses useExerciseSearch composable

**10. WorkoutEditExerciseDialog.vue**

- **Purpose:** Edit exercise properties in block
- **File:** `src/features/workout/components/WorkoutEditExerciseDialog.vue:1`
- **Editable:**
  - Exercise name
  - Set count
  - Reps per set
  - Delete exercise

#### Timed Block Configuration Dialogs

**11. WorkoutConfigureAmrapDialog.vue**

- **Purpose:** Configure AMRAP block
- **File:** `src/features/workout/components/WorkoutConfigureAmrapDialog.vue:1`
- **Inputs:** Duration (minutes), Exercises (picker)

**12. WorkoutConfigureEmomDialog.vue**

- **Purpose:** Configure EMOM block
- **File:** `src/features/workout/components/WorkoutConfigureEmomDialog.vue:1`
- **Inputs:** Minutes, Exercises (picker)

**13. WorkoutConfigureTabataDialog.vue**

- **Purpose:** Configure Tabata block
- **File:** `src/features/workout/components/WorkoutConfigureTabataDialog.vue:1`
- **Inputs:** Work seconds, Rest seconds, Rounds, Exercises

**14. WorkoutConfigureForTimeDialog.vue**

- **Purpose:** Configure ForTime block
- **File:** `src/features/workout/components/WorkoutConfigureForTimeDialog.vue:1`
- **Inputs:** Time cap (optional), Exercises (picker)

#### Display & Widget Components

**15. WorkoutDetailExerciseCard.vue**

- **Purpose:** Exercise breakdown card for completed workouts
- **File:** `src/features/workout/components/WorkoutDetailExerciseCard.vue:1`
- **Shows:** Exercise name, set table (read-only)

**16. WorkoutDetailSetTable.vue + WorkoutDetailSetRow.vue**

- **Purpose:** Read-only set display for history
- **File:** `src/features/workout/components/WorkoutDetailSetTable.vue:1`
- **Columns:** Set #, kg, Reps, RIR

**17. WorkoutDetailStatsRow.vue**

- **Purpose:** Summary metrics row
- **File:** `src/features/workout/components/WorkoutDetailStatsRow.vue:1`
- **Stats:** Duration, Exercises, Sets, Rounds (conditional)

**18. TimedBlockCard.vue**

- **Purpose:** Timed block display for history
- **File:** `src/features/workout/components/TimedBlockCard.vue:1`
- **Shows:** Block type label, rounds/time, exercise list

**19. WorkoutRestTimerWidget.vue**

- **Purpose:** Rest timer display
- **File:** `src/features/workout/components/WorkoutRestTimerWidget.vue:1`
- **Displays:** Elapsed time (MM:SS)
- **Max:** 5 minutes (auto-stops)

**20. WorkoutQueueDrawer.vue + WorkoutQueueItem.vue**

- **Purpose:** Block queue visualization
- **File:** `src/features/workout/components/WorkoutQueueDrawer.vue:1`
- **Shows:** All blocks with current highlighted
- **Features:** Quick navigation to blocks

**21. WorkoutDurationBadge.vue**

- **Purpose:** Duration indicator
- **File:** `src/features/workout/components/WorkoutDurationBadge.vue:1`
- **Displays:** Formatted workout duration

**22. WorkoutHeader.vue**

- **Purpose:** Page header with workout metadata
- **File:** `src/features/workout/components/WorkoutHeader.vue:1`

**23. WorkoutPreviousHistory.vue**

- **Purpose:** Previous workout display in active mode
- **File:** `src/features/workout/components/WorkoutPreviousHistory.vue:1`

**24. WorkoutSaveTemplateDialog.vue**

- **Purpose:** Save completed workout as template
- **File:** `src/features/workout/components/WorkoutSaveTemplateDialog.vue:1`
- **Input:** Template name
- **Action:** Create template in DB, navigate to detail

**25. WorkoutFinishDialog.vue**

- **Purpose:** End workout confirmation
- **File:** `src/features/workout/components/WorkoutFinishDialog.vue:1`

**26. WorkoutCancelDialog.vue**

- **Purpose:** Cancel workout confirmation
- **File:** `src/features/workout/components/WorkoutCancelDialog.vue:1`

**27. WorkoutTimedBlockCard.vue**

- **Purpose:** Timed block summary card
- **File:** `src/features/workout/components/WorkoutTimedBlockCard.vue:1`

**28. WorkoutTimedBlockExerciseList.vue**

- **Purpose:** Exercise list for timed blocks
- **File:** `src/features/workout/components/WorkoutTimedBlockExerciseList.vue:1`

**29-35. Additional Supporting Components**

- WorkoutAmrapConfig.vue
- WorkoutEmomConfig.vue
- WorkoutTabataConfig.vue
- WorkoutForTimeConfig.vue
- WorkoutAddBlockDialogExerciseItem.vue
- WorkoutBlockPlaylist.vue
- WorkoutBlockPlaylistItem.vue

### Templates Feature (`src/features/templates/`)

**Domain:** Reusable workout templates

**1. TemplateExerciseList.vue**

- **File:** `src/features/templates/components/TemplateExerciseList.vue:1`
- **Purpose:** List of exercises with reordering and set count control
- **Features:**
  - Drag handles for reorder
  - Set count + / - buttons
  - Delete buttons
  - Exercise icons and muscle badges

**2. TemplateExerciseItem.vue**

- **File:** `src/features/templates/components/TemplateExerciseItem.vue:1`
- **Purpose:** Individual exercise row
- **Props:**
  - `exercise: TemplateExercise`
  - `index: number`
- **Emits:** `move-up`, `move-down`, `delete`, `update-sets`

### Timers Feature (`src/features/timers/`)

**Domain:** Standalone timer application

**1. StandaloneTimerRunner.vue**

- **File:** `src/features/timers/components/StandaloneTimerRunner.vue:1`
- **Purpose:** Orchestrator for standalone timer runs
- **Manages:** Timer lifecycle (play, pause, reset, complete)
- **Exposes:** Timer control methods via template refs

**2. TimerPresetSelector.vue**

- **File:** `src/features/timers/components/TimerPresetSelector.vue:1`
- **Purpose:** Select timer preset
- **Displays:** 2×2 grid of timer types

**3. TimerPresetList.vue**

- **File:** `src/features/timers/components/TimerPresetList.vue:1`
- **Purpose:** List available presets

**4. TimerPresetButton.vue**

- **File:** `src/features/timers/components/TimerPresetButton.vue:1`
- **Purpose:** Individual preset button with color-coding

**5. TimerCustomForm.vue**

- **File:** `src/features/timers/components/TimerCustomForm.vue:1`
- **Purpose:** Create custom timer configuration

### Exercises Feature (`src/features/exercises/`)

**Domain:** Exercise management

**1. ExerciseSelectorDialog.vue**

- **File:** `src/features/exercises/components/ExerciseSelectorDialog.vue:1`
- **Purpose:** Generic selector dialog with grid/list layouts
- **Props:**
  - `title: string`
  - `options: Array<{value: string, label: string}>`
  - `layout?: 'grid' | 'list'`
- **v-model:** `open: boolean`, `selected: string`
- **Features:** Flexible layout, keyboard navigation

**2. ExerciseSettingsItem.vue**

- **File:** `src/features/exercises/components/ExerciseSettingsItem.vue:1`
- **Purpose:** Exercise setting row
- **Props:**
  - `label: string`
  - `value: string`
- **Emits:** `click`
- **Displays:** Label | Value →

### Settings Feature (`src/features/settings/`)

**Domain:** Application settings

**1. SettingsDeleteAllDataDialog.vue**

- **File:** `src/features/settings/components/SettingsDeleteAllDataDialog.vue:1`
- **Purpose:** Confirmation dialog for data reset
- **Actions:** Cancel, Delete All Data
- **Calls:** `deleteAllData()` utility

**2. SettingsImportDataDialog.vue**

- **File:** `src/features/settings/components/SettingsImportDataDialog.vue:1`
- **Purpose:** Import workout data from JSON
- **Validation:** Uses exportDataSchema from validation utils
- **Error Handling:** Displays ErrorDialog on failure

**3. SettingsWakeLockDiagnostics.vue**

- **File:** `src/features/settings/components/SettingsWakeLockDiagnostics.vue:1`
- **Purpose:** Display wake lock status
- **Shows:**
  - API support status
  - Native wake lock active/inactive
  - Video fallback active/inactive
  - Current strategy (native/video/both)

---

## Shared Components

### Layout Components

**1. Layout.vue**

- **File:** `src/components/Layout.vue:1`
- **Purpose:** App-level layout with bottom navigation
- **Props:** None
- **Slots:** `default` - Main content
- **Features:**
  - Bottom sticky nav bar (4 routes)
  - Auto-highlight current route
  - Hides nav when `route.meta.hideNav === true`
  - Icons: Home, Dumbbell, ListCheck, Settings

```
┌─────────────────────────────────────────┐
│                                         │
│       <router-view /> content           │
│                                         │
│                                         │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐
│  [🏠 Home] [🏋️ Workouts] [📋 Ex] [⚙️]  │ ← Bottom nav
└─────────────────────────────────────────┘
```

**2. PageLayout.vue**

- **File:** `src/components/PageLayout.vue:1`
- **Purpose:** Standard page wrapper with header, content, footer
- **Props:**
  - `title: string` (required)
  - `subtitle?: string`
  - `backTo?: string` - Route name
  - `scrollable?: boolean` (default: true)
  - `preventNavigation?: boolean` (default: false)
- **Emits:** `back: []`
- **Slots:**
  - `header-actions` - Right side of header
  - `default` - Main content
  - `footer` - Sticky footer
- **Structure:** Flex layout (header, scrollable main, footer)

**3. PageHeader.vue**

- **File:** `src/components/PageHeader.vue:1`
- **Purpose:** Sticky header with back button, title, subtitle, actions
- **Props:**
  - `title: string` (required)
  - `subtitle?: string`
  - `backTo?: string`
  - `preventNavigation?: boolean` (default: false)
- **Emits:** `back: []`
- **Slots:** `actions` - Right-aligned content
- **Styling:** Sticky, backdrop blur, z-index: 10

### Dialog Components

**4. ErrorDialog.vue**

- **File:** `src/components/ErrorDialog.vue:1`
- **Purpose:** Reusable error message dialog
- **Props:**
  - `error: string` (required) - Error message
  - `title?: string` - Custom title
- **v-model:** `open: boolean` (required)
- **Composition:** Dialog + MobileDialogContent + AlertCircle icon
- **Usage:** Error feedback throughout app

**5. ResumeWorkoutDialog.vue**

- **File:** `src/components/ResumeWorkoutDialog.vue:1`
- **Purpose:** Resume incomplete workout confirmation
- **Props:**
  - `workoutName: string` (required)
  - `blockCount: number` (required)
- **v-model:** `open: boolean` (required)
- **Emits:** `resume: []`, `discard: []`
- **i18n:** Supports plural forms (block/blocks)

**6. MobileDialogContent.vue**

- **File:** `src/components/MobileDialogContent.vue:1`
- **Purpose:** Responsive dialog wrapper
- **Props:**
  - `class?: HTMLAttributes['class']`
  - `showCloseButton?: boolean` (default: true)
- **Behavior:**
  - **Mobile:** Bottom sheet with drag handle
  - **Desktop (sm+):** Centered modal with close button
- **Features:**
  - Safe area bottom padding (iOS notch)
  - Smooth slide-up animation
  - Built on reka-ui Dialog primitives

### Card Components

**7. WorkoutHistoryCard.vue**

- **File:** `src/components/WorkoutHistoryCard.vue:1`
- **Purpose:** Completed workout summary card
- **Props:**
  ```typescript
  workout: {
    id: string
    name: string
    completedAt: number
    durationSeconds: number
  }
  ```
- **Emits:** `click: [id: string]`
- **Features:**
  - Keyboard accessible (Enter/Space)
  - Formatted date and duration
  - Hover state
  - Button role (tabindex="0")

**8. TemplateListCard.vue**

- **File:** `src/components/TemplateListCard.vue:1`
- **Purpose:** Workout template summary card
- **Props:**
  ```typescript
  template: {
    id: string
    name: string
    blocks: ReadonlyArray<unknown>
    lastUsedAt: number | null
  }
  formatDate: (timestamp: number | null) => string
  ```
- **Emits:** `click: [id: string]`
- **Features:**
  - Block count with i18n
  - Last used timestamp
  - Keyboard accessible
  - Chevron indicator

**9. ExerciseListItem.vue**

- **File:** `src/components/ExerciseListItem.vue:1`
- **Purpose:** Exercise picker item with variants
- **Props:**
  - `exercise: Exercise` (required)
  - `variant?: 'list' | 'dialog'` (default: 'list')
- **Emits:** `select: [exercise: Exercise]`
- **Variants:**
  - `list`: Full-width with icon container
  - `dialog`: Compact with inline icon + chevron
- **Features:**
  - Muscle group badge
  - Exercise icon
  - Active/hover animations

### Timer Display Components

**10. WorkoutCircularTimer.vue**

- **File:** `src/components/timers/WorkoutCircularTimer.vue:1`
- **Purpose:** Reusable circular progress timer for timed blocks
- **Props:**
  - `progress: number` - 0-100 (required)
  - `progressColor?: string` - Tailwind class (default: 'text-primary')
  - `urgent?: boolean` - Apply destructive styling (default: false)
  - `showProgress?: boolean` - Show arc (default: true)
  - `variant?: 'default' | 'gym'` - Size variant
- **Slots:** `default` - Center content
- **Variants:**
  - **default:** 320px, stroke-width: 8, round caps
  - **gym:** 360px, stroke-width: 16, square caps (industrial look)
- **Features:**
  - SVG circular progress with smooth animation
  - Urgent state: red + pulse
  - Optional progress arc (useful for uncapped ForTime)
  - Rotation: -90deg (starts at top)

```
        ╭─────────────╮
       │      AMRAP    │
      │               │
     │     03:24      │  ← Time
     │               │
     │    2 Rounds    │  ← Rounds
      │    Squats     │  ← Exercise
       │             │
        ╰─────────────╯
   ◀━━━━━━━●─────────▶  ← Progress arc
```

**11. WorkoutAmrapView.vue**

- **File:** `src/components/timers/WorkoutAmrapView.vue:60`
- **Purpose:** AMRAP timer with round counter
- **Props:**
  - `block: AmrapBlock` (required)
  - `onComplete?: () => void`
- **Emits:**
  - `increment-round: []`
  - `update:isRunning: [boolean]`
- **Exposed:**
  - `complete(): AmrapResult`
  - `toggle(): void`
  - `reset(): void`
  - `isRunning: ComputedRef<boolean>`
  - `formattedTime: ComputedRef<string>`
  - `timerLabel: string` ('AMRAP')
- **Display (inside gym circular timer):**
  - Label: "AMRAP"
  - Remaining time: 5rem font, destructive when ≤ 10s
  - Round counter: 4xl font with "ROUNDS" label
  - Current exercise name
- **External:**
  - +1 Button (disabled when paused)

**12. WorkoutEmomView.vue**

- **File:** `src/components/timers/WorkoutEmomView.vue:1`
- **Purpose:** EMOM timer with minute progression
- **Props:**
  - `block: EmomBlock` (required)
  - `onComplete?: () => void`
- **Emits:** `update:isRunning: [boolean]`
- **Exposed:** Same as AmrapView
- **Display (inside gym circular timer):**
  - Label: "EMOM"
  - Current minute: "M/N" (e.g., "3/10")
  - Remaining seconds in minute: 7rem font
  - Current exercise + reps
  - Urgent when ≤ 5s remaining
- **Circular Progress:** Based on seconds in current minute (0-60 → 0-100%)

**13. WorkoutTabataView.vue**

- **File:** `src/components/timers/WorkoutTabataView.vue:1`
- **Purpose:** Tabata interval timer (work/rest)
- **Props:**
  - `block: TabataBlock` (required)
  - `onComplete?: () => void`
- **Emits:** `update:isRunning: [boolean]`
- **Exposed:** Same as AmrapView
- **Display (inside gym circular timer):**
  - Phase badge: "WORK" (emerald) or "REST" (amber)
  - Remaining seconds in phase: 7rem font
  - Round counter: "R/N"
  - Current exercise
  - Phase-aware colors (border, background)
  - Urgent red when ≤ 3s
- **Audio:** Uses useTimerAudio (work/rest/round/complete beeps)

**14. WorkoutForTimeView.vue**

- **File:** `src/components/timers/WorkoutForTimeView.vue:1`
- **Purpose:** ForTime timer (elapsed time with optional cap)
- **Props:**
  - `block: ForTimeBlock` (required)
  - `onComplete?: () => void`
- **Emits:** `update:isRunning: [boolean]`
- **Exposed:**
  - `complete(): ForTimeResult`
  - `toggle(): void`
  - `reset(): void`
  - `finishWorkout(): void`
- **Display (inside circular timer):**
  - Label: "FOR TIME"
  - Elapsed time: 5rem font (MM:SS)
  - Time cap indicator (if set): "Cap: 10:00"
  - Current exercise + prescribed reps
- **Progress:** Shows arc if capped, hides if uncapped

### PWA Component

**15. PwaUpdatePrompt.vue**

- **File:** `src/components/PwaUpdatePrompt.vue:1`
- **Purpose:** Service worker update notification
- **Props:** None
- **Features:**
  - Bottom-fixed position (adjusts for bottom nav)
  - Dismissible close button
  - "Update" and "Later" actions
  - Slide-up enter animation
  - i18n support
- **Integration:** Uses `virtual:pwa-register/vue` composable
- **Teleport:** Renders to document body

---

## Composables

### Timer Composables

**1. useBaseTimer.ts**

- **File:** `src/composables/timers/useBaseTimer.ts:1`
- **Purpose:** Foundation timing logic for all timed blocks
- **State Machine:**
  ```
  idle ──start──▶ running ◀──resume── paused
   ▲                 │
   │               pause
   │                 │
   │                 ▼
   └──start──── completed
  ```
- **API:**
  ```typescript
  useBaseTimer(config?: {
    onTick?: () => void
    tickInterval?: number  // 100ms default
    onComplete?: () => void
  })
  ```
- **Returns:**

  ```typescript
  {
    // State (readonly)
    status: Readonly<Ref<'idle' | 'running' | 'paused' | 'completed'>>
    elapsedMs: Readonly<Ref<number>>
    elapsedSeconds: ComputedRef<number>

    // Flags
    isRunning: ComputedRef<boolean>
    isPaused: ComputedRef<boolean>
    isCompleted: ComputedRef<boolean>
    isIdle: ComputedRef<boolean>

    // Methods
    start(): void
    pause(): void
    toggle(): void
    resetState(): void
    complete(): boolean
  }
  ```

- **Features:**
  - Pause/resume with pause duration tracking
  - Tick callbacks at 100ms intervals
  - State transition validation
  - Prevents invalid transitions

**2. useRestTimer.ts**

- **File:** `src/composables/timers/useRestTimer.ts:1`
- **Purpose:** Rest period timer between sets
- **API:**
  ```typescript
  useRestTimer()
  ```
- **Returns:**
  ```typescript
  {
    elapsedSeconds: Ref<number>
    isRunning: ComputedRef<boolean>
    formattedTime: ComputedRef<string>  // MM:SS
    start(): void
    stop(): void
    reset(): void
    toggle(): void
  }
  ```
- **Features:**
  - Auto-stops at 5 minutes (MAX_REST_TIME_SECONDS = 300)
  - 1-second tick interval
  - Simple start/stop (no pause state)
- **Usage:** WorkoutRestTimerWidget, strength workflows

**3. useAmrapTimer.ts**

- **File:** `src/composables/timers/useAmrapTimer.ts:1`
- **Purpose:** AMRAP timer (as many rounds as possible)
- **Extends:** useBaseTimer
- **API:**
  ```typescript
  useAmrapTimer(config?: { onComplete?: () => void })
  ```
- **Additional Returns:**
  ```typescript
  {
    initialize(block: AmrapBlock): void
    remainingSeconds: ComputedRef<number>
    progress: ComputedRef<number>  // 0-100
    rounds: Ref<number>
    currentExerciseIndex: ComputedRef<number>
    formattedRemaining: ComputedRef<string>  // MM:SS
    incrementRound(): void
    complete(): AmrapResult
  }
  ```
- **Round Tracking:** Manual via +1 button or auto-cycling
- **Completion:** Returns rounds completed and exercise breakdown

**4. useEmomTimer.ts**

- **File:** `src/composables/timers/useEmomTimer.ts:1`
- **Purpose:** EMOM timer (every minute on the minute)
- **Extends:** useBaseTimer
- **API:**
  ```typescript
  useEmomTimer(config?: { onComplete?: () => void })
  ```
- **Additional Returns:**
  ```typescript
  {
    initialize(block: EmomBlock): void
    currentMinute: ComputedRef<number>  // 1-based (1/N)
    secondsRemainingInMinute: ComputedRef<number>  // 0-60
    currentExerciseIndex: ComputedRef<number>
    progress: ComputedRef<number>  // Within minute (0-100)
    complete(): EmomResult
  }
  ```
- **Minute Tracking:** Automatic based on elapsed time
- **Auto-advance:** Moves to next minute at 60s

**5. useForTimeTimer.ts**

- **File:** `src/composables/timers/useForTimeTimer.ts:1`
- **Purpose:** ForTime timer (complete work in specified time)
- **Extends:** useBaseTimer
- **API:**
  ```typescript
  useForTimeTimer(config?: { onComplete?: () => void })
  ```
- **Additional Returns:**
  ```typescript
  {
    initialize(block: ForTimeBlock): void
    progress: ComputedRef<number>  // 0-100 if capped, undefined if uncapped
    formattedElapsed: ComputedRef<string>  // HH:MM:SS
    complete(): ForTimeResult
  }
  ```
- **Completion:** Returns elapsed time and exercise completions

**6. useTabataTimer.ts**

- **File:** `src/composables/timers/useTabataTimer.ts:1`
- **Purpose:** Tabata protocol timer (work/rest intervals)
- **Extends:** useBaseTimer
- **API:**
  ```typescript
  useTabataTimer(config?: {
    onComplete?: () => void
    onPhaseChange?: (phase: 'work' | 'rest') => void
    onRoundChange?: (round: number) => void
  })
  ```
- **Additional Returns:**
  ```typescript
  {
    initialize(block: TabataBlock): void
    currentPhase: ComputedRef<'work' | 'rest'>
    currentRound: ComputedRef<number>
    secondsInCurrentPhase: ComputedRef<number>
    progress: ComputedRef<number>  // 0-100 within phase
    complete(): TabataResult
  }
  ```
- **Phase Tracking:** Auto-alternates work/rest
- **Callbacks:** onPhaseChange, onRoundChange for audio cues

**7. useTimerAudio.ts**

- **File:** `src/composables/timers/useTimerAudio.ts:1`
- **Purpose:** Audio cues for timer events
- **API:**
  ```typescript
  useTimerAudio()
  ```
- **Returns:**
  ```typescript
  {
    playWorkBeep(): void    // Work phase start
    playRestBeep(): void    // Rest phase start
    playRoundBeep(): void   // Round change
    playComplete(): void    // Timer complete
  }
  ```
- **Implementation:** Web Audio API beep generation
- **Usage:** Tabata, AMRAP, rest timer feedback

### Animation & UI State Composables

**8. useAnimatedCounter.ts**

- **File:** `src/composables/useAnimatedCounter.ts:1`
- **Purpose:** Animate number changes with easing
- **API:**
  ```typescript
  useAnimatedCounter(
    target: MaybeRefOrGetter<number>,
    options?: {
      duration?: number    // 1500ms default
      delay?: number       // 0ms default
      decimals?: number    // 0 default
    }
  )
  ```
- **Returns:**
  ```typescript
  {
    displayValue: ComputedRef<number>  // Animated value
    restart(): void
  }
  ```
- **Features:**
  - Smooth easeOutExpo easing
  - Auto-restart on target changes
  - Floating-point precision rounding
  - Stagger support via delay
- **Usage:** Summary stats, counters, animated metrics
- **Dependencies:** @vueuse/core useTransition

**9. useEnterAnimation.ts**

- **File:** `src/composables/useEnterAnimation.ts:1`
- **Purpose:** Staggered element enter animations
- **API:**
  ```typescript
  useEnterAnimation(delay?: number = 100)
  ```
- **Returns:**
  ```typescript
  {
    isVisible: Ref<boolean>
  }
  ```
- **Usage:**
  ```vue
  <div v-show="isVisible" class="animate-slide-up-fade">
  ```
- **Pattern:** Multiple elements with cascading delays

**10. useDialogState.ts**

- **File:** `src/composables/useDialogState.ts:1`
- **Purpose:** Manage multiple dialogs (single-open pattern)
- **API:**
  ```typescript
  useDialogState<T extends string>()
  ```
- **Returns:**
  ```typescript
  {
    activeDialog: Ref<T | null>
    createDialogModel(dialogName: T): WritableComputedRef<boolean>
    open(dialogName: T): void
    close(): void
    isOpen(dialogName: T): ComputedRef<boolean>
  }
  ```
- **Usage:**
  ```typescript
  const { createDialogModel } = useDialogState<'edit' | 'delete'>()
  const editOpen = createDialogModel('edit')
  // v-model:open="editOpen"
  ```
- **Features:**
  - Auto-closes previous dialog
  - Type-safe dialog names
  - v-model compatible

### Exercise & Search Composables

**11. useExerciseSearch.ts**

- **File:** `src/composables/useExerciseSearch.ts:1`
- **Purpose:** Search and filter exercises
- **API:**
  ```typescript
  useExerciseSearch(options?: {
    muscleFilter?: Ref<Muscle | 'all'>
    searchFields?: ReadonlyArray<'name' | 'muscle' | 'equipment'>
  })
  ```
- **Returns:**
  ```typescript
  {
    searchQuery: Ref<string>
    filteredExercises: ComputedRef<Array<Exercise>>
    allExercises: ComputedRef<Array<Exercise>>
  }
  ```
- **Exercise Type:**
  ```typescript
  {
    name: string
    icon: string
    equipment?: string
    muscle?: Muscle
    type: PopularExercise['type']
    metrics: PopularExercise['metrics']
    id?: string  // custom exercises
    createdAt?: number  // custom exercises
  }
  ```
- **Features:**
  - Case-insensitive substring matching
  - Optional muscle filtering
  - Configurable search fields
  - Alphabetical sorting
- **Data Source:** exercisesStore (popular + custom)

### Weight Display & Unit Conversion

**12. useWeightDisplay.ts**

- **File:** `src/composables/useWeightDisplay.ts:1`
- **Purpose:** Convert weights between kg and user's unit
- **API:**
  ```typescript
  useWeightDisplay()
  ```
- **Returns:**
  ```typescript
  {
    unit: ComputedRef<'kg' | 'lbs'>
    unitLabel: ComputedRef<string>  // Localized
    toDisplayValue(kg: number | string | undefined): number | undefined
    toStorageValue(displayValue: number | undefined): number | undefined
    formatWithUnit(kg: number | string | undefined, decimals?: number): string
  }
  ```
- **Formula:**
  - kg → lbs: kg × 2.20462
  - lbs → kg: lbs × 0.453592
- **Precision:**
  - Storage: rounds to 0.1 kg
  - Display: rounds to whole numbers
- **Usage:** All weight displays, input forms, set tracking

### Utility Composables

**13. useWorkoutsList.ts**

- **File:** `src/composables/useWorkoutsList.ts:1`
- **Purpose:** Load workout history and templates
- **API:**
  ```typescript
  useWorkoutsList()
  ```
- **Returns:**
  ```typescript
  {
    workouts: Ref<ReadonlyArray<DbCompletedWorkout>>
    templates: Ref<ReadonlyArray<DbWorkoutTemplate>>
    isLoading: Ref<boolean>
    loadAll(): Promise<void>
    formatTemplateDate(timestamp: number | null): string
  }
  ```
- **Lifecycle:** Auto-loads on mount
- **Usage:** TheWorkoutsView, history pages
- **Data:** Fetches from workouts and templates repositories

**14. useGlobalWakeLock.ts**

- **File:** `src/composables/useGlobalWakeLock.ts:1`
- **Purpose:** Global screen wake lock (respects settings)
- **API:**
  ```typescript
  useGlobalWakeLock()
  ```
- **Returns:**
  ```typescript
  {
    isSupported: ComputedRef<boolean>
    isActive: ComputedRef<boolean>
  }
  ```
- **Features:**
  - Respects settingsStore.screenWakeLock
  - Releases on page hidden
  - Re-acquires on page visible
  - Waits for settings load
- **Usage:** App.vue root setup (call once)

**15. useScreenWakeLock.ts**

- **File:** `src/composables/useScreenWakeLock.ts:1`
- **Purpose:** Advanced wake lock with fallback
- **API:**
  ```typescript
  useScreenWakeLock()
  ```
- **Returns:**

  ```typescript
  {
    // State
    isSupported: ComputedRef<boolean>
    isActive: ComputedRef<boolean>
    nativeIsActive: Ref<boolean>
    videoIsActive: Ref<boolean>

    // Methods
    acquireNative(): Promise<void>
    releaseNative(): Promise<void>
    startVideoFallback(): void
    stopVideoFallback(): void
    acquireAll(options?: { redundant?: boolean }): Promise<void>
    releaseAll(): Promise<void>
  }
  ```

- **Features:**
  - **Native API:** W3C Screen Wake Lock API
  - **Fallback:** Silent video loop (base64 MP4)
  - **PWA Support:** Handles standalone mode
  - **Mobile Detection:** Uses redundancy on mobile/PWA
  - **Forced Release Handling:** Re-acquires after OS release
- **Redundancy Strategy:**
  - Desktop: Native only, video fallback on fail
  - Mobile/PWA: Both native AND video (PWA unreliable)
- **Error Handling:** Graceful fallback, silent failures

---

## Visual Flow Diagrams

### Navigation Flow

```
         ┌──────────────┐
         │   Layout     │
         │  (Bottom Nav)│
         └──────┬───────┘
                │
    ┌───────────┼───────────────┬───────────┐
    │           │               │           │
    ▼           ▼               ▼           ▼
 ┌─────┐  ┌─────────┐   ┌──────────┐  ┌─────────┐
 │Home │  │Workouts │   │Exercises │  │Settings │
 └──┬──┘  └────┬────┘   └─────┬────┘  └─────────┘
    │          │              │
    │     ┌────┴─────┬────────┴────────┐
    │     │          │                 │
    ▼     ▼          ▼                 ▼
┌────────────┐  ┌─────────┐    ┌──────────────┐
│ActiveWorkout│ │Template │    │CreateCustom  │
│  (builder) │ │ Detail  │    │   Exercise   │
└─────┬──────┘  └────┬────┘    └──────────────┘
      │              │
      ▼              ▼
┌────────────┐  ┌─────────┐
│ActiveWorkout│ │ActiveWorkout│
│  (active)  │ │  (builder)  │
└─────┬──────┘  └─────────────┘
      │
      ▼
┌─────────────┐
│WorkoutSummary│
└──────┬──────┘
       │
       ▼
┌──────────────┐
│WorkoutDetail │
└──────────────┘
```

### Workout Execution Flow

```
    ┌─────────────────────────────────────────┐
    │         START WORKOUT                   │
    └───────────────┬─────────────────────────┘
                    │
    ┌───────────────▼─────────────────────────┐
    │   Resume Dialog (if incomplete exists)  │
    │   • Resume existing                     │
    │   • Discard and start fresh             │
    └───────────────┬─────────────────────────┘
                    │
    ┌───────────────▼─────────────────────────┐
    │   BUILDER MODE                          │
    │   • Add blocks (strength/timed)         │
    │   • Configure exercises                 │
    │   • Set reps/rounds/duration            │
    │   • Reorder blocks                      │
    └───────────────┬─────────────────────────┘
                    │ [Start Workout]
    ┌───────────────▼─────────────────────────┐
    │   ACTIVE MODE                           │
    │   ┌─────────────────────────────────┐   │
    │   │ For each block:                 │   │
    │   │                                 │   │
    │   │ Strength:                       │   │
    │   │  • Input kg/reps/RIR per set    │   │
    │   │  • Rest timer between sets      │   │
    │   │  • [Complete Set] to advance    │   │
    │   │                                 │   │
    │   │ Timed (AMRAP/EMOM/Tabata/ForTime):│ │
    │   │  • Circular timer display       │   │
    │   │  • [▶/❚❚] to control timer      │   │
    │   │  • [Complete Block] when done   │   │
    │   └─────────────────────────────────┘   │
    │                                         │
    │   Navigation:                           │
    │   • [◄ Prev] [Next ►] between blocks    │
    │   • [Skip] to skip block                │
    │   • [Queue] to see overview             │
    │   • [End] to finish early               │
    └───────────────┬─────────────────────────┘
                    │ [All blocks complete]
    ┌───────────────▼─────────────────────────┐
    │   SUMMARY VIEW                          │
    │   • 🏆 Celebration                      │
    │   • Stats cards                         │
    │   • [Save as Template]                  │
    │   • [Done]                              │
    └───────────────┬─────────────────────────┘
                    │ [Done]
    ┌───────────────▼─────────────────────────┐
    │   DETAIL VIEW                           │
    │   • Review completed workout            │
    │   • See all sets/rounds                 │
    │   • [Redo Workout]                      │
    └─────────────────────────────────────────┘
```

### Timer State Machine

```
                ┌─────────┐
                │  IDLE   │ ← Initial state
                └────┬────┘
                     │
                 [start()]
                     │
                     ▼
       ┌─────────────────────────┐
       │       RUNNING           │
       │  • elapsedMs increments │
       │  • onTick() every 100ms │
       └────┬──────────────┬─────┘
            │              │
       [pause()]      [complete()]
            │              │
            ▼              ▼
       ┌─────────┐   ┌──────────┐
       │ PAUSED  │   │COMPLETED │
       │         │   │          │
       └────┬────┘   └──────────┘
            │
       [start()/resume()]
            │
            └──────────┐
                       │
                       ▼
                  (back to RUNNING)

Actions available per state:
  IDLE:      start()
  RUNNING:   pause(), complete(), toggle()
  PAUSED:    start()/resume(), toggle()
  COMPLETED: (terminal - use resetState() to restart)
```

### Component Hierarchy

```
App.vue
└── Layout.vue (bottom nav)
    ├── TheHomeView
    │   └── Card × 2 (Start Workout, Quick Timer)
    │
    ├── TheWorkoutsView
    │   ├── Tabs
    │   │   ├── Templates Tab
    │   │   │   └── TemplateListCard × N
    │   │   └── History Tab
    │   │       └── WorkoutHistoryCard × N
    │   └── [Create Template] → CreateTemplateView
    │
    ├── TheExercisesView
    │   ├── Input (search)
    │   ├── Button × N (muscle filters)
    │   ├── ExerciseListItem × N
    │   └── [Create Custom] → CreateCustomExercise
    │
    ├── TheTimersView
    │   ├── TimerPresetSelector
    │   │   └── TimerPresetButton × 4
    │   └── StandaloneTimerRunner
    │       ├── WorkoutAmrapView
    │       ├── WorkoutEmomView
    │       ├── WorkoutTabataView
    │       └── WorkoutForTimeView
    │
    ├── TheSettingsView
    │   ├── ToggleGroup (units)
    │   ├── Switch (dark mode, wake lock, sounds)
    │   ├── Select (language)
    │   ├── SettingsDeleteAllDataDialog
    │   ├── SettingsImportDataDialog
    │   └── SettingsWakeLockDiagnostics
    │
    └── ActiveWorkout
        ├── BUILDER MODE:
        │   ├── WorkoutBuilderMode
        │   │   ├── WorkoutBlockPlaylist
        │   │   │   └── WorkoutBlockPlaylistItem × N
        │   │   └── WorkoutAddBlockDialog
        │   ├── WorkoutEditExerciseDialog
        │   ├── WorkoutConfigureAmrapDialog
        │   ├── WorkoutConfigureEmomDialog
        │   ├── WorkoutConfigureTabataDialog
        │   └── WorkoutConfigureForTimeDialog
        │
        └── ACTIVE MODE:
            ├── WorkoutActiveModeHeaderActions
            ├── WorkoutActiveStrengthView (strength blocks)
            │   └── WorkoutSetTable
            │       └── WorkoutSetTableRow × N
            ├── WorkoutAmrapView (timed blocks)
            │   └── WorkoutCircularTimer (variant="gym")
            ├── WorkoutEmomView
            │   └── WorkoutCircularTimer (variant="gym")
            ├── WorkoutTabataView
            │   └── WorkoutCircularTimer (variant="gym")
            ├── WorkoutForTimeView
            │   └── WorkoutCircularTimer (variant="gym")
            ├── WorkoutActiveModeFooter
            │   └── WorkoutRestTimerWidget
            ├── WorkoutQueueDrawer
            │   └── WorkoutQueueItem × N
            ├── WorkoutFinishDialog
            └── WorkoutCancelDialog
```

---

## Timed Block UI Deep Dive

This section provides a detailed breakdown of the timed block execution UI, matching the example provided.

### WorkoutCircularTimer Anatomy

The `WorkoutCircularTimer` component (`variant="gym"`) is the core visual element for all timed block displays.

**Structure:**

```
┌─────────────────────────────────────────┐
│                                         │
│        ╭───────────────────────╮        │
│       ╱   (SVG Circle Track)   ╲       │
│      │                           │      │
│      │  ┌─────────────────────┐  │      │
│      │  │  <slot> content     │  │      │ ← Centered content
│      │  │  goes here          │  │      │
│      │  └─────────────────────┘  │      │
│      │                           │      │
│       ╲  (SVG Progress Arc)     ╱       │
│        ╰───────────────────────╯        │
│                                         │
│         360px × 360px (gym mode)        │
└─────────────────────────────────────────┘
```

**Props:**

- `variant="gym"` → 360px circle, 16px stroke, square caps
- `progress` → 0-100 (controls arc length)
- `progressColor` → Tailwind class for arc color
- `urgent` → Boolean for red destructive styling
- `showProgress` → Boolean to hide arc (ForTime without cap)

**SVG Implementation:**

- **Track (background):** Gray circle (text-muted/40)
- **Progress Arc:** Colored arc based on progress value
- **Rotation:** -90deg to start at top (12 o'clock position)
- **Stroke:** Square caps for industrial gym feel
- **Animation:** CSS transitions for smooth progress updates

### AMRAP View Breakdown

**File:** `src/components/timers/WorkoutAmrapView.vue:60`

```
┌─────────────────────────────────────────┐
│  [←] AMRAP              [Skip] [End]    │
│      Block 2 of 4                       │
├─────────────────────────────────────────┤
│                                         │
│                                         │
│            ╭─────────────╮              │
│           ╱   AMRAP     ╲              │
│          │               │             │
│          │    AMRAP      │ ← Label     │
│          │               │             │
│          │    03:24      │ ← Time (5rem)│
│          │               │   (red if ≤10s)│
│          │               │             │
│          │   2 ROUNDS    │ ← Rounds (4xl)│
│          │               │             │
│          │    Squats     │ ← Exercise   │
│           ╲             ╱              │
│            ╰─────────────╯              │
│          ◀━━━━━━●────────▶ ← Progress   │
│                                         │
│           [ +1 ]                        │ ← Round increment
│       (h-14 w-20 text-2xl)              │   (disabled when paused)
│                                         │
└─────────────────────────────────────────┘
```

**Inside CircularTimer (slot content):**

```vue
<!-- Label -->
<div class="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-1">
  AMRAP
</div>

<!-- MASSIVE time display -->
<span
  class="text-[5rem] leading-none font-mono tabular-nums font-black
             tracking-tight transition-colors"
  :class="isUrgent && 'text-destructive animate-pulse'"
>
  {{ formattedRemaining }}  <!-- 03:24 -->
</span>

<!-- Round counter -->
<div class="mt-2 flex items-center gap-3">
  <span class="text-4xl font-black tabular-nums text-[color]">
    {{ rounds }}  <!-- 2 -->
  </span>
  <span class="text-lg text-muted-foreground font-bold uppercase">
    ROUNDS
  </span>
</div>

<!-- Current Exercise -->
<div class="mt-1 text-center max-w-[220px]">
  <p class="text-base font-semibold text-foreground/80 truncate">
    {{ currentExercise.name }}  <!-- Squats -->
  </p>
</div>
```

**External to CircularTimer:**

```vue
<!-- +1 Button -->
<Button
  size="lg"
  variant="outline"
  class="h-14 w-20 text-2xl font-black border-2"
  :class="blockColors.text"
  :disabled="!timer.isRunning.value"
  @click="handleIncrementRound"
>
  +1
</Button>
```

**Color Coding:**

- Each block type has unique colors from `BLOCK_COLORS`:
  - AMRAP: Orange/amber tones
  - EMOM: Blue tones
  - Tabata: Green/emerald (work) + amber (rest)
  - ForTime: Purple tones

**State:**

- `isUrgent` triggers when `remainingSeconds ≤ 10`
- Urgent state: red text + pulse animation
- +1 button disabled when timer paused

### EMOM View Differences

```
┌─────────────────────────────────────────┐
│            ╭─────────────╮              │
│           ╱     EMOM    ╲              │
│          │               │             │
│          │     EMOM      │ ← Label     │
│          │               │             │
│          │    3 / 10     │ ← Minute    │
│          │               │   (current/total)│
│          │               │             │
│          │      42       │ ← Seconds   │
│          │               │   (7rem font!)│
│          │               │   (in minute)│
│          │               │             │
│          │   Push-ups    │ ← Exercise   │
│          │   (20 reps)   │   + prescribed│
│           ╲             ╱              │
│            ╰─────────────╯              │
│          ◀━━━━━●────────▶ ← Progress (in min)│
└─────────────────────────────────────────┘
```

**Key Differences:**

- No +1 button (auto-advances at 60s)
- Shows current minute (3/10) instead of rounds
- Displays remaining seconds in CURRENT minute (7rem font)
- Progress arc based on seconds within minute (0-60 → 0-100%)
- Urgent when ≤ 5s remaining in minute

### Tabata View Differences

```
┌─────────────────────────────────────────┐
│            ╭─────────────╮              │
│           ╱   TABATA    ╲              │
│          │               │             │
│   ┌──────┐               │             │
│   │ WORK │ TABATA        │ ← Phase badge│
│   └──────┘               │   (emerald bg)│
│          │               │             │
│          │      17       │ ← Seconds   │
│          │               │   (in phase) │
│          │               │             │
│          │   Round 2/8   │ ← Round     │
│          │               │             │
│          │   Burpees     │ ← Exercise   │
│           ╲             ╱              │
│            ╰─────────────╯              │
│          ◀━━━━━●────────▶ ← Progress (in phase)│
└─────────────────────────────────────────┘

OR (during rest phase):

┌─────────────────────────────────────────┐
│   ┌──────┐                              │
│   │ REST │              ← Amber badge   │
│   └──────┘                              │
│          │      08       │              │
│          │               │              │
│         ...              ...             │
└─────────────────────────────────────────┘
```

**Key Differences:**

- Phase badge: "WORK" (emerald) or "REST" (amber)
- Phase-aware colors for circle border and background
- Displays remaining seconds in CURRENT phase
- Auto-alternates work/rest based on config
- Urgent when ≤ 3s remaining in phase
- Audio cues on phase changes via useTimerAudio
- Progress arc resets each phase (0-100% within phase)

### ForTime View Differences

```
┌─────────────────────────────────────────┐
│            ╭─────────────╮              │
│           ╱  FOR TIME   ╲              │
│          │               │             │
│          │   FOR TIME    │ ← Label     │
│          │               │             │
│          │    05:32      │ ← Elapsed   │
│          │               │   (MM:SS)   │
│          │               │             │
│          │  Cap: 10:00   │ ← Time cap  │
│          │               │   (if set)  │
│          │               │             │
│          │   Deadlifts   │ ← Exercise   │
│          │   (10 reps)   │   + prescribed│
│           ╲             ╱              │
│            ╰─────────────╯              │
│          ◀━━━━━●────────▶ ← Progress    │
│                              (if capped)│
└─────────────────────────────────────────┘

OR (no cap):

┌─────────────────────────────────────────┐
│            ╭─────────────╮              │
│                                         │  ← No progress arc
│          │    05:32      │              │  (showProgress=false)
│          │               │              │
│         ...              ...             │
└─────────────────────────────────────────┘
```

**Key Differences:**

- Shows elapsed time (counting UP, not down)
- Optional time cap indicator
- If capped: Shows progress arc (elapsed/cap × 100)
- If uncapped: Hides progress arc (`showProgress={false}`)
- No +1 button or round counter
- Format: MM:SS (can go beyond 60 minutes)

### Real-Time PR Comparison (Planned Feature)

**Note:** The example shows PR comparison, but this is not yet implemented in the current codebase. Planned implementation:

```
┌─────────────────────────────────────────┐
│                                         │
│   PR: 01:05  (+0:07 behind)             │ ← Comparison
│                                         │   (green if ahead,
│   Current pace: 02:30 / round          │    red if behind)
└─────────────────────────────────────────┘
```

**Planned Features:**

- Load previous workout data for same block
- Calculate pace/time differential
- Display real-time comparison
- Color-coded feedback (green ahead, red behind)

### Exercise Progression UI

**Timeline visualization** (shown in example but not in current UI):

```
Round 1 of 4
○───●───○───○───○───○───○  ← Progress dots
    ▲
  Squats  ← Current exercise
```

**Current Implementation:**

- Simple text: "3/10" (minute), "2 Rounds", "Round 2/8"
- No visual timeline dots
- Current exercise name displayed prominently

**Potential Enhancement:**

```vue
<!-- Exercise timeline dots -->
<div class="flex items-center gap-2 mb-4">
  <div v-for="(ex, i) in exercises" :key="i"
       :class="i === currentIndex ? 'bg-primary' : 'bg-muted'"
       class="w-3 h-3 rounded-full transition-colors">
  </div>
</div>
```

### Footer Controls

**Strength Block Footer:**

```
┌─────────────────────────────────────────┐
│  [◄ Prev]   [Complete Set]   [Next ►]  │
│                                         │
│  Rest Timer: 01:23 (after set complete)│
└─────────────────────────────────────────┘
```

**Timed Block Footer:**

```
┌─────────────────────────────────────────┐
│           [▶ / ❚❚]  [Complete Block]    │
│                                         │
│  Timer: 03:24  •  AMRAP                 │
└─────────────────────────────────────────┘
```

**Component:** `WorkoutActiveModeFooter.vue:1`

**Props:**

```typescript
{
  block: Block
  timer?: TimerDisplayData  // { isRunning, display, label }
  canComplete: boolean
  isFirstBlock: boolean
  isLastBlock: boolean
  restTimer: ReturnType<typeof useRestTimer>
}
```

**Conditional Rendering:**

- Strength: Shows prev/next/complete set buttons
- Timed: Shows toggle timer + complete block buttons
- Rest timer appears after set completion (auto-starts)
- Prev button hidden on first block
- Next button hidden on last block

---

## Summary

This document provides a comprehensive reference for all pages, components, and composables in the Workout Tracker application. Key takeaways:

### Architecture Patterns

- **Views (11):** Route-level pages orchestrating features
- **Features (5):** Self-contained domain modules (workout, templates, timers, exercises, settings)
- **Shared (15):** Reusable components and composables
- **Dependency Rules:** Views → Features → Shared (enforced by ESLint)

### Component Reusability

- **PageLayout:** Standard wrapper for most views (8+ uses)
- **WorkoutCircularTimer:** Core timer UI for all timed blocks
- **ExerciseListItem:** Reused across exercise selection contexts
- **MobileDialogContent:** Responsive dialog wrapper for all modals

### State Management

- **Workout State:** Singleton ref in useWorkout composable
- **Timer State Machines:** useBaseTimer extended by specific timer types
- **Local State:** Composables (useExerciseSearch, useWeightDisplay, etc.)
- **Persistent State:** Pinia stores (exercises, settings)

### Key Technologies

- **Vue 3.5+:** Reactive props destructuring, defineModel, useTemplateRef
- **shadcn-vue:** UI primitives (DO NOT EDIT src/components/ui/)
- **Dexie:** IndexedDB with repository pattern
- **i18n:** Multi-language support (en, de)
- **PWA:** Service worker updates, wake lock

### Testing

- **Playwright Browser Mode:** All tests run in real browser
- **fake-indexeddb:** Database isolation per test
- **Test Helpers:** withSetup, createTestApp, factories

For implementation details, refer to the source files listed throughout this document.
