# Research: Making Exercise Icons More Distinguishable

**Date:** 2025-12-20
**Status:** Complete

## Problem Statement

The workout tracker currently uses equipment-based icons for all exercises. This means:
- All 50+ bodyweight exercises show the same `MdiHumanHandsup` icon
- All barbell exercises (Bench Press, Squat, Deadlift, etc.) show `MdiWeightLifter`
- All kettlebell exercises show `MdiKettlebell`

This makes exercises hard to distinguish visually in lists, especially when filtering by muscle group or browsing all exercises.

## Key Findings

### 1. Current Icon System

The project uses Material Design Icons (MDI) via `unplugin-icons`:
- **Location**: `src/lib/equipmentIcons.ts`
- **Pattern**: `<component :is="getEquipmentIcon(exercise.equipment)" />`

Current mappings (10 equipment types + 7 cardio activities):
| Equipment | Icon |
|-----------|------|
| barbell | MdiWeightLifter |
| dumbbell | MdiDumbbell |
| kettlebell | MdiKettlebell |
| machine | MdiCog |
| cable | MdiCableData |
| bodyweight | MdiHumanHandsup |
| band | MdiResistor |
| ez-bar | MdiBarbell |
| hex-bar | MdiHexagonOutline |
| club | MdiGolf |

### 2. UX Research on Visual Differentiation

From Nielsen Norman Group research:
- **Color + Icon combination is most effective** - users are 37% faster at finding items
- Icon with strong "information scent" performs better than color alone
- Flat design can reduce differences between icons, making quick visual selection difficult

### 3. Available Strategies

#### Strategy A: Movement Pattern Icons (Recommended)

Map exercises by movement pattern instead of equipment. This better reflects what users care about:

| Pattern | Exercises | Suggested Icon |
|---------|-----------|----------------|
| Push (Horizontal) | Bench Press, Push-ups, Chest Fly | `mdi:arrow-right-bold` or custom |
| Push (Vertical) | Overhead Press, Pike Push-ups | `mdi:arrow-up-bold` |
| Pull (Horizontal) | Rows, Cable Pull | `mdi:arrow-left-bold` |
| Pull (Vertical) | Pull-ups, Lat Pulldown | `mdi:arrow-down-bold` |
| Squat | Squats, Leg Press, Lunges | `mdi:human-male-height` |
| Hinge | Deadlifts, KB Swings, Good Mornings | `mdi:angle-acute` |
| Carry | Farmer's Walk, Suitcase Carry | `mdi:walk` |
| Rotation | Russian Twists, Woodchops | `mdi:rotate-right` |
| Plank/Stability | Planks, Bird Dog, Dead Bug | `mdi:human-handsup` |

#### Strategy B: Muscle Group + Equipment Combo Icons

Combine muscle group color with equipment icon:

```vue
<div class="flex items-center gap-1">
  <span :class="muscleColor[exercise.muscle]" class="size-2 rounded-full" />
  <component :is="getEquipmentIcon(exercise.equipment)" class="size-5" />
</div>
```

Color mapping:
- Chest: `bg-red-500`
- Back: `bg-blue-500`
- Legs: `bg-green-500`
- Shoulders: `bg-yellow-500`
- Arms: `bg-purple-500`
- Core: `bg-orange-500`

#### Strategy C: Custom Exercise Icons (High Effort)

Create or source individual icons for common exercises:
- Bench Press: Person lying on bench pressing bar
- Squat: Person in squat position
- Pull-up: Person hanging from bar

**Resources:**
- Reshot: 291 free fitness SVGs
- SVG Repo: 50+ gym vectors
- Flaticon: 63,324 gym icons
- IconScout: High-quality fitness icons

#### Strategy D: Exercise Type Badges

Add visual badges based on exercise type:

| Type | Badge |
|------|-------|
| compound | `mdi:hexagon` (multiple muscles) |
| isolation | `mdi:circle` (single muscle) |
| stability | `mdi:human-handsup-outline` |
| cardio | `mdi:lightning-bolt` |

### 4. Available MDI Fitness Icons

MDI has several underutilized fitness icons that could improve variety:

```typescript
// Additional MDI icons for exercises
import MdiArmFlex from '~icons/mdi/arm-flex'        // Arms
import MdiHumanMale from '~icons/mdi/human-male'    // Generic person
import MdiYoga from '~icons/mdi/yoga'               // Flexibility/core
import MdiRunFast from '~icons/mdi/run-fast'        // Cardio variants
import MdiJumpRope from '~icons/mdi/jump-rope'      // Jump exercises
import MdiWeightPound from '~icons/mdi/weight-pound' // Weight exercises
import MdiHandPointingUp from '~icons/mdi/hand-pointing-up' // Push movements
```

