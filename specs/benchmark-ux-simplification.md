# Benchmark UX Simplification - Update Spec

## Overview

Simplify benchmark creation by removing the type selector and standardizing on ForTime-only benchmarks with the variable rounds system.

**Context**: Follows implementation of `variable-reps-benchmark.md`. This spec removes redundant type selection since variable rounds make the old "Runden" type obsolete.

---

## Problem Statement

With variable reps per round implemented, the type selector ("Auf Zeit" vs "Runden") creates confusion:

1. **ForTime with variable rounds** already supports any workout structure
2. **"Runden" type** was for "repeat same circuit N times" - now achieved by copying rounds
3. **AMRAP/EMOM** are workout execution styles, not benchmark tracking needs
4. Users don't need to understand type differences - they just want to define exercises and track times

---

## User Stories

### US-1: Simplified Benchmark Creation
**As a** user creating a benchmark
**I want to** skip type selection and go straight to defining rounds
**So that** I can create benchmarks faster with less cognitive load

### US-2: Clear Round Navigation
**As a** user viewing or editing a multi-round benchmark
**I want to** see which round I'm on via visual tabs
**So that** I can quickly navigate between rounds

---

## Functional Requirements

### FR-1: Remove Type Selector

#### What to Remove
- Type selector UI ("Auf Zeit" / "Runden" cards)
- `type` field from benchmark form state (always 'fortime')
- AMRAP/EMOM type options (not needed for benchmarks)

#### What to Keep
- `type: 'fortime'` in database schema (for forward compatibility)
- All variable rounds functionality from previous spec

#### Data Model
```typescript
// Schema stays the same, but type is always 'fortime'
type DbBenchmark = {
  id: string
  name: string
  type: 'fortime'  // Always fortime, no other options
  rounds: Array<DbBenchmarkRound>
  structureHash: string
  createdAt: number
  lastUsedAt: number | null
}
```

### FR-2: Tabbed Round Navigation

#### View Mode
- Display numbered pill tabs: `[ 1 ] [ 2 ] [ 3 ] [ 4 ]`
- Active tab highlighted (primary color)
- Clicking tab shows that round's exercises
- Show "Runde X" header below tabs with exercise list

#### Edit Mode
- Same tabbed interface as view mode
- Active round is editable
- Round menu (`...`) available on active round header
- Tab bar updates when rounds added/removed

#### Tab Behavior
- Tabs scroll horizontally if more than ~5 rounds
- New round (from copy) auto-selects the new tab
- Deleting active round selects previous round (or first if deleting Round 1)

### FR-3: Simplified Creation Flow

#### Initial State
- New benchmark starts with 1 empty round
- No type selection step
- User immediately sees:
  ```
  Name: [                    ]

  [ 1 ]                        ← Single tab, active

  Runde 1/1                [⋮]

  [ + Übung hinzufügen ]
  ```

#### Adding Rounds
- Only via "Copy Round" in round menu
- Copy always appends to end
- After copy: tabs update, new tab auto-selected

### FR-4: View Mode Display

```
┌─────────────────────────────────────────┐
│ ←  Murph Pyramid              [Bearbeiten]
│                                         │
│   [ 1 ]  [ 2 ]  [ 3 ]  [ 4 ]           │
│                                         │
│   Runde 2                               │
│   ┌─────────────────────────────────┐   │
│   │ 🏋️  Burpees           30 Wdh.  │   │
│   │ 🏋️  Pull-ups          20 Wdh.  │   │
│   │ 🏋️  Squats            25 Wdh.  │   │
│   └─────────────────────────────────┘   │
│                                         │
│   Letzte Ergebnisse                     │
│   • 12:45 - vor 3 Tagen                 │
│   • 13:20 - vor 1 Woche                 │
│                                         │
│         [ Workout starten ]             │
└─────────────────────────────────────────┘
```

### FR-5: Edit Mode Display

```
┌─────────────────────────────────────────┐
│ ←  Benchmark Erstellen    [Verwerfen] [Speichern]
│                                         │
│ Trainingsname                           │
│ [Murph Pyramid                    ]     │
│                                         │
│   [ 1 ]  [ 2 ]  [ 3 ]  [+4]            │
│                         ↑ newly added   │
│                                         │
│   Runde 2/4                      [ ⋮ ]  │
│   ┌─────────────────────────────────┐   │
│   │ ⋮⋮ 🏋️  Burpees        30    ✕  │   │
│   │ ⋮⋮ 🏋️  Pull-ups       20    ✕  │   │
│   └─────────────────────────────────┘   │
│                                         │
│   ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┐   │
│   │    + Übung hinzufügen          │   │
│   └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─┘   │
└─────────────────────────────────────────┘
```

