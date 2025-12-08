# ADR 001: Plugin-Based Workout Architecture

**Status:** Proposed
**Date:** 2025-12-08
**Deciders:** Alex
**Tags:** architecture, extensibility, cohesion, coupling

---

## Context

The current workout system uses a monolithic architecture where all workout types (Strength, AMRAP, EMOM, Tabata, ForTime) share a single `Workout` state object and mixed logic in a 612-line `useWorkout` composable.

### Current Pain Points

1. **Hard to extend**: Adding a new workout type (e.g., "Chipper", "Hero WOD") requires modifying 5+ files:
   - `src/types/blocks.ts` - Add new block type to discriminated union
   - `src/db/schema.ts` - Add DB block type
   - `src/features/workout/composables/useWorkout.ts` - Add type-specific logic
   - `src/features/workout/components/WorkoutActiveMode.vue` - Add view routing
   - `src/db/converters.ts` - Add converters

2. **Bloated shared state**: `Workout` type contains optional fields that only apply to specific workout types:
   - `activeSetIndex` - Only for Strength blocks
   - `activeExerciseIndex` - Only for Benchmark ForTime
   - `benchmarkId` - Only for Benchmark workouts
   - `globalTimerStartedAt` - Only for Benchmark global timer

3. **Mixed responsibilities**: `useWorkout.ts` (612 lines) contains interleaved logic for:
   - Strength set management (completeSet, addSet, removeSet, setSetCount)
   - AMRAP/EMOM/Tabata/ForTime result tracking (setBlockResult)
   - Benchmark navigation (advanceToNextExercise, goToPreviousExercise)
   - Block operations (addBlock, removeBlock, reorderBlocks)

4. **Low cohesion**: Type-specific logic scattered across multiple files instead of co-located

### Research Findings

Research into Vue 3 ecosystem patterns revealed several architectural approaches:

**From Vue Community:**
- **Composable Pattern**: Use `useXxx` functions for stateful reactive logic
- **Feature-Based Organization**: Group by domain, not technical file type
- **Registry Pattern**: Centralized type-safe lookup for instances
- **Factory Pattern**: Encapsulate creation logic for different types
- **Strategy Pattern**: Different algorithms per type, swap dynamically

**Best Practices:**
- Single Pinia store with discriminated unions for shared lifecycle
- Multi-store composition for completely different workflows
- Factories ensure proper initialization
- Keep shared utilities (like timers) separate from domain logic

---

## Decision

Adopt a **Plugin-Based Architecture** using a Registry Pattern where each workout type becomes a self-contained plugin module.

### Core Design

#### Plugin Structure
```
src/plugins/
├── registry.ts              # Plugin registration & factory
├── types.ts                 # Plugin interface contracts
├── utils.ts                 # Shared helpers (updateBlock)
├── strength/                # One folder per workout type
│   ├── index.ts            # Auto-registration
│   ├── block.ts            # Type definitions
│   ├── config.ts           # Plugin implementation
│   ├── composable.ts       # State management
│   ├── persistence.ts      # DB converters
│   └── components/
│       └── StrengthView.vue
├── amrap/
├── emom/
├── tabata/
├── fortime/
└── chipper/                 # NEW - just add folder!
```

#### Plugin Interface
```typescript
export type WorkoutPlugin<TBlock extends WorkoutBlock> = {
  kind: WorkoutBlock['kind']
  label: string

  lifecycle: {
    onActivate?: (blockIndex: number) => void
    onDeactivate?: (blockIndex: number) => void
    onComplete?: (blockIndex: number) => WorkoutBlock | null
  }

  queries: {
    isStarted: (blockIndex: number) => boolean
    isCompleted: (blockIndex: number) => boolean
    getProgress: (blockIndex: number) => number
    canActivate: (blockIndex: number) => boolean
    getLabel: () => string
  }

  persistence: {
    toDb: (block: TBlock) => DbWorkoutBlock
    fromDb: (dbBlock: DbWorkoutBlock) => TBlock
  }

  components: {
    ActiveView: Component
    ConfigDialog?: Component
    DetailView?: Component
  }

  createBlock: () => TBlock
}
```