## Codebase Patterns

### Files to Modify

1. **`src/lib/equipmentIcons.ts`** - Add new icon mappings
2. **`src/data/popularExercises.ts`** - Add optional `pattern` or `iconKey` field
3. **`src/types/exercises.ts`** - Update types if needed
4. **Components using icons:**
   - `src/components/ExerciseListItem.vue`
   - `src/components/blocks/TimedBlockExerciseList.vue`
   - `src/features/workout/components/WorkoutQueueItem.vue`
   - `src/features/templates/components/TemplateBlockItem.vue`
   - `src/features/benchmarks/components/BenchmarkExerciseItem.vue`

### Current Icon Usage Pattern

```vue
<component :is="getEquipmentIcon(exercise.equipment)" class="size-6" />
```

## Recommended Approach

### Phase 1: Add Movement Pattern Classification

Add a `pattern` field to exercises that maps to movement-based icons:

```typescript
// src/types/exercises.ts
export type MovementPattern =
  | 'push-horizontal' | 'push-vertical'
  | 'pull-horizontal' | 'pull-vertical'
  | 'squat' | 'hinge' | 'carry'
  | 'rotation' | 'stability' | 'cardio'

// Update PopularExercise to include pattern
export type PopularExercise = {
  name: string
  equipment: Equipment
  muscle: Muscle
  type: ExerciseType
  metrics: Metrics
  pattern?: MovementPattern // Optional, fallback to equipment icon
}
```

### Phase 2: Create Pattern Icon Mapping

```typescript
// src/lib/equipmentIcons.ts
import MdiArrowRightBold from '~icons/mdi/arrow-right-bold'
import MdiArrowUpBold from '~icons/mdi/arrow-up-bold'
import MdiArrowLeftBold from '~icons/mdi/arrow-left-bold'
import MdiArrowDownBold from '~icons/mdi/arrow-down-bold'
// ... more imports

const PATTERN_ICONS: Record<MovementPattern, Component> = {
  'push-horizontal': MdiArrowRightBold,
  'push-vertical': MdiArrowUpBold,
  'pull-horizontal': MdiArrowLeftBold,
  'pull-vertical': MdiArrowDownBold,
  'squat': MdiHumanMaleHeight,
  'hinge': MdiAngleAcute,
  'carry': MdiWalk,
  'rotation': MdiRotateRight,
  'stability': MdiHumanHandsup,
  'cardio': MdiRunFast,
}

export function getExerciseIcon(exercise: { equipment: Equipment; pattern?: MovementPattern }): Component {
  if (exercise.pattern) {
    return PATTERN_ICONS[exercise.pattern]
  }
  return getEquipmentIcon(exercise.equipment)
}
```

### Phase 3: Add Color Indicator

Combine icon with muscle group color dot for maximum differentiation:

```vue
<template>
  <div class="flex items-center gap-1.5">
    <span
      :class="muscleColors[exercise.muscle]"
      class="size-2 rounded-full shrink-0"
    />
    <component :is="getExerciseIcon(exercise)" class="size-5" />
  </div>
</template>

<script setup>
const muscleColors = {
  chest: 'bg-red-400',
  back: 'bg-blue-400',
  legs: 'bg-green-400',
  shoulders: 'bg-amber-400',
  arms: 'bg-purple-400',
  core: 'bg-orange-400',
}
</script>
```

### Migration Priority

1. **High-impact exercises first** - Big 5 (Bench, Squat, Deadlift, OHP, Row)
2. **Bodyweight exercises** - These are the most numerous and most repetitive
3. **Kettlebell exercises** - Second most numerous category
4. **Remaining equipment types** - Already reasonably distinct

## Sources

**UX Research:**
- [Visual Indicators to Differentiate Items - Nielsen Norman Group](https://www.nngroup.com/articles/visual-indicators-differentiators/)

**Icon Resources:**
- [Reshot Free Fitness SVG Icons](https://www.reshot.com/free-svg-icons/fitness/) - 291 icons
- [SVG Repo - Gym Icons](https://www.svgrepo.com/vectors/gym/) - 50+ vectors
- [Flaticon Gym Icons](https://www.flaticon.com/free-icons/gym) - 63,324 icons
- [Icons8 Fitness Icons](https://icons8.com/icons/set/fitness)
- [Iconscout Fitness Icons](https://iconscout.com/icons/fitness)

**MDI Icon Reference:**
- [Material Design Icons](https://pictogrammers.com/library/mdi/) - Full library search
- [unplugin-icons](https://github.com/unplugin/unplugin-icons) - Already installed
