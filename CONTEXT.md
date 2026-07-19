# Workout Tracker

The domain language for a local-first workout tracking PWA. Everything revolves around composing, executing, and persisting workouts made of typed blocks. Block types and the registry in `src/blocks/` are authoritative; this file is the vocabulary.

## Language

**Workout**:
A single training session composed of an ordered list of Blocks.
_Avoid_: session, routine

**Block**:
One unit of work inside a Workout, discriminated by its Kind.
_Avoid_: segment, section, workout type

**Kind**:
The discriminator of a Block: `strength`, `amrap`, `emom`, `tabata`, `fortime`, or `cardio`.
_Avoid_: type, workout type, block type

**Config**:
The per-Kind setup of a Block, fixed before execution (e.g. EMOM minutes, Tabata rounds).
_Avoid_: settings, options

**Result**:
The per-Kind outcome recorded when a non-strength Block finishes; `result !== null` is what "complete" means for those Kinds.
_Avoid_: score, outcome

**Set**:
A single strength attempt with reps/weight/duration and a status; strength completion lives in `sets[].status`, never in a Result.
_Avoid_: round

**Block Exercise**:
An exercise entry inside a timed Block (Tabata carries exactly one, on the singular `exercise` field).
_Avoid_: movement

**Template**:
A reusable blueprint of Blocks without Sets or Results, instantiated into a Workout.
_Avoid_: plan, preset

**Benchmark**:
A named reference workout executed as a ForTime Block so results are comparable over time.

**Block Codec**:
The per-Kind module that owns every representation mapping for that Kind — domain ⇄ database (`toDb`/`fromDb`), the database zod schema, the markdown format/parse pair, and template ⇄ workout — behind one seam.
_Avoid_: converter, serializer, plugin

**Codec Registry**:
The exhaustive Kind → Block Codec map that is the single runtime dispatch for all per-Kind representation work.
_Avoid_: converter registry, switch

## Relationships

- A **Workout** contains one or more **Blocks**, ordered by `orderIndex`
- Every **Block** has exactly one **Kind**, which selects its **Config**, **Result** shape, and **Block Codec**
- A strength **Block** contains **Sets**; timed **Blocks** contain **Block Exercises** and may hold a **Result**
- A **Template** produces **Workouts**; a **Benchmark** executes as a ForTime **Block**
- The **Codec Registry** maps each **Kind** to its **Block Codec**

## Example dialogue

> **Dev:** "Adding `tempo` to the strength **Config** — how many files?"
> **Domain expert:** "The strength **Block Codec** and the domain type. The **Codec Registry** dispatches everything else; if it type-checks, every representation is covered."
> **Dev:** "And is a cardio **Block** done when its timer ends?"
> **Domain expert:** "Cardio isn't timed — it's done when a **Result** is set, same rule as every non-strength **Kind**."

## Flagged ambiguities

- "workout type" historically meant what we now call **Kind** — a property of
  a **Block**, not of a **Workout**. Resolved: say **Kind**.
- "exercise" is overloaded: an exercise _definition_ (the catalog entry in `src/features/exercises/`) vs a **Block Exercise** (an entry inside a timed Block). Say which one.
- "converter" historically meant the hand-written `src/db/converters.ts` functions; these are becoming the `toDb`/`fromDb` half of a **Block Codec**.
