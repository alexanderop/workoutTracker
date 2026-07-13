# Architecture Overview

Vue 3 PWA using **Bulletproof feature-based architecture** for strength and CrossFit-style workout tracking.

## Folder Structure Diagram

```mermaid
graph TB
    subgraph Views["views/ (Route Pages)"]
        V[Page Components<br/>Orchestrate features]
    end

    subgraph Features["features/ (Self-Contained Modules)"]
        F1[benchmarks/]
        F2[exercises/]
        F3[log-past-workout/]
        F4[onboarding/]
        F5[progressions/]
        F6[settings/]
        F7[templates/]
        F8[timers/]
        F9[weight/]
        F10[workout/]
    end

    subgraph Shared["Shared Code"]
        subgraph Components["components/"]
            C1[timers/]
            C2[ui/ - shadcn]
        end

        subgraph State["State & Logic"]
            CO[composables/]
            ST[stores/ - VueUse createGlobalState singletons]
        end

        subgraph Data["Data Layer"]
            DB[db/implementations/dexie/]
            TY[types/]
        end

        LIB[lib/ - utilities]
    end

    subgraph Other["Supporting"]
        R[router/]
        I18[i18n/]
        D[data/]
    end

    V -->|imports| Features
    V -->|imports| Shared
    Features -->|imports| Shared

    Features -.->|cannot import| Features
    Shared -.->|cannot import| Features
    Features -.->|cannot import| V
```

## Dependency Rules

```mermaid
graph LR
    subgraph "Import Direction"
        direction TB
        A[Views] -->|can use| B[Features]
        A -->|can use| C[Shared]
        B -->|can use| C
        B -.->|prohibited| B
        C -.->|prohibited| B
    end
```

## Layer Responsibilities

| Layer | Purpose | Import Rules |
|-------|---------|--------------|
| `views/` | Route-level pages | Can import features + shared |
| `features/` | Self-contained modules | Can only import shared, NOT other features |
| `components/` | Reusable UI components | Cannot import features |
| `composables/` | Shared reactive logic | Cannot import features |
| `stores/` | VueUse createGlobalState singletons (exercises.ts, settings.ts, toast.ts) + plain-ref singleton (workoutState.ts) | Cannot import features |
| `db/` | Dexie + repository pattern | Cannot import features |

## Directory Structure

```
src/
├── features/               # Self-contained feature modules (Bulletproof pattern)
│   ├── benchmarks/         # Benchmark workouts tracking
│   ├── exercises/          # Exercise library CRUD
│   ├── log-past-workout/   # Logging workouts after the fact
│   ├── onboarding/         # First-run onboarding flow
│   ├── progressions/       # Strength progressions
│   ├── settings/           # App settings & preferences
│   ├── templates/          # Workout templates
│   ├── timers/             # Standalone timer UI components
│   ├── weight/             # Bodyweight tracking
│   └── workout/            # Workout execution logic
├── views/              # Route-level page components (orchestrate features)
├── components/         # Shared components
│   ├── timers/         # Timer UI components
│   └── ui/             # shadcn-vue primitives (DO NOT EDIT)
├── composables/        # Shared composables (timers, animations, utilities)
│   └── timers/         # Timer composables (rest, AMRAP, EMOM, etc.)
├── stores/             # VueUse createGlobalState singletons + plain-ref singleton
│   ├── exercises.ts    # createGlobalState — exercise library state
│   ├── settings.ts     # createGlobalState — app settings state
│   ├── toast.ts        # createGlobalState — ephemeral toast/confirmation messages
│   └── workoutState.ts # plain-ref singleton — active workout state
├── db/                 # Dexie IndexedDB + repository pattern
│   └── implementations/dexie/   # Data access layer (concrete repository implementations)
├── types/              # Shared TypeScript types
├── lib/                # Utility functions
├── router/             # Vue Router configuration
├── i18n/               # Internationalization
│   └── messages/       # Translation files
└── data/               # Static data
```

## Key Principles

1. **Feature Isolation**: Features cannot import from other features (ESLint-enforced)
2. **Unidirectional Dependencies**: Views → Features → Shared
3. **Shared Code Neutrality**: Shared code cannot depend on features
4. **Single Responsibility**: Each feature owns its domain logic
