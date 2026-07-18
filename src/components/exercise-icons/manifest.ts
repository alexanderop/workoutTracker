import type { ExerciseIconManifestEntry } from './types'

/**
 * Authored source of truth for bundled exercise artwork.
 *
 * This first pack intentionally covers only the ten Bold Pose pilot exercises.
 * Run `pnpm generate:exercise-icons` after changing it.
 */
export const exerciseIconManifest = [
  {
    key: 'barbell-bench-press',
    title: 'Bench Press',
    component: 'BenchPressIcon',
    aliases: ['Bench Press', 'Barbell Bench Press'],
    poseFamily: 'horizontal-press',
    equipment: ['barbell', 'bench'],
    muscles: ['chest'],
  },
  {
    key: 'barbell-row',
    title: 'Barbell Row',
    component: 'BarbellRowIcon',
    aliases: ['Barbell Row', 'Bent-over Barbell Row'],
    poseFamily: 'hinged-pull',
    equipment: ['barbell'],
    muscles: ['back'],
  },
  {
    key: 'barbell-deadlift',
    title: 'Deadlift',
    component: 'DeadliftIcon',
    aliases: ['Deadlift', 'Barbell Deadlift', 'Conventional Deadlift'],
    poseFamily: 'hinge',
    equipment: ['barbell'],
    muscles: ['back', 'legs'],
  },
  {
    key: 'barbell-back-squat',
    title: 'Squat',
    component: 'SquatIcon',
    aliases: ['Squat', 'Barbell Squat', 'Back Squat', 'Barbell Back Squat'],
    poseFamily: 'squat',
    equipment: ['barbell'],
    muscles: ['legs'],
  },
  {
    key: 'barbell-overhead-press',
    title: 'Overhead Press',
    component: 'OverheadPressIcon',
    aliases: ['Overhead Press', 'Barbell Overhead Press', 'Strict Press', 'Military Press'],
    poseFamily: 'vertical-press',
    equipment: ['barbell'],
    muscles: ['shoulders'],
  },
  {
    key: 'dumbbell-curl',
    title: 'Dumbbell Curl',
    component: 'DumbbellCurlIcon',
    aliases: ['Dumbbell Curl', 'Dumbbell Biceps Curl', 'Biceps Curl'],
    poseFamily: 'standing-curl',
    equipment: ['dumbbell'],
    muscles: ['arms'],
  },
  {
    key: 'bodyweight-plank',
    title: 'Plank',
    component: 'PlankIcon',
    aliases: ['Plank', 'Forearm Plank'],
    poseFamily: 'prone-brace',
    equipment: ['bodyweight'],
    muscles: ['core'],
  },
  {
    key: 'kettlebell-swing',
    title: 'Kettlebell Swing',
    component: 'KettlebellSwingIcon',
    aliases: ['Kettlebell Swing', 'Two-handed Kettlebell Swing', 'Russian Kettlebell Swing'],
    poseFamily: 'ballistic-hinge',
    equipment: ['kettlebell'],
    muscles: ['back', 'legs'],
  },
  {
    key: 'kettlebell-goblet-squat',
    title: 'Kettlebell Goblet Squat',
    component: 'KettlebellGobletSquatIcon',
    aliases: ['Kettlebell Goblet Squat', 'Goblet Squat'],
    poseFamily: 'goblet-squat',
    equipment: ['kettlebell'],
    muscles: ['legs'],
  },
  {
    key: 'kettlebell-turkish-get-up',
    title: 'Kettlebell Turkish Get-up',
    component: 'KettlebellTurkishGetUpIcon',
    aliases: ['Kettlebell Turkish Get-up', 'Turkish Get-up'],
    poseFamily: 'ground-to-standing',
    equipment: ['kettlebell'],
    muscles: ['core', 'shoulders'],
  },
] as const satisfies ReadonlyArray<ExerciseIconManifestEntry>
