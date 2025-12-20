# Research: Replacing Exercise Emojis with Professional Icons

**Date:** 2025-12-20
**Status:** Complete

## Problem Statement

The workout tracker currently uses emoji characters for exercise icons (e.g., '🏋️' for barbell, '💪' for shoulders). This approach has several issues:
- Many exercises share duplicate emojis
- Some emoji choices are questionable (dumbbell='🪑' which is a chair)
- No consistency in visual style
- Limited fitness-specific options
- Emojis render differently across platforms

## Key Findings

### 1. Lucide Already Installed

The project already has `lucide-vue-next@0.556.0` installed and actively used for UI icons (settings, timers, navigation). This provides a natural extension point for exercise icons with 1,600+ icons available.

### 2. Best Solution: unplugin-icons

For comprehensive fitness icon coverage, `unplugin-icons` offers the best approach:
- **200,000+ icons** from 150+ icon sets (including Material Design Icons with excellent fitness coverage)
- **Zero runtime overhead** - icons compiled at build time
- **Tree-shakeable** - only bundles icons used
- **Works with existing Vite + Vue 3 + TypeScript setup**
- Compatible with existing Lucide icons

**Installation:**
```bash
pnpm add -D unplugin-icons @iconify/json
```

**Vite Configuration:**
```typescript
// vite.config.ts
import Icons from 'unplugin-icons/vite'
import IconsResolver from 'unplugin-icons/resolver'
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    Icons({ compiler: 'vue3', autoInstall: true }),
    Components({ resolvers: [IconsResolver()] }),
  ],
})
```

### 3. Recommended Icon Mappings

Using Material Design Icons (available via unplugin-icons):

**Equipment:**
| Equipment | Icon Name |
|-----------|-----------|
| barbell | `mdi:weight-lifter` |
| dumbbell | `mdi:dumbbell` |
| kettlebell | `mdi:kettlebell` |
| machine | `mdi:cog` |
| cable | `mdi:cable` |
| bodyweight | `mdi:human` |
| band | `mdi:elastic` |

**Muscles/Activities:**
| Muscle | Icon Name |
|--------|-----------|
| chest | `mdi:human-male` |
| back | `mdi:human-male-back` |
| legs | `mdi:run` |
| shoulders | `mdi:arm-flex` |
| core | `mdi:yoga` |

**Cardio:**
| Activity | Icon Name |
|----------|-----------|
| running | `mdi:run` |
| cycling | `mdi:bike` |
| rowing | `mdi:rowing` |
| swimming | `mdi:swim` |

### 4. AI-Generated Icons (Not Recommended)

AI tools like DALL-E 3 and Midjourney can generate custom icons but are overkill for standard fitness icons:
- Existing icon libraries have comprehensive fitness coverage
- AI generation requires prompt engineering and manual curation
- Higher cost and complexity for marginal benefit

**When AI might be useful:** Custom icons for unusual exercises (Bulgarian split squats, Nordic curls) not in standard libraries.

### 5. Performance Considerations for PWA

| Method | Performance | Caching | Best For |
|--------|------------|---------|----------|
| Inline SVG | Fastest render | No cache | <20 icons per page |
| SVG Sprite | Very fast | Cacheable | 20-100 icons |
| unplugin-icons | Fastest (build-time) | N/A | Any size |
| Icon Fonts | Slowest (FOIT risk) | Cacheable | Legacy support |

unplugin-icons provides the best performance because icons are compiled at build time with zero runtime overhead.

## Codebase Patterns

### Current Emoji Locations

1. **`src/features/exercises/data/exerciseOptions.ts`** - Equipment, muscle, and cardio icons
2. **`src/data/popularExercises.ts`** - 95+ preset exercises with emojis
3. **`src/db/schema.ts`** - `DbCustomExercise.icon: string`
4. **`src/types/exercises.ts`** - `CustomExercise.icon: string`
5. **`src/types/blocks.ts`** - `BlockExercise.thumbnail: string`

### Existing Icon System

Design tokens already established in `src/style.css`:
```css
--size-icon-sm: 1rem;   /* 16px */
--size-icon-md: 1.25rem; /* 20px */
--size-icon-lg: 1.5rem;  /* 24px */
```

