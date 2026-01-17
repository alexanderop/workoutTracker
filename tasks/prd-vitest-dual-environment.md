# PRD: Vitest Dual Environment Testing (Happy-DOM + Browser Mode)

## Introduction

Enable running the same integration tests in two environments: **Happy-DOM** for fast local development and **Browser Mode with Playwright** for CI. This provides faster feedback loops during development while maintaining full browser fidelity in the CI pipeline. An abstraction layer will bridge the API differences between `vitest-browser-vue` (browser) and `@testing-library/vue` (Happy-DOM).

## Goals

- Run all 90+ integration tests in Happy-DOM locally for faster feedback
- Maintain browser mode tests in CI for full browser fidelity
- Create an abstraction layer that hides environment-specific API differences
- Achieve significant speedup for local test runs (target: 50%+ faster)
- Zero changes required to test logic—only imports change

## Key Design Decisions

### Environment Detection
- **No runtime detection** - separate npm scripts and Vitest project configurations
- Each environment has its own setup file that registers the correct implementations
- `pnpm test` runs Happy-DOM, `pnpm test:browser` runs browser mode

### Type Strategy
- **Wrapper class** that mimics the full Vitest browser Locator API
- Provides unified interface for both environments
- Cleanest DX with consistent method chaining

### API Scope
- **Full Vitest Locator API from the start**:
  - Queries: `getByRole`, `getByText`, `getByLabelText`, `getByPlaceholder`, `getByTestId`, `getByAltText`, `getByTitle`
  - Chaining: `nth`, `first`, `last`, `and`, `or`, `filter` (with `has`, `hasNot`, `hasText`, `hasNotText`)
  - Interactions: `click`, `dblClick`, `fill`, `clear`, `hover`, `selectOptions`
  - Element access: `query`, `element`, `elements`, `all`

### DOM Backend for Happy-DOM
- Use **@testing-library/vue** for queries and interactions
- Provides semantic queries (getByRole, getByText) with proper a11y semantics
- Matches the query behavior of Vitest browser mode

### Assertions
- Abstract **`expect.element()`** to work in both environments
- In browser mode: uses native `expect.element()` with auto-retry
- In Happy-DOM: wraps with `waitFor` + standard expect matchers

### Browser-Only Tests
- Use **`.browser.spec.ts` file suffix** for tests that only run in browser mode
- Excluded from Happy-DOM project via glob pattern
- Examples: canvas tests, visual regression tests, accessibility audits

### Pre-Commit Behavior
- **Use Happy-DOM for pre-commit** (faster local feedback)
- CI uses browser mode for full fidelity
- `pnpm test` = Happy-DOM (default for local dev and pre-commit)

### File Structure
```
src/__tests__/helpers/
├── locator/
│   ├── types.ts           # Shared Locator interface matching Vitest API
│   ├── browser.ts         # Thin wrapper around vitest-browser-vue page
│   ├── happy-dom.ts       # @testing-library/vue implementation
│   └── index.ts           # Re-exports based on setup
├── assertions/
│   ├── types.ts           # Shared assertion types
│   ├── browser.ts         # expect.element() wrapper
│   └── happy-dom.ts       # waitFor + expect wrapper
└── render/
    ├── browser.ts         # page.render() wrapper
    └── happy-dom.ts       # @testing-library/vue render()
```

## User Stories

### US-001: Configure Vitest projects for dual environments
**Description:** As a developer, I want Vitest configured with two projects (happy-dom and browser) so tests can run in either environment.

**Acceptance Criteria:**
- [ ] Add `happy-dom` project to vitest.config.ts targeting `src/__tests__/integration/**`
- [ ] Exclude `*.browser.spec.ts` files from happy-dom project
- [ ] Keep existing browser project for browser mode
- [ ] Both projects point to the same test files (except browser-only)
- [ ] Configure separate setup files: `setup.happy-dom.ts` and existing browser setup
- [ ] Typecheck passes

---

### US-002: Create Locator abstraction layer
**Description:** As a developer, I want a unified Locator API so tests work in both Happy-DOM and browser mode without code changes.