#### Registry & Factory
```typescript
const plugins = new Map<WorkoutBlock['kind'], WorkoutPlugin>()

export function registerPlugin(kind, plugin) {
  plugins.set(kind, plugin)
}

export function getPlugin(kind) {
  return plugins.get(kind)
}

export function createBlock(kind) {
  return getPlugin(kind)?.createBlock() ?? null
}

export function getActiveView(block) {
  return getPlugin(block.kind)?.components.ActiveView ?? null
}
```

#### State Management
- **Keep singleton workout container** (minimal changes to `workoutState.ts`)
- **Plugins manage ephemeral state** (each plugin has its own composable)
- **Shared utilities stay shared** (timers in `src/composables/timers/`)

#### Database Strategy
- **Keep single table with JSON blocks** (discriminated unions)
- **No migration needed** - just add new block types to union
- **Plugin converters** - each plugin provides toDb/fromDb

### Example: Adding "Chipper" Workout Type

**After migration:**
```typescript
// 1. Create src/plugins/chipper/ folder
// 2. Implement plugin contract (config.ts, composable.ts, components/)
// 3. Import in main.ts: import './plugins/chipper'
// ✅ Done! Only 1 file modified (main.ts)
```

---

## Consequences

### Positive

#### Extensibility
- **Zero-touch for new types**: Add Chipper by creating one folder + one import
- **No shared code modification**: Existing plugins unaffected by new ones
- **Type safety**: Registry enforces plugin contract at compile time

#### Cohesion
- **High cohesion**: Everything for AMRAP lives in `src/plugins/amrap/`
- **Single Responsibility**: Each plugin owns its state, UI, and persistence
- **Easy to understand**: Clear boundaries between workout types

#### Coupling
- **Low coupling**: Plugins don't know about each other
- **Shared infrastructure**: Only timers and utilities are shared
- **Feature isolation**: ESLint enforces no cross-plugin imports

#### Maintainability
- **Testability**: Each plugin independently testable
- **Smaller files**: 612-line `useWorkout.ts` splits into focused composables
- **Clear ownership**: One team can own one plugin

### Negative

#### Initial Investment
- **Migration time**: Estimated 6-7 weeks for full migration
- **Learning curve**: Team needs to understand plugin pattern
- **More files**: Plugin structure is more granular (more navigation)

#### Complexity
- **Indirection**: Following code requires understanding registry lookup
- **Dynamic components**: Async component loading adds complexity
- **Abstraction overhead**: Simple changes may feel over-engineered

### Neutral

#### Database
- **No migration needed**: Keep single table with discriminated unions
- **Type flexibility**: Easy to add new block types to union
- **IndexedDB limitation**: All block data must be JSON-serializable

#### Benchmarks
- **Keep as feature**: Benchmarks remain in `src/features/benchmarks/`
- **Create ForTime workouts**: Benchmarks use ForTime plugin for execution
- **No changes needed**: Current architecture is correct

---

## Migration Strategy

### Incremental 6-Phase Approach

1. **Phase 1: Foundation** (Week 1)
   - Create plugin infrastructure (registry, types, utils)
   - No behavior changes, all tests pass

2. **Phase 2: Migrate Tabata** (Week 2)
   - Prove concept with simplest workout type
   - Extract Tabata logic to plugin
   - Update WorkoutActiveMode to use plugin for Tabata only

3. **Phase 3: Migrate Timed Blocks** (Week 3-4)
   - AMRAP, EMOM, ForTime (similar patterns to Tabata)
   - Remove timed block logic from useWorkout.ts

4. **Phase 4: Migrate Strength** (Week 5)
   - Most complex workout type
   - Move activeSetIndex to plugin
   - Extract strength logic

5. **Phase 5: Cleanup** (Week 6)
   - Remove legacy code
   - Simplify Workout type
   - Update documentation

6. **Phase 6: Prove Extensibility** (Week 7)
   - Add Chipper plugin (new workout type)
   - Measure: Count files modified (should be ≤2)

### Risk Mitigation
- **Incremental**: Migrate one plugin at a time
- **Tests always pass**: No breaking changes between phases
- **Backward compatible**: Keep existing APIs during migration
- **Easy rollback**: Each phase is independently revertable

---

## Alternatives Considered

### Alternative 1: Vertical Slice Architecture
**Description:** Organize as complete vertical slices from DB → UI, each slice owns its database schema

