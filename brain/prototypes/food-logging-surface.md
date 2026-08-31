# Food Logging Surface

Resolved: implemented as `src/features/nutrition/components/FoodLogSheet.vue`
(tabs: search/scan/quick/custom) + `FoodBasketTray.vue`/`FoodBudgetBars.vue`
(staging basket + budget feedback). The `nutrition-log-prototype` directory
and route below have been deleted per the Decision. Neither graft below (the
numeric quick-add parse, the Gegessen/Übrig toggle) was carried into the real
implementation as of 2026-08-31 — `FoodQuickAddPanel.vue` still uses four
separate numeric fields, and `NutritionDashboardCard.vue` shows only a single
fixed remaining/over-goal number with no toggle.

Question:
What structure should replace `FoodLogDialog.vue`? Today it is one form doing
four jobs: a `NativeSelect` over the whole food library (no search), barcode
hidden behind "new food", one item per dialog open, and no budget feedback.
MacroFactor's listing screenshots suggested tabs + a staging basket — but three
structures were plausible, and they disagree about whether logging is a modal
session, a query, or direct manipulation of the day. No AI in any of them.

Artifact:
`src/features/nutrition-log-prototype/` — route `/nutrition-log-prototype`,
variants via `?variant=A|B|C`, arrow keys or the floating switcher to cycle.

```bash
pnpm dev
```

Variants:

- **A — Tabs + Korb.** Full-height sheet. Persistent chrome (close, date, staged
  tray, "Loggen (N)"), four budget bars where staged items render as a
  translucent segment on top of committed, mode tabs `Suche · Scan · Schnell ·
  Eigenes`. Batch commit.
- **B — Omnibox, sofort.** One field, no tabs. Letters search the library;
  numbers become a quick-add (`650 45p 20f` → 650 kcal · 45P 20F); a final row
  offers to create the typed name. Tap logs instantly, undo bar catches
  mistakes.
- **C — Inline, kein Sheet.** No overlay. Budget pinned at top with a
  Gegessen/Übrig toggle, hour rail below, permanent bottom bar that expands
  upward into a results drawer. Taps land straight in the timeline; the drawer
  stays open for the next item.

Observed while driving them (not yet the user's verdict):

- A's translucent staged segment on the budget bars is the clearest "what will
  this cost me" signal of the three.
- B's numeric parse is the cheapest manual path by a wide margin — no mode, no
  navigation. One bug found and fixed: `hasLetters` matched the `p`/`f` suffixes,
  so the "create new food" row appeared for numeric queries.
- C delivers instant multi-add without a basket, but on a 375×812 viewport the
  drawer covers the hour rail, so the inserted row's flash confirmation is not
  visible — only the budget numbers move. C's core promise ("the day stays
  visible") is weaker in practice than on paper.
- All three make the existing `foodId: string | null` schema field earn its
  keep: quick-add writes a diary entry with no library food, which nothing in
  the production app currently does.

Verdict:
**A wins.** Logging is a session you commit, not a stream of instant writes. The
basket plus the staged-vs-committed budget split is the thing worth building;
tabs beat a query-driven omnibox for discoverability of Scan and Quick Add.

Graft from the runners-up:

- **From B: the numeric parse.** `650 45p 20f` → 650 kcal · 45P 20F is the
  cheapest manual path found in any variant, and it belongs inside A's
  "Schnell" tab as an alternative to four separate number fields. Watch the bug
  this prototype hit: a letters test matches the `p`/`f`/`c` suffixes, so
  "is this a food name or macros?" cannot be decided by "does it contain
  letters".
- **From C: the Gegessen/Übrig toggle** on the day's budget. Independent of the
  sheet, cheap, and it answers "how much do I have left" without arithmetic.

Rejected: C's no-overlay model. On a 375×812 phone the drawer covers the hour
rail anyway, so it pays the cost of a modal without the benefit.

Decision:
Absorb A into real code through `implement`. Delete
`src/features/nutrition-log-prototype/`, its route in `src/router/index.ts`, and
the two `nav.foodLoggingPrototypes` i18n keys as part of that change — the
prototype is reference material until then, not shipping evidence.
