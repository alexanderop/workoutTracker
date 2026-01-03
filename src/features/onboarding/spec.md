# Onboarding Feature Specification

## Overview

A multi-step onboarding flow for first-time users that combines feature education with the app's visual identity. Inspired by the Tilly app's onboarding UX pattern.

## Goals

- **Primary**: Hybrid approach - educate users about key features while maintaining brand consistency
- **Secondary**: Reduce time-to-first-value by highlighting templates, quick workouts, and benchmarks

## User Flow

### Entry Point

- **Router guard** checks `onboardingCompleted` flag in Dexie on every navigation
- First-time users are redirected to `/onboarding`
- Users who completed onboarding skip directly to requested route
- **Returning user detection**: Guard checks for existing data (workouts, templates, or benchmarks) to show "Welcome back" variant

### Slides (5-6 depending on PWA state)

```
1. Welcome (or "Welcome back" if existing data detected)
2. PWA Installation (SKIPPED if already installed as PWA)
3. Quick Workout
4. Templates
5. Benchmarks
6. Checklist (final)
```

#### Slide 1: Welcome

- App logo (existing PWA icon)
- App name: "Workout Tracker"
- Two CTA buttons:
  - **"Start Tour"** (primary, filled) - advances to slide 2
  - **"Skip to App"** (secondary, outline) - marks complete, navigates to home
- **Welcome Back Variant** (shown if any existing data detected):
  - Heading: "Welcome back!"
  - Same layout with buttons: **"Resume Tour"** / **"Skip to App"**

#### Slide 2: PWA Installation

- **Dynamically skipped** if user is already running as installed PWA
- Detection via `matchMedia('display-mode: standalone')`
- Icon + title + generic installation instructions
- Works across iOS, Android, and Desktop
- If skipped, carousel has 5 slides instead of 6

#### Slide 3: Quick Workout

- Title: "Build workouts on the fly"
- **Live preview**: 2-3 `OnboardingBlockPreview` components with sample data
  - Strength block example
  - AMRAP block example
- Non-interactive (static display only)

#### Slide 4: Templates

- Title: "Save your favorites"
- **Live preview**: 2-3 `OnboardingTemplatePreview` components
  - "Push Day", "Leg Day", "Full Body" examples
- Non-interactive

#### Slide 5: Benchmarks

- Title: "Track your progress"
- **Live preview**: 2-3 `OnboardingBenchmarkPreview` components
  - "Fran", "Cindy", "Murph" examples
- Non-interactive

#### Slide 6: Checklist

- Title: "You're ready!"
- **Clickable checklist** of next steps with deep-links:
  - [ ] Create your first template → routes to `TemplatesCreate`
  - [ ] Browse the exercise library → routes to `Exercises`
  - [ ] Start a quick workout → routes to `WorkoutCreate`
  - [ ] Try a benchmark → routes to `Benchmarks`
- Items use **route names** (type-safe, refactor-friendly)
- Clicking any item: marks onboarding complete, navigates immediately to destination
- **"Let's Go"** button completes onboarding and navigates to home

### Navigation

- **Progress dots** at bottom showing current position (must be implemented manually - see Technical Notes)
- **Back button**: Hidden on slide 1, visible on all other slides
- **Next button**: Changes to "Let's Go" on final slide
- **Skip button**: Always visible in header (including on final slide)
- **Keyboard**: Left/Right arrow keys navigate between slides
- **Swipe**: Full slide area swipeable on mobile (via Carousel)
- **No loop**: Stops at boundaries

## Technical Architecture

### File Structure

```
src/features/onboarding/
├── components/
│   ├── OnboardingCarousel.vue          # Main carousel wrapper
│   ├── OnboardingSlide.vue             # Generic slide layout
│   ├── WelcomeSlide.vue                # Slide 1
│   ├── PwaInstallSlide.vue             # Slide 2 (conditionally included)
│   ├── QuickWorkoutSlide.vue           # Slide 3
│   ├── TemplatesSlide.vue              # Slide 4
│   ├── BenchmarksSlide.vue             # Slide 5
│   ├── ChecklistSlide.vue              # Slide 6
│   └── previews/
│       ├── OnboardingBlockPreview.vue
│       ├── OnboardingTemplatePreview.vue
│       └── OnboardingBenchmarkPreview.vue
├── composables/
│   └── useOnboarding.ts                # State management + persistence
├── constants/
│   └── previewData.ts                  # Sample data for previews
├── views/
│   └── OnboardingView.vue              # Route component
└── spec.md                             # This file
```