**Pros:**
- Even stronger isolation than plugins
- Independent deployment possible
- Clearer ownership

**Cons:**
- More duplication than plugin approach
- Database migration complexity (multiple tables)
- Harder to share utilities

**Rejected because:** Too invasive, database migration too risky, shared state still needed

### Alternative 2: Compositional Modules (Lighter Refactor)
**Description:** Keep shared state but split composables by domain

**Pros:**
- Less invasive refactor
- Still improves organization
- Keeps some shared infrastructure benefits

**Cons:**
- Still couples types through shared state
- Doesn't fully solve "easy to add types" problem
- `Workout` type still grows with new types

**Rejected because:** Doesn't achieve the primary goal of making new types trivial to add

### Alternative 3: Multi-Store (Each Plugin Has Pinia Store)
**Description:** Each plugin has its own Pinia store instead of shared composables

**Pros:**
- Standard Vue state management
- Familiar pattern for team

**Cons:**
- More complex state synchronization
- Harder to persist as single workout
- Breaks existing auto-save logic
- Shared workout fields (name, blocks) still need central store

**Rejected because:** Singleton workout store is working well, multi-store adds unnecessary complexity

---

## Success Metrics

### After Migration
- ✅ Adding new workout type requires modifying ≤ 2 files (schema.ts, main.ts)
- ✅ All existing tests pass
- ✅ No plugin-specific fields in `Workout` type
- ✅ `useWorkout.ts` reduced from 612 lines to <200 lines
- ✅ Chipper plugin added successfully to prove extensibility

### Example: Adding "Ladder" Workout Type (Post-Migration)
1. Create `src/plugins/ladder/` folder (~5 files)
2. Add `DbLadderBlock` to `schema.ts` union
3. Import in `main.ts`
4. **Total changes: 1 new folder + 2 file edits** ✅

---

## Implementation Plan

### Critical Files to Create
- `src/plugins/registry.ts` - Plugin registration and factory
- `src/plugins/types.ts` - Plugin interface contracts
- `src/plugins/utils.ts` - Shared block update helpers
- `src/plugins/tabata/config.ts` - Reference plugin implementation
- `src/plugins/strength/composable.ts` - Complex plugin example
- `src/plugins/chipper/config.ts` - New workout type example

### Critical Files to Modify
- `src/features/workout/components/WorkoutActiveMode.vue` - Use dynamic components
- `src/features/workout/composables/useWorkout.ts` - Extract plugin logic incrementally
- `src/stores/workoutState.ts` - Remove plugin-specific fields over time
- `src/db/converters.ts` - Delegate to plugin converters
- `src/types/blocks.ts` - Add new block types to union
- `src/db/schema.ts` - Add new DB block types to union
- `src/main.ts` - Import plugins for auto-registration

### Files to Keep Unchanged
- `src/composables/timers/` - Shared timer composables
- `src/features/benchmarks/` - Benchmark feature
- `src/db/implementations/dexie/` - Database layer
- `src/__tests__/integration/` - Integration tests

### Testing Strategy
- Plugin unit tests for each new plugin
- Existing integration tests continue to pass
- Add new tests for Chipper workflows
- Validate after each phase: `pnpm type-check && pnpm lint && pnpm test`

---

## References

### Research Sources
- [Vue 3 Composables - Official Docs](https://vuejs.org/guide/reusability/composables.html)
- [Feature-Sliced Design](https://feature-sliced.design/)
- [TypeScript Discriminated Unions](https://www.typescriptlang.org/docs/handbook/unions-and-intersections.html#discriminating-unions)
- [Vue 3 Plugin Development](https://vuejs.org/guide/reusability/plugins.html)
- [Design Patterns with Composition API](https://medium.com/@davisaac8/design-patterns-and-best-practices-with-the-composition-api-in-vue-3-77ba95cb4d63)

### Related ADRs
- (None yet - this is the first architectural decision record)

---

## Notes

- This proposal prioritizes **extensibility** (easy to add new workout types) over minimizing initial refactoring effort
- The incremental migration strategy allows for early validation without big-bang rewrite
- Benchmarks feature integration is well-designed and doesn't need changes
- Timer composables are excellent examples of reusable utilities that work well across all plugins
