# Question Format

How grill *shows* a question, as opposed to which question it asks (that is
RESEARCH-GATE.md's coverage ledger). The rule is simple: **a question about a
code shape must carry that shape.** "Should the rest timer live in the store or
in the component?" gets a shrug; two component trees side by side get a decision
in five seconds.

## The quadruple

Every interview question is presented as four parts, in this order:

> 1. **The view** — a code block rendering the shape under discussion. When you
>    are offering options, **each option gets its own code block**, so the user
>    compares real shapes rather than a description of them.
> 2. **The question** — one decision, stated plainly.
> 3. **Why it matters** — what breaks or gets harder if it is unspecified.
> 4. **Default-if-silent** — the option you would take, and why.

The view comes first because it is what the user actually reads. Prose that
describes a shape the user cannot see is the failure mode this format exists to
prevent.

**Almost every question should carry a view.** If you catch yourself explaining a
code change in words alone, convert it into one of the views below before
sending. The exceptions are genuine product-intent questions ("should a skipped
set count toward the AMRAP total?") — there is no code shape to draw, so ask
them as a plain triple.

## The view catalog

| View | Use for |
|------|---------|
| Vue component tree | UI changes — which component owns what, where props/emits cross, feature boundaries |
| State-ownership map | `createGlobalState` vs module-scoped ref vs component-local — the seam under a state question |
| File-tree diff | refactors and file-responsibility calls — `+` new, `~` modified, with `# NEW` / `# MODIFIED` |
| Dexie schema + converter delta | any change to persisted shape — old version, new version, and the converter between them |
| Repository / codec signature | boundaries between a feature and `src/db` or `@/blocks` |
| Type signature / discriminated union | UI state modeling, block kinds, anything where invalid combinations are the risk |
| Testing seam map | behavior → what gets faked → which test file, for Vitest browser mode |
| Pseudocode | algorithms — progression math, timer scheduling, aggregation. English-y, not real code |
| Mermaid sequence / flow | cross-component or lifecycle interaction — offline write path, wake lock, reload recovery |
| ASCII or HTML mockup, Option A vs Option B inline | anything visual — layout, what is on screen mid-set |

## Examples

### Vue component tree — two options, two blocks

**Option A — timer state in the feature store**

```text
RestTimerStore (createGlobalState)   # owns remaining, running, startedAt
└── WorkoutSessionView
    ├── SetRow            reads remaining
    └── RestTimerBar      reads remaining, calls stop()
```

**Option B — timer state local to the bar**

```text
WorkoutSessionView
├── SetRow               emits set-logged
└── RestTimerBar         owns remaining, running, startedAt
```

Then the question, why it matters, and the default.

### Dexie schema + converter delta

```text
v7  workouts: 'id, startedAt, templateId'
v8  workouts: 'id, startedAt, templateId, bodyweightKg'   # MODIFIED

converter v7→v8: bodyweightKg ← undefined (reads fall back to profile value)
converter v8→v7: drop bodyweightKg (lossy — flag in the plan)
```

### File-tree diff

```text
src/features/rest-timer/
+ useRestTimer.ts          # NEW  — wake-lock + tick, one owner
~ RestTimerBar.vue         # MODIFIED — drops its local interval
~ index.ts                 # MODIFIED — exports useRestTimer
```

### Testing seam map

```text
behavior: timer survives a reload mid-rest
  fake:   Date.now via vi.useFakeTimers; IndexedDB is real (browser mode)
  test:   src/__tests__/rest-timer-persistence.test.ts
```

## Rules

- **One view per option, never one view for all options.** A single block with
  `// or, alternatively:` inside it defeats the point.
- **Draw the shape, not the whole file.** The view is the smallest rendering
  that makes the decision obvious — signatures and structure, not bodies.
- **Views are sketches, not commitments.** They exist to make the question
  answerable; the plan's contracts are written after the answer.
- **Never ask for vague feedback.** "Any thoughts on this?" is not a question.
  Ask the specific decision, with the specific options.