### Dependencies

- **shadcn-vue Carousel** (needs installation: `npx shadcn-vue@latest add carousel`)
- Existing UI components: Card, Button, Progress

### State Management

```typescript
// useOnboarding.ts
interface OnboardingState {
  currentStep: number        // 0-indexed (0-5), persisted for resume
  completed: boolean         // true when finished or skipped
  isReturningUser: boolean   // true if existing data detected
  isPwaInstalled: boolean    // true if running as PWA
}

// Computed
totalSlides: number          // 5 if PWA installed, 6 otherwise
```

### Data Model

**Separate `onboarding` table** in Dexie (not extending settings):

```typescript
// db/schema.ts
interface OnboardingRecord {
  id: 'onboarding'           // Singleton pattern
  completed: boolean
  currentStep: number
}

// Add to database schema
onboarding: 'id'
```

### Preview Data Constants

```typescript
// constants/previewData.ts
export const sampleBlocks = [
  { kind: 'strength', name: 'Bench Press', sets: 4, reps: 8 },
  { kind: 'amrap', name: '10min AMRAP', duration: 600 },
]

export const sampleTemplates = [
  { name: 'Push Day', blockCount: 5 },
  { name: 'Leg Day', blockCount: 4 },
  { name: 'Full Body', blockCount: 6 },
]

export const sampleBenchmarks = [
  { name: 'Fran', type: 'forTime' },
  { name: 'Cindy', type: 'amrap' },
  { name: 'Murph', type: 'forTime' },
]
```

### Router Guard

```typescript
// In router/index.ts
router.beforeEach(async (to) => {
  if (to.name === 'Onboarding') {
    const { completed } = await getOnboardingState()
    if (completed) return { name: 'Home' }
    return true
  }

  try {
    const { completed } = await getOnboardingState()
    if (!completed) {
      // Check for existing data to set returning user flag
      const hasExistingData = await checkForExistingData()
      return {
        name: 'Onboarding',
        query: hasExistingData ? { returning: 'true' } : undefined
      }
    }
  } catch {
    // Fail-open: on DB error, assume complete and allow access to app
    return true
  }

  return true
})
```

### Route Definition

```typescript
{
  path: '/onboarding',
  name: 'Onboarding',
  component: () => import('@/features/onboarding/views/OnboardingView.vue'),
}
```

## Behaviors

### PWA Detection

- Use `matchMedia('display-mode: standalone')` to detect installation
- Assume browser mode initially, update if detection returns true
- If PWA detected, PWA slide is excluded from carousel (5 slides total)

### Skip Behavior

- **Silent skip**: No reminders, no badges, no prompts to complete later
- User can access all features immediately
- Onboarding state is marked as `completed: true`

### Resume Behavior

- If user navigates away mid-onboarding, their step is persisted (0-indexed)
- On return, carousel **instantly jumps** to saved position (no animation)
- No "would you like to continue?" prompt - just resumes

### Returning User Detection

- Router guard checks for any existing data (1+ workout, template, or benchmark)
- If data found, sets `returning=true` query param
- Welcome slide shows "Welcome back!" variant with "Resume Tour" / "Skip to App"

### Data Loss

- If browser data is cleared and `completed` flag is lost, show onboarding again
- If existing workouts/templates/benchmarks exist, show "Welcome back" variant

### Direct URL Access

- Navigating to `/onboarding` after completion redirects to home
- No read-only replay available

### DB Error Handling

- If Dexie read fails in router guard, **fail-open** (assume complete, allow app access)
- Avoids blocking users from their data due to rare DB issues

### Exit Destinations

- **Skip to App / Let's Go**: Navigate to Home (`/`)
- **Checklist items**: Navigate to respective feature route (using route names)
- All paths use same completion flow internally (mark `completed: true`)

## Localization

