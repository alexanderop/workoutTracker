---
type: Reference
title: "Mutation Testing: Benchmarks Integration Tests"
description: Migrated reference documentation from the former root documentation tree.
resource: brain/reference/mutation-testing-benchmarks.md
tags: [reference]
timestamp: 2026-06-28T08:10:00Z
---
## Mutation Testing: Benchmarks Integration Tests

## Summary

**Date**: 2026-01-10
**Score**: 0% (7 survived / 7 total)
**Tests**: `benchmark-results.spec.ts`, `benchmark-execution.spec.ts`

---

## Surviving Mutants

| #   | File                 | Line | Original             | Mutated              | Suggested Fix                      |
| --- | -------------------- | ---- | -------------------- | -------------------- | ---------------------------------- |
| 1   | `benchmarks.ts`      | 152  | `time < bestTime`    | `<=`                 | Test with equal completion times   |
| 2   | `attemptStats.ts`    | 34   | `Math.min(...)`      | `Math.max`           | Assert PB is minimum time          |
| 3   | `attemptStats.ts`    | 50   | `< pbTime`           | `>`                  | Assert faster/slower indicator     |
| 4   | `splitComparison.ts` | 77   | `delta < 0`          | `> 0`                | Assert ahead/behind direction      |
| 5   | `splitComparison.ts` | 62   | `>= length`          | `>`                  | Test at last exercise index        |
| 6   | `benchmarks.ts`      | 233  | `=== bestTime`       | `!==`                | Assert PB badge on correct attempt |
| 7   | `benchmarks.ts`      | 86   | `a.localeCompare(b)` | `b.localeCompare(a)` | Verify exercise order              |

---

## Recommended Test Additions

### 1. PB Shows Minimum Time (Not Most Recent)

```typescript
it('shows minimum time as PB when multiple attempts exist', async () => {
  const benchmark = await createForTimeBenchmark()
  await createCompletedAttempt(benchmark.id, 90) // slowest
  await createCompletedAttempt(benchmark.id, 45) // fastest
  await createCompletedAttempt(benchmark.id, 60) // most recent

  const app = await createTestApp()
  await app.benchmarks.navigateToTab()

  // Should show fastest time (45s), not slowest (90s) or most recent (60s)
  await expect.element(page.getByText('PB: 0:45')).toBeVisible()
})
```

### 2. Split Comparison Shows Correct Direction

```typescript
it('shows "ahead" when current split is faster than PB split', async () => {
  const benchmark = await createForTimeBenchmark({
    exercises: [
      { name: 'Exercise 1', reps: 10 },
      { name: 'Exercise 2', reps: 10 },
    ],
  })
  // PB with 60s first split
  await createCompletedAttempt(benchmark.id, 120, 5, [60])

  const app = await createTestApp()
  await startBenchmarkWorkout(app, benchmark.id)

  // Wait a short time then complete (faster than 60s PB split)
  await new Promise((resolve) => setTimeout(resolve, 500))
  await completeExercise()

  // Should show "ahead" since we beat the 60s PB split
  await expect.element(page.getByText(/ahead/i)).toBeVisible()
})

it('shows "behind" when current split is slower than PB split', async () => {
  const benchmark = await createForTimeBenchmark({
    exercises: [
      { name: 'Exercise 1', reps: 10 },
      { name: 'Exercise 2', reps: 10 },
    ],
  })
  // PB with very fast 1s first split
  await createCompletedAttempt(benchmark.id, 60, 5, [1])

  const app = await createTestApp()
  await startBenchmarkWorkout(app, benchmark.id)

  // Wait longer than PB split
  await new Promise((resolve) => setTimeout(resolve, 2000))
  await completeExercise()

  // Should show "behind" since we're slower than 1s PB split
  await expect.element(page.getByText(/behind/i)).toBeVisible()
})
```

### 3. Exercise Order Verification

```typescript
it('exercises appear in defined order', async () => {
  const benchmark = await createForTimeBenchmark({
    exercises: [
      { name: 'Alpha Exercise', reps: 10 },
      { name: 'Beta Exercise', reps: 10 },
      { name: 'Gamma Exercise', reps: 10 },
    ],
  })

  const app = await createTestApp()
  await startBenchmarkWorkout(app, benchmark.id)

  // First exercise should be Alpha
  await expect.element(page.getByRole('heading', { name: 'Alpha Exercise' })).toBeVisible()

  await completeExercise()

  // Second should be Beta (not Gamma, not Alpha again)
  await expect.element(page.getByRole('heading', { name: 'Beta Exercise' })).toBeVisible()
  expect(await page.getByRole('heading', { name: 'Alpha Exercise' }).query()).toBeNull()

  await completeExercise()

  // Third should be Gamma
  await expect.element(page.getByRole('heading', { name: 'Gamma Exercise' })).toBeVisible()
})
```

### 4. PB Badge on Correct Attempt

```typescript
it('marks only the fastest attempt as PB in history', async () => {
  const benchmark = await createForTimeBenchmark()
  await createCompletedAttempt(benchmark.id, 90)
  await createCompletedAttempt(benchmark.id, 45) // This should be PB
  await createCompletedAttempt(benchmark.id, 60)

  const app = await createTestApp()
  await app.benchmarkDetail.navigateToDetail(benchmark.id)

  // Find PB badges - should only be one
  const pbBadges = await page.getByText(/personal best/i).all()
  expect(pbBadges).toHaveLength(1)

  // The 45s attempt should have the badge
  const attemptWithPb = await page
    .getByText('0:45')
    .locator('..')
    .getByText(/personal best/i)
  await expect.element(attemptWithPb).toBeVisible()
})
```

### 5. Equal Times Edge Case

```typescript
it('handles multiple attempts with equal times', async () => {
  const benchmark = await createForTimeBenchmark()
  await createCompletedAttempt(benchmark.id, 60, 2)
  await createCompletedAttempt(benchmark.id, 60, 0) // Same time, more recent

  const app = await createTestApp()
  await app.benchmarks.navigateToTab()

  // PB should still show 60s
  await expect.element(page.getByText('PB: 1:00')).toBeVisible()
})
```

---

## Root Cause

The integration tests verify **UI element presence** but not **value correctness**:

```typescript
// Current pattern (weak)
await expect.element(page.getByText('PB: 1:00')).toBeVisible()

// Needed pattern (strong)
// Setup: attempts with 90s, 45s, 60s
// Assert: PB shows 0:45 (minimum), not 1:30 (maximum) or 1:00 (most recent)
```

---

## Files to Modify

- `src/__tests__/integration/benchmark-results.spec.ts` - Add tests 1, 2, 4, 5
- `src/__tests__/integration/benchmark-execution.spec.ts` - Add test 3
