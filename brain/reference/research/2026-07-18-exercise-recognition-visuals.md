---
type: Research
title: Exercise recognition visuals for a large offline exercise library
description: Evidence from popular workout apps, asset libraries, and the local codebase on making exercises recognizable in compact lists.
resource: brain/reference/research/2026-07-18-exercise-recognition-visuals.md
tags: [research, exercises, icons, thumbnails, offline, ui]
timestamp: 2026-07-18T10:10:00Z
---

## Research: Exercise recognition visuals

**Date:** 2026-07-18  
**Status:** Complete

## Problem Statement

The exercise library contains 173 movements. Initial exploration tried to
identify them with a small set of reusable equipment glyphs and compositional
movement marks. At 48–56 px, those systems communicate categories but do not
reliably distinguish exercises that share equipment, such as bench press,
overhead press, barbell row, squat, and good morning.

The visual must work offline, scan quickly during a workout, fit the existing
dark UI, and avoid introducing a fragile database migration or a large media
dependency without first proving the design.

## Key Findings

### Exact identity remains textual

Popular workout apps do not encode hundreds of exact exercise identities with
a small generic icon vocabulary:

- Hevy pairs the full name and muscle label with an exercise-specific
  human-and-equipment illustration/animation. Equipment and muscle controls
  filter the library.
- Fitbod and JEFIT use exercise-specific photo or video-frame thumbnails. The
  full exercise name remains dominant.
- Freeletics uses exercise-specific athlete photos/video frames on movement
  cards. Generic equipment imagery appears in filters.
- Strong is text-first in workout/log views and shows exercise-specific
  illustrations, video, and instructions at the detail layer.
- Garmin keeps browse steps text-first, then opens an exercise animation and
  written instructions for form confirmation.

The repeated product pattern is:

1. Name, search, and filters identify the exercise.
2. An exercise-specific pose thumbnail accelerates scanning and recognition.
3. Animation/video confirms exact form.
4. Equipment glyphs and muscle maps provide category or target context; they
   do not identify the exact movement.

Lucide and Font Awesome reinforce the limitation: their dumbbell/running icons
represent broad fitness concepts, not individual lifts.

### No suitable broad open SVG library was found

- `free-exercise-db` contains 800+ exercises with two raster images per
  exercise and declares the Unlicense. Image provenance still deserves a
  separate commercial-use audit.
- wger exposes exercise images and license metadata, but licenses and visual
  style vary by entry. CC-BY-SA content also creates attribution/share-alike
  obligations.
- Atlas and Tabler provide coherent permissive SVGs for equipment, filters,
  and generic activities, not hundreds of distinct exercise poses.
- Mixed SVG repositories have shallow, inconsistent coverage.

Commercial libraries provide the missing exercise-specific coverage:

- WorkoutLabs: 679 professionally drawn exercises with SVG/PNG/animation;
  expensive licensing.
- RepDB: 478 illustrated exercises in flat/3D styles; raster and animated
  formats.
- MoveKit and Vital Animations: hundreds of licensed motion assets with lower
  one-time pricing, but not SVG and raw redistribution restrictions apply.
- ExerciseDB, ExRx, and MuscleWiki have storage or redistribution terms that
  conflict with an offline/local-first bundled library unless separately
  licensed.

### A small number of pose families can reduce production work

The app should not attempt to render exact identity from 12 abstract glyphs.
However, it also does not need 173 completely unrelated drawings. A practical
middle ground is approximately 35–50 recognizable human-and-equipment pose
families, reused only for genuinely close variants. Equipment changes should
be drawn into the scene. The text label should carry fine distinctions such as
grip width when that difference disappears at list size.

## Codebase Patterns

- `src/components/ExerciseAvatar.vue` is the central rendering seam. It is
  reused by exercise lists, workout queues, templates, timed blocks, and
  benchmarks. It currently renders `uploaded Blob > initials`.
- The 173 built-in records in `src/data/popularExercises.ts` have canonical
  names but no stable built-in IDs or asset keys. Seeding assigns random UUIDs,
  and existing installations are not reseeded when the table is non-empty.