- All text fully localized via vue-i18n from v1
- Add keys under `onboarding.*` namespace:
  ```yaml
  onboarding:
    welcome:
      title: "Workout Tracker"
      startTour: "Start Tour"
      skipToApp: "Skip to App"
    welcomeBack:
      title: "Welcome back!"
      resumeTour: "Resume Tour"
    pwa:
      title: "Install for the best experience"
      instruction1: "..."
    quickWorkout:
      title: "Build workouts on the fly"
      description: "..."
    templates:
      title: "Save your favorites"
    benchmarks:
      title: "Track your progress"
    checklist:
      title: "You're ready!"
      createTemplate: "Create your first template"
      browseExercises: "Browse the exercise library"
      startWorkout: "Start a quick workout"
      tryBenchmark: "Try a benchmark"
    navigation:
      next: "Next"
      back: "Back"
      skip: "Skip"
      letsGo: "Let's Go"
  ```

## Visual Design

### Theme

- Uses current app theme (respects dark/light mode setting)
- No forced theme override during onboarding
- No theme toggle offered (user can change in settings after)

### Layout

- Full-screen view (no bottom navigation visible)
- Centered content with max-width container
- Consistent padding and spacing

### Animations

- Horizontal slide transitions (provided by Carousel component)
- Progress dots animate on step change

## Accessibility

- Keyboard navigation: Left/Right arrows, Tab + Enter
- Focus management: **Focus moves to slide heading** on navigation
- Screen reader: Announce current step and slide title via heading
- Arrow keys work globally (no conflict since preview components are static/non-focusable)

## Testing Strategy

### Integration Tests

Using Vitest browser mode with **database seeding**:

1. **Complete flow**: Start → navigate through all slides → finish → verify on home
2. **Skip flow**: Start → skip → verify completed flag and navigation
3. **Resume flow**: Start → advance 2 slides → navigate away → return → verify position (instant jump)
4. **Keyboard navigation**: Verify arrow keys move between slides
5. **Skip button**: Verify always visible and functional on all slides
6. **Router guard**: Verify redirect behavior (incomplete → onboarding, complete → destination)
7. **PWA detection**: Mock matchMedia to test 5-slide flow
8. **Returning user**: Seed existing workout, verify "Welcome back" variant shown
9. **Checklist deep-links**: Click each item, verify navigation to correct route
10. **DB error**: Mock Dexie failure, verify fail-open to app

### Test Data

- Use constants from `previewData.ts` for preview components
- Seed database with fake-indexeddb before tests requiring onboarding state

## Implementation Notes

### Carousel API Usage

```vue
<script setup>
import { ref, watchEffect } from 'vue'
import type { CarouselApi } from '@/components/ui/carousel'

const carouselApi = ref<CarouselApi>()
const currentSlide = ref(0)

function setApi(api: CarouselApi) {
  carouselApi.value = api
}

watchEffect(() => {
  if (!carouselApi.value) return

  currentSlide.value = carouselApi.value.selectedScrollSnap()

  carouselApi.value.on('select', () => {
    currentSlide.value = carouselApi.value!.selectedScrollSnap()
  })
})

// Resume: instant jump to saved position
onMounted(() => {
  if (savedStep > 0 && carouselApi.value) {
    carouselApi.value.scrollTo(savedStep, false) // false = no animation
  }
})
</script>

<template>
  <Carousel @init-api="setApi" :opts="{ loop: false }">
    <!-- slides conditionally rendered based on isPwaInstalled -->
  </Carousel>
</template>
```

### Checklist Route Mapping

```typescript
// Type-safe route names for checklist items
const checklistItems = [
  { labelKey: 'onboarding.checklist.createTemplate', routeName: 'TemplatesCreate' },
  { labelKey: 'onboarding.checklist.browseExercises', routeName: 'Exercises' },
  { labelKey: 'onboarding.checklist.startWorkout', routeName: 'WorkoutCreate' },
  { labelKey: 'onboarding.checklist.tryBenchmark', routeName: 'Benchmarks' },
] as const
```

## Technical Implementation Notes

### shadcn-vue Components

**Installation:**

```bash
pnpm dlx shadcn-vue@latest add carousel
```

**Already Installed:** Button, Card, Progress, Checkbox

**CarouselApi Reference:**

```typescript
interface CarouselApi {
  scrollTo(index: number, jump: boolean): void  // jump=true for instant (no animation)
  selectedScrollSnap(): number                   // Current slide (0-based)
  on(event: 'select', callback: () => void): void
  canScrollNext(): boolean
  canScrollPrev(): boolean
}
```