---

## UI Components

### RoundTabs Component
```vue
<template>
  <div class="flex gap-2 overflow-x-auto pb-2">
    <button
      v-for="(round, index) in rounds"
      :key="round.orderKey"
      :class="[
        'min-w-10 h-10 rounded-full font-medium transition-colors',
        activeIndex === index
          ? 'bg-primary text-primary-foreground'
          : 'bg-muted text-muted-foreground hover:bg-muted/80'
      ]"
      @click="$emit('select', index)"
    >
      {{ index + 1 }}
    </button>
  </div>
</template>
```

### Round Header (Edit Mode)
```vue
<div class="flex items-center justify-between">
  <span class="text-lg font-medium">
    {{ t('workouts.benchmarks.roundOf', { current: activeIndex + 1, total: rounds.length }) }}
  </span>
  <DropdownMenu>
    <DropdownMenuTrigger>
      <Button variant="ghost" size="icon">
        <MoreHorizontal class="h-4 w-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem @click="copyRound">
        <Copy class="mr-2 h-4 w-4" />
        {{ t('workouts.benchmarks.copyRound') }}
      </DropdownMenuItem>
      <DropdownMenuItem
        @click="deleteRound"
        :disabled="rounds.length <= 1"
      >
        <Trash class="mr-2 h-4 w-4" />
        {{ t('workouts.benchmarks.deleteRound') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>
```

---

## Acceptance Criteria

### Type Selector Removal
| ID | Criteria |
|----|----------|
| AC-1.1 | Type selector cards not visible in create/edit mode |
| AC-1.2 | New benchmarks created with `type: 'fortime'` |
| AC-1.3 | Existing ForTime benchmarks work unchanged |

### Tabbed Navigation
| ID | Criteria |
|----|----------|
| AC-2.1 | Numbered pill tabs shown for rounds |
| AC-2.2 | Active tab visually highlighted |
| AC-2.3 | Clicking tab switches displayed round |
| AC-2.4 | Tabs scroll horizontally with many rounds |
| AC-2.5 | Same tab UI in both view and edit mode |

### Creation Flow
| ID | Criteria |
|----|----------|
| AC-3.1 | New benchmark starts with 1 empty round |
| AC-3.2 | No type selection required |
| AC-3.3 | "Copy Round" adds new tab at end |
| AC-3.4 | New tab auto-selected after copy |

### View Mode
| ID | Criteria |
|----|----------|
| AC-4.1 | Tabs show round numbers |
| AC-4.2 | Selected round displays exercise list |
| AC-4.3 | "Runde X" header shows current round |

---

## Migration

**No migration needed** - app not published. Delete existing benchmark data and start fresh with new schema.

```typescript
// In database initialization or migration
await database.benchmarks.clear()
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/features/benchmarks/components/BenchmarkEditMode.vue` | Remove type selector, add RoundTabs |
| `src/features/benchmarks/components/BenchmarkViewMode.vue` | Add RoundTabs, tabbed exercise display |
| `src/features/benchmarks/components/RoundTabs.vue` | New component for pill tabs |
| `src/features/benchmarks/composables/useBenchmarkForm.ts` | Remove type from form state, default to 'fortime' |
| `src/db/schema.ts` | Remove AMRAP/EMOM from BenchmarkType |
| `src/i18n/messages/*/workouts.ts` | Add `roundOf` translation |

---

## i18n Keys

```yaml
# English
workouts:
  benchmarks:
    roundOf: "Round {current}/{total}"
    copyRound: "Copy Round"
    deleteRound: "Delete Round"

# German
workouts:
  benchmarks:
    roundOf: "Runde {current}/{total}"
    copyRound: "Runde kopieren"
    deleteRound: "Runde löschen"
```

---

## Out of Scope

- AMRAP benchmark type (use regular AMRAP workout blocks instead)
- EMOM benchmark type (use regular EMOM workout blocks instead)
- "Apply to all rounds" shortcut for simple benchmarks
- Round count input upfront

---

## Definition of Done

- [ ] Type selector removed from UI
- [ ] RoundTabs component implemented
- [ ] View mode uses tabbed display
- [ ] Edit mode uses tabbed display
- [ ] New benchmarks start with 1 round
- [ ] Copy round appends and auto-selects
- [ ] All acceptance criteria pass
- [ ] i18n strings added (EN/DE)
- [ ] No TypeScript errors
