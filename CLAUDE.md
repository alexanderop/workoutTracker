# Workout Tracker

Vue 3 PWA for tracking strength and CrossFit-style workouts with block-based programming.

## Commands

```bash
pnpm dev              # Start dev server
pnpm build            # Type-check + build
pnpm test:unit        # Run tests (add <file> for single file)
pnpm lint             # oxlint + eslint with auto-fix
```

## Architecture

### Block-Based System

Workouts consist of ordered **blocks** (discriminated union via `kind`):
- **Strength** (`kind: 'strength'`): Set/rep tracking with kg, reps, RIR
- **Timed** (`kind: 'amrap' | 'emom' | 'tabata' | 'fortime'`): CrossFit-style timers

Types: `src/types/blocks.ts` (runtime), `src/db/schema.ts` (persistence, `Db` prefix)

### State Management

- **Workout state**: Singleton ref in `src/composables/useWorkout.ts`
- **Pinia stores**: Exercises and settings only
- **Persistence**: Dexie IndexedDB in `src/db/` with repositories

### Modes

`'builder'` (configure blocks) → `'active'` (execute workout)

### Key Locations

- `src/composables/` - Core logic, timers
- `src/components/ui/` - shadcn-vue primitives (do not modify)
- `src/components/{feature}/` - Feature components with parent-prefixed names

## Documentation

Read before working on specific areas:
- `docs/agent/testing.md` - Test helpers (withSetup, createTestApp), factories
- `docs/agent/composables.md` - useWorkout API, timer state machines