- Exercise images are WebP blobs and are denormalized into workouts, templates,
  timed blocks, and benchmarks. Adding more blobs would increase IndexedDB
  duplication.
- Current JSON export/import does not round-trip image blobs safely; validation
  expects `image: null`. This is a separate backup defect worth addressing.
- Bundled code-owned SVG assets are compatible with offline use. Remotely
  fetched media is not appropriate for the primary recognition path.
- A canonical-name-to-asset registry can upgrade existing installations and
  historical records without changing IndexedDB. Rendering priority can be
  `uploaded image > bundled pose thumbnail > initials`.
- Persisting an editable `assetKey` would require schema, converter, seed
  backfill, export, and denormalized snapshot changes. Defer this unless users
  must select or retain icons through renames.

## Recommended Approach

Prototype exercise-specific pose thumbnails rather than more abstract glyph
grammars:

1. Use a 56×56 px rounded dark tile.
2. Draw one bold human silhouette in the movement's most recognizable key pose.
3. Integrate equipment into the same scene rather than using a corner badge.
4. Use warm gray/white for the figure and restrained purple on the moving
   resistance or active limb.
5. Keep the full exercise name and muscle label visible.
6. Build 35–50 core pose families, then curate variations for the 173 canonical
   names through a code-owned registry.
7. Resolve assets in `ExerciseAvatar.vue` by canonical name so the prototype
   requires no database migration and works for existing installations.
8. Keep equipment SVGs for filters and categories only.

Before producing the full set, compare three treatments on confusable real
exercises: barbell bench press, dumbbell bench press, incline press, overhead
press, barbell row, and cable fly.

- Simplified grayscale anatomy (Hevy-like)
- Bold filled silhouette with purple equipment
- Minimal line character with purple target/moving element

Evaluate recognition at the actual 48–56 px list size. If a variant difference
cannot be read at that size, rely on the name instead of adding visual noise.

## Sources

- [Hevy exercise library](https://www.hevyapp.com/features/exercise-library/) - Exercise-specific animations plus equipment/muscle filtering.
- [Fitbod exercises](https://fitbod.me/about-fitbod-exercises/) - Large video-based exercise library and equipment coverage.
- [Fitbod getting started](https://help.fitbod.me/hc/en-us/sections/360001927994-Getting-Started) - Current detail and video behavior.
- [Strong custom exercises](https://help.strongapp.io/article/97-create-custom-exercises) - Built-in library, instructions, and video support.
- [JEFIT on Google Play](https://play.google.com/store/apps/details?id=je.fit) - Exercise count and HD video guides.
- [Freeletics](https://www.freeletics.com/) - Exercise-specific movement presentation.
- [Garmin premade workouts](https://www.garmin.com/en-US/blog/general/pre-made-workouts-from-garmin-connect/) - Names in steps with selectable animations and instructions.
- [Lucide dumbbell icon](https://lucide.dev/icons/dumbbell) - Broad category semantics of a generic equipment icon.
- [free-exercise-db](https://github.com/yuhonas/free-exercise-db) - Broad raster start/end exercise dataset.
- [wger documentation](https://wger.readthedocs.io/en/latest/) - Open exercise API and data model.
- [WorkoutLabs licensing](https://workoutlabs.com/exercise-illustrations-licensing/) - Commercial SVG/animation exercise artwork.
- [RepDB](https://repdb.co/) - Commercial illustrated exercise dataset.
- [MoveKit licensing](https://movekit.com/licensing) - Commercial exercise animation usage and redistribution terms.
- [ExerciseDB terms](https://exercisedb.io/terms) - Storage and usage restrictions relevant to local-first apps.
- [ExRx legal terms](https://exrx.net/Notes/Legal) - Content licensing and hotlink restrictions.
- [MuscleWiki disclaimer](https://musclewiki.com/de-de/disclaimer) - Redistribution limits for exercise media and muscle maps.