Utility classes: `icon-sm`, `icon-md`, `icon-lg`

### Display Components to Update

1. `src/features/exercises/components/ExerciseSelectorDialog.vue` - Shows `{{ option.icon }}`
2. `src/features/workout/components/WorkoutBlockPlaylistItem.vue` - Shows thumbnail
3. `src/features/exercises/components/ExerciseCard.vue` - Exercise display

## Recommended Approach

### Migration Strategy

**Phase 1: Add unplugin-icons infrastructure**
1. Install `unplugin-icons` and `@iconify/json`
2. Configure in `vite.config.ts`
3. Create `ExerciseIcon.vue` component

**Phase 2: Create icon mapping**
1. Create `src/features/exercises/utils/iconMapping.ts`
2. Map exercise types/equipment/muscles to icon names
3. Keep `icon: string` field for backward compatibility

**Phase 3: Update display components**
1. Replace `{{ icon }}` with `<ExerciseIcon :name="icon" />`
2. Update `ExerciseSelectorDialog.vue`
3. Update `WorkoutBlockPlaylistItem.vue`

**Phase 4: Migrate data**
1. Update `exerciseOptions.ts` with icon names
2. Update `popularExercises.ts` (can be done incrementally)
3. Add data migration for custom exercises in IndexedDB

### Example Implementation

```vue
<!-- src/features/exercises/components/ExerciseIcon.vue -->
<script setup lang="ts">
import { computed, defineAsyncComponent } from 'vue'

const props = defineProps<{
  name: string
  size?: 'sm' | 'md' | 'lg'
}>()

const sizeClass = computed(() => `icon-${props.size ?? 'md'}`)

// Dynamic import based on icon name
const IconComponent = computed(() => {
  const [set, icon] = props.name.split(':')
  return defineAsyncComponent(() =>
    import(`~icons/${set}/${icon}`)
  )
})
</script>

<template>
  <component :is="IconComponent" :class="sizeClass" />
</template>
```

```typescript
// src/features/exercises/utils/iconMapping.ts
export const EQUIPMENT_ICONS: Record<Equipment, string> = {
  barbell: 'mdi:weight-lifter',
  dumbbell: 'mdi:dumbbell',
  kettlebell: 'mdi:kettlebell',
  machine: 'mdi:cog',
  cable: 'mdi:cable',
  bodyweight: 'mdi:human',
  band: 'mdi:elastic',
  'ez-bar': 'mdi:barbell',
  'hex-bar': 'mdi:hexagon',
}
```

### Alternative: Extend Lucide Only

If the project prefers staying with Lucide only (simpler):
- Use existing `lucide-vue-next` icons
- Limited fitness icons but consistent with current setup
- No additional dependencies

```typescript
import { Dumbbell, Activity, User, Settings } from 'lucide-vue-next'
```

## Sources

**Vue Icon Libraries:**
- [Top 7 Vue.js Icon Libraries 2025](https://hugeicons.com/blog/vuejs/top-vue-js-icon-libraries)
- [Best icon libraries for Vue.js - LogRocket](https://blog.logrocket.com/best-icon-libraries-vue-js/)

**unplugin-icons:**
- [GitHub - unplugin/unplugin-icons](https://github.com/unplugin/unplugin-icons)
- [Iconify Documentation](https://iconify.design/docs/usage/svg/unplugin/)

**Fitness Icon Resources:**
- [Flaticon - 29,709 Workout Icons](https://www.flaticon.com/free-icons/workout)
- [Reshot - Free Fitness SVG Icons](https://www.reshot.com/free-svg-icons/fitness/)
- [IconScout - Gym & Fitness](https://iconscout.com/categories/gym-fitness/icons)

**Performance:**
- [SVG Icon Stress Test - Cloud Four](https://cloudfour.com/thinks/svg-icon-stress-test/)
- [Icon Fonts vs SVGs - KeyCDN](https://www.keycdn.com/blog/icon-fonts-vs-svgs)

**AI Icon Generation:**
- [DALL-E 3 vs Midjourney 2025](https://vertu.com/lifestyle/midjourney-vs-dall-e-3-the-ultimate-ai-image-generation-showdown-for-2025/)
- [Icon Generator AI](https://icongeneratorai.com/)