**Acceptance Criteria:**
- [ ] Create `src/__tests__/helpers/locator/types.ts` with Locator interface matching Vitest browser API
- [ ] Create `src/__tests__/helpers/locator/browser.ts` - thin wrapper around `page` object
- [ ] Create `src/__tests__/helpers/locator/happy-dom.ts` - implementation using @testing-library/vue
- [ ] Implement all query methods: `getByRole`, `getByText`, `getByLabelText`, `getByPlaceholder`, `getByTestId`, `getByAltText`, `getByTitle`
- [ ] Implement chaining methods: `nth`, `first`, `last`, `and`, `or`
- [ ] Implement filter method with `has`, `hasNot`, `hasText`, `hasNotText` options
- [ ] Implement interaction methods: `click`, `dblClick`, `fill`, `clear`, `hover`, `selectOptions`
- [ ] Implement element access: `query`, `element`, `elements`, `all`
- [ ] Typecheck passes

---

### US-003: Create render abstraction layer
**Description:** As a developer, I want a unified render function so component mounting works in both environments.

**Acceptance Criteria:**
- [ ] Create `src/__tests__/helpers/render/browser.ts` using `page.render()` from vitest-browser-vue
- [ ] Create `src/__tests__/helpers/render/happy-dom.ts` using `render()` from @testing-library/vue
- [ ] Support passing Vue plugins, global config (same API as current `createTestApp`)
- [ ] Return a unified result object with access to the abstracted Locator API
- [ ] Typecheck passes

---

### US-004: Create assertion abstraction for expect.element()
**Description:** As a developer, I want `expect.element()` to work in both environments with proper retry behavior.

**Acceptance Criteria:**
- [ ] Create `src/__tests__/helpers/assertions/types.ts` with assertion interfaces
- [ ] Create `src/__tests__/helpers/assertions/browser.ts` using native `expect.element()`
- [ ] Create `src/__tests__/helpers/assertions/happy-dom.ts` using `waitFor()` + standard expect
- [ ] Support all common matchers: `toBeVisible`, `toBeDisabled`, `toHaveText`, `toHaveValue`, etc.
- [ ] Abstract `expect.poll()` similarly for non-element async assertions
- [ ] Typecheck passes

---

### US-005: Update test helpers to use abstraction layer
**Description:** As a developer, I want `createTestApp` and Page Objects to use the new abstraction layer.

**Acceptance Criteria:**
- [ ] Update `src/__tests__/helpers/createTestApp.ts` to use abstracted render
- [ ] Update Page Objects to use abstracted queries instead of `page.getByRole()`
- [ ] Ensure Page Objects return abstracted Locator types
- [ ] All existing tests continue to pass in browser mode
- [ ] Typecheck passes

---

### US-006: Add Happy-DOM setup file
**Description:** As a developer, I want Happy-DOM-specific setup (polyfills, mocks) so tests run correctly.

**Acceptance Criteria:**
- [ ] Create `src/__tests__/setup.happy-dom.ts`
- [ ] Mock/polyfill missing APIs: `matchMedia`, `IntersectionObserver`, `ResizeObserver`
- [ ] Configure `fake-indexeddb` for Dexie compatibility
- [ ] Register Happy-DOM implementations of the abstraction layer
- [ ] Import @testing-library matchers
- [ ] Typecheck passes

---

### US-007: Migrate first batch of integration tests
**Description:** As a developer, I want 10 integration tests migrated to validate the abstraction layer works.

**Acceptance Criteria:**
- [ ] Select 10 **simplest** integration tests to validate the abstraction works
- [ ] Update imports to use abstraction layer
- [ ] Tests pass in Happy-DOM environment
- [ ] Tests pass in browser environment (no regression)
- [ ] Document any issues or edge cases found
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-008: Migrate remaining integration tests
**Description:** As a developer, I want all remaining integration tests migrated to use the abstraction layer.

**Acceptance Criteria:**
- [ ] Update all 80+ remaining integration test files
- [ ] Replace `page.getByRole()` with abstracted queries
- [ ] Replace `page.render()` with abstracted render
- [ ] Replace `expect.poll()` with abstracted poll
- [ ] All tests pass in Happy-DOM
- [ ] All tests pass in browser mode
- [ ] Typecheck passes
- [ ] Verify in browser

---

### US-009: Update CI pipeline
**Description:** As a developer, I want CI to run browser tests while local defaults to Happy-DOM.

**Acceptance Criteria:**
- [ ] Update GitHub Actions workflow to explicitly use `--project=browser`
- [ ] Verify sharding still works correctly
- [ ] Add optional workflow to run Happy-DOM tests in CI for validation
- [ ] Typecheck passes

