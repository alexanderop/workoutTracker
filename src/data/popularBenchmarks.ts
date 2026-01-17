import type { BenchmarkType } from '@/types/benchmark'

/**
 * Exercise within a popular benchmark round.
 */
type PopularBenchmarkExercise = {
  exerciseDefinitionId: null
  name: string
  prescribedReps: number
  image: null
}

/**
 * Round within a popular benchmark.
 */
type PopularBenchmarkRound = {
  exercises: ReadonlyArray<PopularBenchmarkExercise>
}

/**
 * Popular benchmark definition (without runtime fields like id, createdAt).
 * Uses exerciseDefinitionId: null for loose coupling - exercises are referenced by name only.
 */
export type PopularBenchmark = {
  name: string
  type: BenchmarkType
  rounds: ReadonlyArray<PopularBenchmarkRound>
}

/**
 * Helper to create an exercise entry.
 */
function exercise(name: string, reps: number): PopularBenchmarkExercise {
  return { exerciseDefinitionId: null, name, prescribedReps: reps, image: null }
}

/**
 * Helper to create a round with exercises.
 */
function round(...exercises: Array<PopularBenchmarkExercise>): PopularBenchmarkRound {
  return { exercises }
}

/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * POPULAR BENCHMARK WORKOUTS - "THE GIRLS"
 * ═══════════════════════════════════════════════════════════════════════════════
 *
 * Classic CrossFit benchmark workouts for performance tracking.
 * All workouts are ForTime (complete as fast as possible).
 *
 * INCLUDED:
 * - Fran (21-15-9): Thrusters, Pull-ups
 * - Grace (30 reps): Clean & Jerk
 * - Diane (21-15-9): Deadlift, Handstand Push-ups
 * - Helen (3 rounds): 400m Run, KB Swing, Pull-ups
 * - Elizabeth (21-15-9): Barbell Clean, Ring Dip
 * - Isabel (30 reps): Barbell Snatch
 * - Jackie (1 round): 1000m Row, Thrusters, Pull-ups
 * - Karen (150 reps): Wall Ball
 * - Annie (50-40-30-20-10): Double-unders, Sit-ups
 * - Nancy (5 rounds): 400m Run, Overhead Squat
 * - Venus (4 rounds): Push-ups, Sit-ups, Squats
 */
export const popularBenchmarks: ReadonlyArray<PopularBenchmark> = [
  // ───────────────────────────────────────────────────────────────────────────────
  // FRAN - 21-15-9 Thrusters and Pull-ups
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Fran',
    type: 'fortime',
    rounds: [
      round(exercise('Barbell Thruster', 21), exercise('Pull-ups', 21)),
      round(exercise('Barbell Thruster', 15), exercise('Pull-ups', 15)),
      round(exercise('Barbell Thruster', 9), exercise('Pull-ups', 9)),
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // GRACE - 30 Clean & Jerks for time
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Grace',
    type: 'fortime',
    rounds: [round(exercise('Clean & Jerk', 30))],
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // DIANE - 21-15-9 Deadlifts and Handstand Push-ups
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Diane',
    type: 'fortime',
    rounds: [
      round(exercise('Deadlift', 21), exercise('Handstand Push-ups', 21)),
      round(exercise('Deadlift', 15), exercise('Handstand Push-ups', 15)),
      round(exercise('Deadlift', 9), exercise('Handstand Push-ups', 9)),
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // HELEN - 3 rounds: 400m Run, 21 KB Swings, 12 Pull-ups
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Helen',
    type: 'fortime',
    rounds: [
      round(exercise('Run', 1), exercise('Kettlebell Swing', 21), exercise('Pull-ups', 12)),
      round(exercise('Run', 1), exercise('Kettlebell Swing', 21), exercise('Pull-ups', 12)),
      round(exercise('Run', 1), exercise('Kettlebell Swing', 21), exercise('Pull-ups', 12)),
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // ELIZABETH - 21-15-9 Cleans and Ring Dips
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Elizabeth',
    type: 'fortime',
    rounds: [
      round(exercise('Barbell Clean', 21), exercise('Ring Dip', 21)),
      round(exercise('Barbell Clean', 15), exercise('Ring Dip', 15)),
      round(exercise('Barbell Clean', 9), exercise('Ring Dip', 9)),
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // ISABEL - 30 Snatches for time
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Isabel',
    type: 'fortime',
    rounds: [round(exercise('Barbell Snatch', 30))],
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // JACKIE - 1000m Row, 50 Thrusters, 30 Pull-ups
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Jackie',
    type: 'fortime',
    rounds: [
      round(
        exercise('Rowing Machine', 1),
        exercise('Barbell Thruster', 50),
        exercise('Pull-ups', 30),
      ),
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // KAREN - 150 Wall Balls for time
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Karen',
    type: 'fortime',
    rounds: [round(exercise('Wall Ball', 150))],
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // ANNIE - 50-40-30-20-10 Double-unders and Sit-ups
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Annie',
    type: 'fortime',
    rounds: [
      round(exercise('Double-under', 50), exercise('Sit-ups', 50)),
      round(exercise('Double-under', 40), exercise('Sit-ups', 40)),
      round(exercise('Double-under', 30), exercise('Sit-ups', 30)),
      round(exercise('Double-under', 20), exercise('Sit-ups', 20)),
      round(exercise('Double-under', 10), exercise('Sit-ups', 10)),
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // NANCY - 5 rounds: 400m Run, 15 Overhead Squats
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Nancy',
    type: 'fortime',
    rounds: [
      round(exercise('Run', 1), exercise('Overhead Squat', 15)),
      round(exercise('Run', 1), exercise('Overhead Squat', 15)),
      round(exercise('Run', 1), exercise('Overhead Squat', 15)),
      round(exercise('Run', 1), exercise('Overhead Squat', 15)),
      round(exercise('Run', 1), exercise('Overhead Squat', 15)),
    ],
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // VENUS - 4 rounds: 50 Push-ups, 20 Sit-ups, 50 Squats
  // ───────────────────────────────────────────────────────────────────────────────
  {
    name: 'Venus',
    type: 'fortime',
    rounds: [
      round(exercise('Push-ups', 50), exercise('Sit-ups', 20), exercise('Bodyweight Squat', 50)),
      round(exercise('Push-ups', 50), exercise('Sit-ups', 20), exercise('Bodyweight Squat', 50)),
      round(exercise('Push-ups', 50), exercise('Sit-ups', 20), exercise('Bodyweight Squat', 50)),
      round(exercise('Push-ups', 50), exercise('Sit-ups', 20), exercise('Bodyweight Squat', 50)),
    ],
  },
]
