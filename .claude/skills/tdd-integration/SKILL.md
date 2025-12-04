---
name: tdd-integration
description: Enforce Test-Driven Development with strict Red-Green-Refactor cycle using integration tests. Auto-triggers when implementing new features or functionality. Trigger phrases include "implement", "add feature", "build", "create functionality", or any request to add new behavior. Does NOT trigger for bug fixes, documentation, or configuration changes.
---

# TDD Integration Testing

Enforce strict Test-Driven Development using the Red-Green-Refactor cycle.

## Mandatory Workflow

Every new feature MUST follow this strict 3-phase cycle. Do NOT skip phases.

### Phase 1: RED - Write Failing Test

```
🔴 RED PHASE
```

1. Write an integration test for the feature requirement
2. Run the test with `pnpm test:unit <test-file>`
3. Verify the test FAILS (this proves it tests something real)

**Do NOT proceed to Green phase until test failure is confirmed.**

### Phase 2: GREEN - Make It Pass

```
🟢 GREEN PHASE
```

1. Write the MINIMAL implementation to make the test pass
2. Run the test to confirm it passes
3. Keep implementation simple—no extra features

**Do NOT proceed to Refactor phase until test passes.**

### Phase 3: REFACTOR - Improve

```
🔵 REFACTOR PHASE
```

1. Evaluate the code for improvements (duplication, clarity, patterns)
2. If changes needed: refactor and verify tests still pass
3. If no changes needed: state "No refactoring needed" with reasoning

**Cycle complete when refactor phase returns.**

## Multiple Features

Complete the full cycle for EACH feature before starting the next:

```
Feature 1: 🔴 → 🟢 → 🔵 ✓
Feature 2: 🔴 → 🟢 → 🔵 ✓
Feature 3: 🔴 → 🟢 → 🔵 ✓
```

## Phase Violations

Never:
- Write implementation before the test
- Proceed to Green without seeing Red fail
- Skip Refactor evaluation
- Start a new feature before completing the current cycle