---

### US-010: Update package.json scripts
**Description:** As a developer, I want convenient npm scripts for different test modes.

**Acceptance Criteria:**
- [ ] `pnpm test` - runs Happy-DOM tests (fast local default, used for pre-commit)
- [ ] `pnpm test:browser` - runs browser tests locally
- [ ] `pnpm test:ci` - runs browser tests (used by CI)
- [ ] `pnpm test:all` - runs both environments
- [ ] Update CLAUDE.md to document new commands and pre-commit behavior
- [ ] Typecheck passes

---

### US-011: Document dual environment testing
**Description:** As a developer, I want documentation explaining how the dual environment setup works.

**Acceptance Criteria:**
- [ ] Add section to README or create `docs/testing.md`
- [ ] Explain when to use Happy-DOM vs browser mode
- [ ] Document the abstraction layer API
- [ ] List known limitations of Happy-DOM
- [ ] Provide troubleshooting guide for environment-specific failures

## Functional Requirements

- FR-1: Vitest must support two projects (`happy-dom` and `browser`) targeting the same test files (excluding `.browser.spec.ts`)
- FR-2: Each environment has its own setup file that registers the correct abstraction implementations (no runtime detection)
- FR-3: Query functions must return compatible Locator wrapper types for assertions and chaining
- FR-4: Render function must accept the same options in both environments
- FR-5: Async assertions must behave consistently (polling interval, timeout)
- FR-6: Page Objects must work unchanged from test perspective
- FR-7: Happy-DOM tests must use `fake-indexeddb` for Dexie compatibility
- FR-8: CI must continue running browser tests with existing sharding
- FR-9: Pre-commit hook uses Happy-DOM tests for faster feedback

## Non-Goals

- No migration away from vitest-browser-vue (abstraction layer wraps it)
- No changes to visual regression tests (stay browser-only)
- No changes to accessibility tests (stay browser-only)
- No changes to architecture tests (already Node.js)
- No support for running tests in both environments simultaneously in local dev
- No changes to the actual test logic or assertions

## Technical Considerations

### Dependencies to Add
- `@testing-library/vue` - DOM queries for Happy-DOM
- `@testing-library/user-event` - User interactions for Happy-DOM
- `happy-dom` - Fast DOM implementation
- `fake-indexeddb` - IndexedDB polyfill (may already exist)

### Known Happy-DOM Limitations
These may require mocking or may cause test failures:
- `matchMedia` - needs polyfill
- `IntersectionObserver` - needs mock
- `ResizeObserver` - needs mock
- `HTMLDialogElement` - limited support
- Canvas APIs - not supported (may affect chart tests)

### Type Safety Approach
The `Locator` type (browser) vs `HTMLElement` (Happy-DOM) difference is handled by:
- **Wrapper class** that implements the full Vitest browser Locator interface
- Browser implementation wraps `page` from vitest-browser-vue
- Happy-DOM implementation uses @testing-library/vue queries internally
- Tests interact with the same unified Locator API in both environments

### Performance Target
- Happy-DOM should run full test suite in < 50% of browser mode time
- Individual test files should see 2-5x speedup

## Success Metrics

- All 90+ integration tests pass in both Happy-DOM and browser mode
- Local test runs complete in < 50% of the time compared to browser mode
- Zero false positives/negatives between environments (tests fail consistently)
- Developer experience survey shows preference for new local testing speed
- CI pipeline maintains current reliability and test coverage

## Resolved Questions

1. ~~How do we handle tests that use canvas or other APIs not supported by Happy-DOM?~~
   **Decision**: Use `.browser.spec.ts` file suffix to exclude from Happy-DOM project
2. ~~What's the strategy for tests that legitimately need browser-specific behavior?~~
   **Decision**: Same as above - use `.browser.spec.ts` suffix
3. ~~What type strategy to use (union, wrapper, generics)?~~
   **Decision**: Wrapper class that implements full Vitest browser Locator API
4. ~~How to detect environment at runtime?~~
   **Decision**: No runtime detection - separate setup files per Vitest project

## Open Questions

1. Should we create a VS Code task/launch config for running Happy-DOM tests?
2. Should the abstraction layer be published as a separate package for reuse?
3. Should we add a lint rule to prevent direct `page.getByRole()` usage in new tests?
