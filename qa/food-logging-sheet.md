# QA — Food logging sheet

- Plan: `brain/plans/food-logging-sheet.md`
- Branch: `feat/food-logging-sheet`
- Date: 2026-07-26

## Verdict

**SHIP**

## What was verified

### Automated

| Tier | Command | Result |
|---|---|---|
| unit | `pnpm exec vitest run --project=unit src/__tests__/unit/nutrition` | 33 passed |
| default | `pnpm exec vitest run --project=default src/__tests__/features/nutrition src/__tests__/integration src/__tests__/db` | 662 passed, 1 pre-existing failure (below) |
| arch | `pnpm exec vitest run --project=arch src/__tests__/architecture/unitTierImports.test.ts` | 3 passed |
| a11y | `pnpm exec vitest run --project=a11y` | 10 passed |
| visual | `pnpm exec vitest run --project=visual` | 9 passed |
| gate | `pnpm lint`, `pnpm type-check`, `pnpm test:unit`, `pnpm knip` | clean |

### Real browser (agent-browser, 390x844)

Ran against `pnpm dev`, seeded from an empty database:

1. Custom tab → created "Skyr" (400 g, 240/44/14/1) → staged. All four budget
   bars moved as translucent staged segments; `Log (1)` enabled.
2. Tapped the staged chip → grams stepper showed `400g` with `−`/`+`/`Remove`.
3. Committed → sheet closed, toast "Logged 1 to Snacks", day totals updated to
   240 kcal / 44 g / 1 g / 14 g.
4. Reopened → "Skyr" listed under RECENTLY USED with
   `240 kcal · P 44g · F 1g · C 14g` and `400 g · serving`; single `+` tap
   staged it, nine taps reached `Log (9)` with no keyboard at any point.
5. **Overflow**: at nine staged, `kcal 2400/2200` and `P 440/160` rendered in
   the destructive token with the target tick visible inside the bar, while
   `F 10/70` and `C 140/240` stayed clean. This is the Option-B behaviour the
   plan's last decision turned on, and the defect it replaced (a clamped bar
   that renders 2210/2200 and 4000/2200 identically) is gone.

## Acceptance criteria

| # | Criterion | Evidence |
|---|---|---|
| 1 | Three known foods, no keyboard | Browser step 4; `food-log.spec.ts` "finds a library food by search and stages it with one tap" |
| 2 | One write per basket, atomic | `db/nutrition.spec.ts` "rolls the whole basket back when one member write fails" |
| 3 | Modes do not destroy the basket | `food-log.spec.ts` "keeps the basket when the sheet is closed and reopened" |
| 4 | Search by name and brand, fold case/accents | `unit/nutrition/foodSearch.spec.ts`; browser step 4 |
| 5 | Quick add records macros with no food | `food-log.spec.ts` "stages three foods across modes"; asserts `foodId: null` and an untouched library |
| 6 | Budget moves as you stage, overflow visible | Browser steps 1 and 5; `unit/nutrition/budgetSegments.spec.ts` |
| 7 | Entry point seeds the meal, editable | `nutrition-barcode-scan.spec.ts` asserts `meal: 'snack'` from the dashboard's Snacks row; browser toast read "Logged 1 to Snacks" |
| 8 | Inherited sheet/keyboard rules | Sheet reuses `MobileDialogContent`; body is the only scroll container; a11y tier green |

## Known issues

- `src/__tests__/integration/rir-zero-value.spec.ts` fails when the whole
  `integration/` directory runs in parallel, and passes in isolation.
  **Pre-existing**: reproduced on this branch with every change stashed
  (`git stash -u`), same single failure. Unrelated to nutrition — it is the
  workout RIR numeric-input modal. Not introduced here, not fixed here.

## Caveats

- Scanning now stages straight into the basket instead of prefilling a form to
  confirm. Deliberate (the barcode answers everything the form asked, and the
  grams stepper covers the rest), but it is a behaviour change for anyone used
  to reviewing the scanned values before saving.
- ~~`useNutritionDay.calorieProgress` still clamps at 100~~ — closed as a
  follow-up in this branch. The clamp stays (the ring and `Progress` are 0–100
  by contract), but the dashboard now turns the ring and headline number
  destructive past the goal and draws a goal marker on the bar. Verified in the
  browser at 2,500 / 2,200: ring red, centre reads "300 kcal over", marker at
  88% of the bar. Covered by `nutrition-dashboard.spec.ts` "shows how far past
  the calorie goal the day went". Visual baselines were **not** regenerated —
  the under-goal render is unchanged and the `visual` tier passes as-is.
