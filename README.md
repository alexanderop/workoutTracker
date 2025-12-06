# Workout Tracker

My personal Progressive Web App for tracking strength training and CrossFit-style workouts. I built this because I wanted a workout app that actually works offline, supports the timer protocols I use (AMRAP, EMOM, Tabata), and doesn't require a subscription.

## Features

### Block-Based Workouts
Compose workouts from different block types that you can mix and match:

- **Strength Blocks** — Track sets with weight (kg/lbs), reps, and RIR (Reps In Reserve)
- **Timed Blocks** — CrossFit-style interval protocols

### Timer Modes
Full support for popular CrossFit timing protocols:

| Mode | Description |
|------|-------------|
| **AMRAP** | As Many Rounds As Possible — set a duration, track rounds completed |
| **EMOM** | Every Minute On the Minute — exercises reset each minute |
| **Tabata** | Classic 20s work / 10s rest intervals |
| **For Time** | Race to complete all reps, optional time cap |

### Exercise Library
- 100+ pre-loaded exercises with icons and muscle group tags
- Create your own custom exercises
- Filter by muscle group (chest, back, legs, shoulders, arms, core)
- Full-text search

### Workout Templates
Save your favorite workouts as templates to reuse later. No more rebuilding the same workout every week.

### Offline-First PWA
- Works completely offline — no internet required during workouts
- Installable on your home screen (iOS, Android, desktop)
- All data stored locally in IndexedDB
- Export/import your data anytime

### Customization
- Dark mode
- Multiple languages (i18n ready)
- Weight units (kg or lbs)
- Timer volume control

## Tech Stack

- **Vue 3.5+** with Composition API and `<script setup>`
- **TypeScript** with strict type checking
- **Tailwind CSS 4** for styling
- **shadcn-vue** (reka-ui) component library
- **Pinia** for state management
- **Dexie** for IndexedDB persistence
- **Vite 6** with PWA plugin
- **Vitest** with Playwright browser testing

## Getting Started

### Prerequisites

- Node.js ^20.19.0 or >=22.12.0
- pnpm 10.24.0+

### Installation

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build

```bash
pnpm build
```

## Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start dev server with HMR |
| `pnpm build` | Type-check and build for production |
| `pnpm test` | Run all tests (Playwright browser) |
| `pnpm test:headed` | Run tests with visible browser |
| `pnpm test:ui` | Run tests with Vitest UI |
| `pnpm test:coverage` | Run tests with coverage report |
| `pnpm lint` | Run oxlint + eslint with auto-fix |
| `pnpm type-check` | TypeScript type checking only |
| `pnpm knip` | Find unused exports/dependencies |

## Architecture

This project follows **Bulletproof feature-based architecture**:

```
src/
├── features/          # Domain-specific modules
│   ├── exercises/     # Exercise library CRUD
│   ├── settings/      # App settings
│   ├── templates/     # Workout templates
│   ├── timers/        # Timer UI components
│   └── workout/       # Core workout execution
├── composables/       # Shared Vue composables
│   └── timers/        # Timer state machines
├── components/        # Shared UI components
│   └── ui/            # shadcn-vue primitives
├── db/                # Dexie database layer
│   └── repositories/  # Data access patterns
├── stores/            # Pinia stores
├── views/             # Route-level components
└── types/             # TypeScript types
```

### Dependency Rules

- Views → Features → Shared (composables, components, stores, db)
- Features cannot import other features
- Shared code cannot import features

## Contributing

Contributions are welcome! Whether it's bug reports, feature suggestions, or pull requests.

### Reporting Bugs

Open an issue with:
- What you expected to happen
- What actually happened
- Steps to reproduce
- Browser/device info

### Suggesting Features

Open an issue describing:
- The problem you're trying to solve
- Your proposed solution
- Any alternatives you considered

### Pull Requests

1. Fork the repo and create your branch from `main`
2. Run `pnpm install` to set up dependencies
3. Make your changes
4. Ensure tests pass: `pnpm test`
5. Ensure linting passes: `pnpm lint`
6. Ensure types check: `pnpm type-check`
7. Open a PR with a clear description of your changes

### Code Style

- TypeScript strict mode — no `any`, no type assertions
- Vue 3.5+ APIs (reactive props destructure, `defineModel`, `useTemplateRef`)
- Composition API with `<script setup>`
- See `CLAUDE.md` for detailed coding standards

## Testing

This project uses **Vitest** with **Playwright** for browser-based testing. Tests run in a real browser environment, not jsdom.

### Running Tests

```bash
# Run all tests
pnpm test

# Run with visible browser (great for debugging)
pnpm test:headed

# Run with Vitest UI (interactive test explorer)
pnpm test:ui

# Run with coverage
pnpm test:coverage

# Run a specific test file
pnpm test src/features/workout/
```

### Test Structure

```
src/
├── __tests__/
│   ├── helpers/       # Test utilities (createTestApp, withSetup)
│   └── factories/     # Test data builders
├── features/
│   └── workout/
│       └── __tests__/ # Feature-specific tests
└── composables/
    └── timers/
        └── __tests__/ # Composable tests
```

### Writing Tests

- **Composables**: Test directly or use `withSetup()` helper for lifecycle hooks
- **Integration**: Use `createTestApp()` for full app testing with routing
- **Factories**: Use builders like `workoutBuilder()` and `dbWorkoutBuilder()` for test data

See `docs/agent/testing.md` for detailed testing patterns.

## IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) browser extension

## License

MIT
