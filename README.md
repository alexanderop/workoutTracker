# Workout Tracker

A Vue 3 Progressive Web App for tracking strength and timed workouts with offline-first capabilities.

## Features

- **Block-based workouts** — Compose workouts from strength blocks (sets/reps/weight) and timed blocks (AMRAP, EMOM, Tabata, For Time)
- **Offline-first** — IndexedDB storage via Dexie with full PWA support
- **Exercise library** — Create and manage custom exercises
- **Workout templates** — Save and reuse workout configurations
- **Multiple timer modes** — Rest timers, AMRAP, EMOM, Tabata, and For Time protocols
- **i18n ready** — Internationalization support via vue-i18n

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

## IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue (Official)](https://marketplace.visualstudio.com/items?itemName=Vue.volar)
- [Vue.js devtools](https://chromewebstore.google.com/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd) browser extension

## License

Private