**Gotchas:**

- `carouselApi` is `undefined` until `@init-api` fires - always null-check
- Progress dots must be implemented manually (not built into Carousel)
- Use `scrollTo(savedStep, true)` for instant jump on resume (second param `true` = no animation)

**Progress Dots Pattern:**

```vue
<div class="flex gap-2 justify-center mt-4">
  <button
    v-for="n in totalSlides"
    :key="n"
    @click="carouselApi?.scrollTo(n - 1, false)"
    :class="n - 1 === currentSlide ? 'bg-primary' : 'bg-muted'"
    class="h-2 w-2 rounded-full transition-colors"
    :aria-label="`Go to slide ${n}`"
  />
</div>
```

### VueUse Composables

| Feature | Composable | Notes |
|---------|-----------|-------|
| PWA Detection | `useMediaQuery` | `useMediaQuery('(display-mode: standalone)')` - reactive, auto-cleanup |
| Keyboard Navigation | `onKeyStroke` | `onKeyStroke('ArrowLeft', ...)` - component-scoped |
| Global State | `createGlobalState` | Matches project pattern in `src/stores/settings.ts` |
| Swipe Gestures | `useSwipe` | Optional - Carousel may have built-in support |

**PWA Detection Pattern:**

```typescript
import { useMediaQuery } from '@vueuse/core'

const isPwaInstalled = useMediaQuery('(display-mode: standalone)')

// Safari iOS fallback
const isSafariStandalone = computed(() =>
  'standalone' in globalThis.navigator && globalThis.navigator.standalone === true
)

const isPWA = computed(() => isPwaInstalled.value || isSafariStandalone.value)
const totalSlides = computed(() => isPWA.value ? 5 : 6)
```

**Keyboard Navigation Pattern:**

```typescript
import { onKeyStroke } from '@vueuse/core'

onKeyStroke('ArrowLeft', (e) => {
  e.preventDefault()
  carouselApi.value?.scrollPrev()
})

onKeyStroke('ArrowRight', (e) => {
  e.preventDefault()
  carouselApi.value?.scrollNext()
})
```

### Dexie Database

**Schema Update (version 6):**

```typescript
// src/db/implementations/dexie/database.ts
.version(6).stores({
  // ... existing tables
  onboarding: 'id'  // Singleton pattern
})
```

**Type Definition:**

```typescript
// src/db/schema.ts
export type DbOnboarding = {
  id: 'onboarding'      // Singleton literal
  completed: boolean
  currentStep: number
}
```

**Repository Pattern:**

```typescript
// src/db/implementations/dexie/onboarding.ts
export function createDexieOnboardingRepository(
  database: WorkoutTrackerDatabase
): OnboardingRepository {
  return {
    async get() {
      try {
        const record = await database.onboarding.get('onboarding')
        return record ?? { id: 'onboarding', completed: false, currentStep: 0 }
      } catch {
        // Fail-open: assume complete to avoid blocking app access
        return { id: 'onboarding', completed: true, currentStep: 0 }
      }
    },
    async update(data: Partial<DbOnboarding>) {
      await database.onboarding.put({ id: 'onboarding', ...data })
    }
  }
}
```

**Existing Data Check:**

```typescript
async function checkForExistingData(): Promise<boolean> {
  const [workoutCount, templateCount, benchmarkCount] = await Promise.all([
    database.workouts.count(),
    database.templates.count(),
    database.benchmarks.count(),
  ])
  return workoutCount > 0 || templateCount > 0 || benchmarkCount > 0
}
```

**Files to Create/Modify:**

| File | Action |
|------|--------|
| `src/db/schema.ts` | Add `DbOnboarding` type |
| `src/db/interfaces.ts` | Add `OnboardingRepository` interface |
| `src/db/implementations/dexie/database.ts` | Add version 6 + table |
| `src/db/implementations/dexie/onboarding.ts` | Create repository |
| `src/db/implementations/dexie/index.ts` | Register repository |

## Out of Scope

- User authentication/sign-in
- Interactive actions during onboarding (creating templates, workouts)
- Onboarding replay from settings
- A/B testing different flows
- Analytics tracking of onboarding completion rates
- Reduced motion support (can add later)
- Theme toggle during onboarding
