# Research: ESLint to Oxlint Rule Migration

**Date:** 2025-12-06
**Status:** Complete

## Problem Statement

Determine which ESLint rules in the project can migrate to oxlint for faster linting performance. Oxlint runs 50-100x faster than ESLint, so maximizing oxlint coverage improves developer experience.

## Current Setup

The project uses a dual-linting approach:

```bash
pnpm lint:oxlint  # oxlint . --fix -D correctness --ignore-path .gitignore
pnpm lint:eslint  # eslint . --fix --cache
pnpm lint         # Runs both sequentially via run-s
```

**Key integration:** `eslint-plugin-oxlint` disables ESLint rules already covered by oxlint, preventing duplicate linting.

## Key Findings

### Rules That CAN Migrate to Oxlint

| ESLint Rule | Oxlint Equivalent | Status |
|-------------|-------------------|--------|
| `@typescript-eslint/no-explicit-any` | `typescript/no-explicit-any` | Fully supported with auto-fix |
| `@typescript-eslint/consistent-type-definitions` | `typescript/consistent-type-definitions` | Supports `type` vs `interface` preference |
| `@typescript-eslint/array-type` | `typescript/array-type` | Supports `generic` mode with auto-fix |
| `@typescript-eslint/consistent-type-imports` | `typescript/consistent-type-imports` | Supports `separate-type-imports` with auto-fix |
| `no-console` | `eslint/no-console` | Supports `allow` option |
| `no-restricted-imports` | `eslint/no-restricted-imports` | Supports path restrictions |

### Rules That CANNOT Migrate

| ESLint Rule | Reason |
|-------------|--------|
| **Vue Rules (13/14)** | Oxlint lacks Vue template parser |
| `vue/multi-word-component-names` | Requires template parsing |
| `vue/component-definition-name-casing` | Requires template parsing |
| `vue/component-name-in-template-casing` | Requires template parsing |
| `vue/match-component-file-name` | Requires template parsing |
| `vue/prop-name-casing` | Requires template parsing |
| `vue/attribute-hyphenation` | Requires template parsing |
| `vue/custom-event-name-casing` | Requires template parsing |
| `vue/max-template-depth` | Requires template parsing |
| `vue/no-unused-properties` | Requires template parsing |
| `vue/no-unused-refs` | Requires template parsing |
| `vue/no-unused-emit-declarations` | Requires template parsing |
| `vue/require-expose` | Requires template parsing |
| `vue/require-explicit-slots` | Requires template parsing |
| **Other Rules** | |
| `@typescript-eslint/consistent-type-assertions` | Not implemented (tracked in issue #2180) |
| `complexity` | No cyclomatic complexity rule yet |
| `no-restricted-syntax` | Not available - critical for your custom rules |
| `import-x/no-restricted-paths` | Not implemented - critical for feature boundaries |
| `@intlify/vue-i18n/no-raw-text` | No i18n plugin support |

### Summary Statistics

- **Total custom rules in project:** 24
- **Migratable to oxlint:** 6 (25%)
- **Must stay in ESLint:** 18 (75%)

## Codebase Patterns

### Current eslint-plugin-oxlint Usage

```typescript
// eslint.config.ts line 319
...pluginOxlint.configs['flat/recommended'],
```

The `flat/recommended` config only disables **correctness** category rules (197 total). These rules detect outright bugs:
- 52 ESLint core rules
- 24 TypeScript rules
- 13 oxc-specific rules
- 11 unicorn rules

### Current Oxlint CLI Configuration

```bash
oxlint . --fix -D correctness --ignore-path .gitignore
```

Only the `correctness` category runs. Other available categories:
- `suspicious` - Code that is most likely wrong
- `pedantic` - Strict code patterns
- `style` - Idiomatic code patterns
- `restriction` - Opinionated rules (off by default)

## Recommended Approach

### 1. Create `.oxlintrc.json` for Rule Configuration

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "categories": {
    "correctness": "error"
  },
  "rules": {
    "typescript/no-explicit-any": "error",
    "typescript/consistent-type-definitions": ["error", "type"],
    "typescript/array-type": ["error", { "default": "generic" }],
    "typescript/consistent-type-imports": ["error", {
      "prefer": "type-imports",
      "fixStyle": "separate-type-imports"
    }],
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "no-restricted-imports": ["error", {
      "paths": [{
        "name": "vue",
        "importNames": ["reactive"],
        "message": "Use ref() instead of reactive() for consistent reactivity patterns."
      }]
    }]
  }
}
```

### 2. Update Lint Script

```json
{
  "lint:oxlint": "oxlint . --fix --ignore-path .gitignore"
}
```

Remove `-D correctness` since the config file specifies categories.

### 3. Use Dynamic ESLint Integration

```typescript
// eslint.config.ts
import oxlint from 'eslint-plugin-oxlint'

export default defineConfigWithVueTs(
  // ... other configs

  // Replace flat/recommended with dynamic config
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
)
```

This reads your oxlint config and automatically disables corresponding ESLint rules.

### 4. Keep These Rules in ESLint Only

Critical project-specific rules that oxlint cannot handle:

1. **Feature boundary enforcement** (`import-x/no-restricted-paths`)
2. **Custom AST restrictions** (`no-restricted-syntax` for enum bans, try-catch enforcement, named routes)
3. **All Vue template rules** (component naming, unused detection)
4. **i18n enforcement** (`@intlify/vue-i18n/no-raw-text`)
5. **Complexity checking** (`complexity`)

### 5. Consider Expanding Oxlint Categories

Add more categories for broader coverage:

```json
{
  "categories": {
    "correctness": "error",
    "suspicious": "warn"
  }
}
```

The `suspicious` category catches additional issues like:
- `no-confusing-void-expression`
- `no-misleading-character-class`
- `no-unnecessary-type-assertion`

## Trade-offs

| Approach | Pros | Cons |
|----------|------|------|
| Current (minimal oxlint) | Simple, low maintenance | Not maximizing oxlint speed benefits |
| Add `.oxlintrc.json` | 6 more rules in fast oxlint | Extra config file to maintain |
| Expand to `suspicious` | More bugs caught faster | May need tuning for false positives |

## Sources

- [Oxlint Configuration File Reference](https://oxc.rs/docs/guide/usage/linter/config-file-reference.html)
- [Oxlint vs ESLint Comparison](https://betterstack.com/community/guides/scaling-nodejs/oxlint-vs-eslint/)
- [eslint-plugin-oxlint npm](https://www.npmjs.com/package/eslint-plugin-oxlint)
- [TypeScript-ESLint Tracking Issue #2180](https://github.com/oxc-project/oxc/issues/2180)
- [Vue Script-Only Rules Issue #10005](https://github.com/oxc-project/oxc/issues/10005)
- [Import Plugin Tracking Issue #1117](https://github.com/oxc-project/oxc/issues/1117)
- [Announcing Oxlint 1.0](https://voidzero.dev/posts/announcing-oxlint-1-stable)
